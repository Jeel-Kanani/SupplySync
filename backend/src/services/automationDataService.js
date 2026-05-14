import { AUTOMATION_LOG_STATUS, SOURCE_TYPES } from '../config/constants.js';
import { Product } from '../models/Product.js';
import { Supplier } from '../models/Supplier.js';
import { PriceHistory } from '../models/PriceHistory.js';
import { SourceCheckHistory } from '../models/SourceCheckHistory.js';
import { recalculateProduct } from './productCalculationService.js';
import { normalizeNameKey, isValidHttpUrl } from '../automation/utils/sourceUtils.js';

export const recordSourceCheck = async ({
  normalizedProduct,
  status = AUTOMATION_LOG_STATUS.SUCCESS,
  executionTime = 0,
  errorMessage = ''
}) =>
  SourceCheckHistory.create({
    sourceType: normalizedProduct.sourceType,
    sourceUrl: normalizedProduct.sourceUrl || 'unknown',
    sourceName: normalizedProduct.supplierName || normalizedProduct.productName || '',
    status,
    extractedData: normalizedProduct,
    errorMessage,
    executionTime,
    checkedAt: normalizedProduct.detectedAt ? new Date(normalizedProduct.detectedAt) : new Date()
  });

export const recordFailedSourceCheck = async ({
  sourceType,
  sourceUrl,
  sourceName = '',
  error,
  executionTime = 0
}) =>
  SourceCheckHistory.create({
    sourceType,
    sourceUrl: sourceUrl || 'unknown',
    sourceName,
    status: AUTOMATION_LOG_STATUS.FAILED,
    extractedData: {},
    errorMessage: error?.message || String(error),
    executionTime,
    checkedAt: new Date()
  });

export const applyNormalizedProductUpdate = async (normalizedProduct) => {
  const sourceCheck = await recordSourceCheck({ normalizedProduct });
  const supplier = await findOrCreateSupplier(normalizedProduct);
  const product = await findMatchingProduct(normalizedProduct.productName);

  if (!product) {
    return {
      sourceCheck,
      supplier,
      product: null,
      matched: false,
      priceChanged: false,
      recalculated: false,
      message: 'No existing product matched the extracted product name'
    };
  }

  const updateResult = await updateProductSupplierRelationship(product, supplier, normalizedProduct);
  const snapshot = await recalculateProduct(product._id);

  return {
    sourceCheck,
    supplier,
    product,
    matched: true,
    priceChanged: updateResult.priceChanged,
    priceHistory: updateResult.priceHistory,
    recalculated: true,
    snapshot
  };
};

const findOrCreateSupplier = async (normalizedProduct) => {
  const supplierName = normalizedProduct.supplierName || 'Unknown Automation Supplier';
  const sourceUrl = normalizedProduct.sourceUrl || '';
  const websiteSource =
    [SOURCE_TYPES.WEBSITE, SOURCE_TYPES.INDIAMART].includes(normalizedProduct.sourceType) &&
    isValidHttpUrl(sourceUrl);

  const sourceQuery = websiteSource ? { website: sourceUrl } : null;
  const nameQuery = supplierName
    ? { name: new RegExp(`^${escapeRegExp(supplierName)}$`, 'i') }
    : null;
  const supplier = await Supplier.findOne({
    $or: [sourceQuery, nameQuery].filter(Boolean)
  });

  if (supplier) {
    if (websiteSource && !supplier.website) {
      supplier.website = sourceUrl;
      await supplier.save();
    }

    return supplier;
  }

  return Supplier.create({
    supplierId: await buildSupplierId(supplierName),
    name: supplierName,
    website: websiteSource ? sourceUrl : '',
    reliabilityScore: 50,
    isActive: true,
    averageDeliveryDays: 7
  });
};

const findMatchingProduct = async (productName) => {
  if (!productName) return null;

  const exactProduct = await Product.findOne({
    name: new RegExp(`^${escapeRegExp(productName)}$`, 'i')
  });

  if (exactProduct) return exactProduct;

  const productNameKey = normalizeNameKey(productName);
  const candidates = await Product.find({ $text: { $search: productName } }).limit(5).catch(() => []);

  return (
    candidates.find((candidate) => normalizeNameKey(candidate.name) === productNameKey) ||
    candidates[0] ||
    null
  );
};

const updateProductSupplierRelationship = async (product, supplier, normalizedProduct) => {
  const supplierId = supplier._id.toString();
  const relationships = product.suppliers || [];
  const existingRelationship = relationships.find(
    (relationship) => String(relationship.supplier) === supplierId
  );
  const newPrice = Number(normalizedProduct.price || 0);
  const rawStockQuantity = normalizedProduct.rawData?.stockQuantity;
  const stockQuantity =
    rawStockQuantity === null || rawStockQuantity === undefined
      ? null
      : Number(rawStockQuantity);
  let priceChanged = false;
  let priceHistory = null;

  if (existingRelationship) {
    const oldPrice = Number(existingRelationship.buyPrice || 0);

    if (newPrice > 0 && oldPrice !== newPrice) {
      priceChanged = true;
      priceHistory = await PriceHistory.create({
        product: product._id,
        supplier: supplier._id,
        oldPrice,
        newPrice,
        sourceType: normalizedProduct.sourceType,
        sourceUrl: normalizedProduct.sourceUrl,
        rawData: normalizedProduct.rawData
      });
      existingRelationship.buyPrice = newPrice;
    }

    existingRelationship.isAvailable = normalizedProduct.availability !== false;
    existingRelationship.stockQuantity =
      stockQuantity !== null
        ? Math.max(stockQuantity, 0)
        : normalizedProduct.availability === false
          ? 0
          : existingRelationship.stockQuantity;
    existingRelationship.lastCheckedAt = new Date(normalizedProduct.detectedAt);
    existingRelationship.notes = buildAutomationNote(normalizedProduct);
  } else {
    product.suppliers.push({
      supplier: supplier._id,
      buyPrice: newPrice,
      isAvailable: normalizedProduct.availability !== false,
      stockQuantity:
        stockQuantity !== null
          ? Math.max(stockQuantity, 0)
          : normalizedProduct.availability === false
            ? 0
            : 10,
      deliveryDays: supplier.averageDeliveryDays || 7,
      notes: buildAutomationNote(normalizedProduct),
      lastCheckedAt: new Date(normalizedProduct.detectedAt)
    });

    if (newPrice > 0) {
      priceChanged = true;
      priceHistory = await PriceHistory.create({
        product: product._id,
        supplier: supplier._id,
        oldPrice: 0,
        newPrice,
        sourceType: normalizedProduct.sourceType,
        sourceUrl: normalizedProduct.sourceUrl,
        rawData: normalizedProduct.rawData
      });
    }
  }

  product.activeSupplier = product.activeSupplier || supplier._id;
  await product.save();

  await Supplier.updateOne(
    { _id: supplier._id },
    {
      $addToSet: {
        suppliedProducts: product._id,
        productsSupplied: product._id
      }
    }
  );

  return {
    priceChanged,
    priceHistory
  };
};

const buildAutomationNote = (normalizedProduct) =>
  `Automation ${normalizedProduct.sourceType} check at ${new Date(
    normalizedProduct.detectedAt
  ).toISOString()}`;

const buildSupplierId = async (supplierName) => {
  const base = normalizeNameKey(supplierName)
    .replace(/\s+/g, '-')
    .toUpperCase()
    .slice(0, 24) || 'AUTO-SUPPLIER';
  let candidate = `AUTO-${base}`;
  let suffix = 1;

  while (await Supplier.exists({ supplierId: candidate })) {
    suffix += 1;
    candidate = `AUTO-${base}-${suffix}`;
  }

  return candidate;
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
