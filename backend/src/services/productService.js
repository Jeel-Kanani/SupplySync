import mongoose from 'mongoose';

import { Product } from '../models/Product.js';
import { Supplier } from '../models/Supplier.js';
import { Listing } from '../models/Listing.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPagination } from '../utils/query.js';
import { recalculateProduct } from './productCalculationService.js';

const productPopulate = [
  {
    path: 'activeSupplier',
    select: 'supplierId name website reliabilityScore isActive averageDeliveryDays'
  },
  {
    path: 'suppliers.supplier',
    select: 'supplierId name website reliabilityScore isActive averageDeliveryDays'
  },
  {
    path: 'listings',
    select: 'listingId platform listingPrice marketplaceFees estimatedProfit status health'
  }
];

export const getProducts = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filter = {};

  if (query.status) {
    filter.status = query.status.toUpperCase();
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate(productPopulate)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter)
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getProductById = async (id) => {
  const product = await Product.findOne(buildProductIdentifierQuery(id)).populate(productPopulate);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return product;
};

export const createProduct = async (payload) => {
  const normalizedPayload = normalizeProductPayload(payload);
  const supplierIds = getSupplierIdsFromPayload(normalizedPayload);
  await assertSuppliersExist(supplierIds);

  const product = await Product.create(normalizedPayload);
  await syncSupplierProductReferences(product._id, [], supplierIds);

  await recalculateProduct(product._id);
  return Product.findById(product._id).populate(productPopulate);
};

export const updateProduct = async (id, payload) => {
  const existingProduct = await Product.findOne(buildProductIdentifierQuery(id));

  if (!existingProduct) {
    throw new ApiError(404, 'Product not found');
  }

  const normalizedPayload = normalizeProductPayload(payload);
  const previousSupplierIds = getSupplierIdsFromProduct(existingProduct);
  const nextSupplierIds = getSupplierIdsFromPayload({
    suppliers: normalizedPayload.suppliers ?? existingProduct.suppliers
  });

  await assertSuppliersExist(nextSupplierIds);

  Object.assign(existingProduct, normalizedPayload);
  const savedProduct = await existingProduct.save();

  await syncSupplierProductReferences(savedProduct._id, previousSupplierIds, nextSupplierIds);
  await recalculateProduct(savedProduct._id);

  return Product.findById(savedProduct._id).populate(productPopulate);
};

export const deleteProduct = async (id) => {
  const product = await Product.findOneAndDelete(buildProductIdentifierQuery(id));

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  await Promise.all([
    Supplier.updateMany(
      {
        $or: [
          { productsSupplied: product._id },
          { suppliedProducts: product._id }
        ]
      },
      {
        $pull: {
          productsSupplied: product._id,
          suppliedProducts: product._id
        }
      }
    ),
    Listing.deleteMany({
      $or: [{ productId: product._id }, { linkedProduct: product._id }]
    })
  ]);

  return product;
};

const normalizeProductPayload = (payload) => {
  const normalizedPayload = { ...payload };

  if (Array.isArray(normalizedPayload.suppliers)) {
    const supplierMap = new Map();

    normalizedPayload.suppliers.forEach((relationship) => {
      if (!relationship?.supplier) return;

      supplierMap.set(String(relationship.supplier), {
        supplier: relationship.supplier,
        buyPrice: Number(relationship.buyPrice || 0),
        isAvailable: relationship.isAvailable !== false,
        stockQuantity: Number(relationship.stockQuantity || 0),
        deliveryDays: Number(relationship.deliveryDays || 7),
        notes: relationship.notes || '',
        lastCheckedAt: relationship.lastCheckedAt || new Date()
      });
    });

    normalizedPayload.suppliers = Array.from(supplierMap.values());
  }

  if (normalizedPayload.activeSupplier && !normalizedPayload.suppliers?.length) {
    normalizedPayload.suppliers = [
      {
        supplier: normalizedPayload.activeSupplier,
        buyPrice: 0,
        isAvailable: true,
        stockQuantity: 0,
        deliveryDays: 7
      }
    ];
  }

  return normalizedPayload;
};

const assertSuppliersExist = async (supplierIds) => {
  if (!supplierIds.length) return;

  const supplierCount = await Supplier.countDocuments({
    _id: { $in: supplierIds }
  });

  if (supplierCount !== supplierIds.length) {
    throw new ApiError(404, 'One or more linked suppliers were not found');
  }
};

const syncSupplierProductReferences = async (productId, previousSupplierIds, nextSupplierIds) => {
  if (previousSupplierIds.length) {
    await Supplier.updateMany(
      { _id: { $in: previousSupplierIds } },
      {
        $pull: {
          suppliedProducts: productId,
          productsSupplied: productId
        }
      }
    );
  }

  if (nextSupplierIds.length) {
    await Supplier.updateMany(
      { _id: { $in: nextSupplierIds } },
      {
        $addToSet: {
          suppliedProducts: productId,
          productsSupplied: productId
        }
      }
    );
  }
};

const getSupplierIdsFromPayload = (payload) => {
  const supplierIds = (payload.suppliers || [])
    .map((relationship) => relationship?.supplier)
    .filter(Boolean)
    .map((supplierId) => String(supplierId));

  return [...new Set(supplierIds)];
};

const getSupplierIdsFromProduct = (product) =>
  [
    ...(product.suppliers || []).map((relationship) => relationship.supplier),
    product.activeSupplier
  ]
    .filter(Boolean)
    .map((supplierId) => String(supplierId))
    .filter((supplierId, index, values) => values.indexOf(supplierId) === index);

const buildProductIdentifierQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { _id: id };
  }

  return { productId: String(id).toUpperCase() };
};
