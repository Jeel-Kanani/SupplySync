import mongoose from 'mongoose';

import { BUSINESS_RULES, PRODUCT_STATUS } from '../config/constants.js';
import { Listing } from '../models/Listing.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import {
  getBestSupplierForProduct,
  rankProductSuppliers
} from './supplierSelectionService.js';
import { updateListingsForProduct } from './listingDependencyService.js';

const supplierPopulate = {
  path: 'suppliers.supplier',
  select: 'supplierId name website reliabilityScore isActive averageDeliveryDays'
};

const activeSupplierPopulate = {
  path: 'activeSupplier',
  select: 'supplierId name website reliabilityScore isActive averageDeliveryDays'
};

const listingsPopulate = {
  path: 'listings',
  select: 'listingId platform listingPrice marketplaceFees estimatedProfit status health'
};

export const recalculateProduct = async (productReference) => {
  const product = await getProductForCalculation(productReference);
  const listings = await getProductListings(product._id);
  const supplierRankings = rankProductSuppliers(product);
  const bestSupplier = getBestSupplierForProduct(product);
  const profitSummary = calculateProductProfit(product, bestSupplier, listings);
  const stateSummary = calculateProductState(product, bestSupplier, profitSummary);

  product.activeSupplier = bestSupplier?.supplierId || null;
  product.profitMargin = profitSummary.profitMargin;
  product.status = stateSummary.status;
  product.lastCalculatedAt = new Date();
  product.listings = listings.map((listing) => listing._id);

  const savedProduct = await product.save();
  const updatedListings = await updateListingsForProduct(savedProduct, bestSupplier);

  return buildBusinessSnapshot(savedProduct._id, {
    supplierRankings,
    bestSupplier,
    profitSummary,
    stateSummary,
    listings: updatedListings
  });
};

export const getProductStatus = async (productReference) => {
  const snapshot = await recalculateProduct(productReference);

  return {
    product: snapshot.product,
    status: snapshot.status
  };
};

export const getProductProfit = async (productReference) => {
  const snapshot = await recalculateProduct(productReference);

  return {
    product: snapshot.product,
    profit: snapshot.profit,
    listings: snapshot.listings
  };
};

export const getProductBestSupplier = async (productReference) => {
  const snapshot = await recalculateProduct(productReference);

  return {
    product: snapshot.product,
    bestSupplier: snapshot.bestSupplier,
    supplierRankings: snapshot.supplierRankings
  };
};

export const calculateProductProfit = (product, bestSupplier, listings = []) => {
  const averageMarketplaceFees = calculateAverageMarketplaceFees(listings);
  const buyPrice = Number(bestSupplier?.buyPrice || 0);
  const sellingPrice = Number(product.sellingPrice || 0);
  const estimatedProfit = roundCurrency(sellingPrice - buyPrice - averageMarketplaceFees);
  const profitMargin = sellingPrice > 0 ? roundCurrency((estimatedProfit / sellingPrice) * 100) : 0;

  return {
    sellingPrice,
    buyPrice,
    marketplaceFees: averageMarketplaceFees,
    estimatedProfit,
    profitMargin,
    minimumProfitAmount: BUSINESS_RULES.MIN_PROFIT_AMOUNT,
    minimumProfitMarginPercent: BUSINESS_RULES.MIN_PROFIT_MARGIN_PERCENT
  };
};

export const calculateProductState = (product, bestSupplier, profitSummary) => {
  const reasons = [];
  const availableSuppliers = (product.suppliers || []).filter((relationship) => {
    const supplier = relationship.supplier || {};
    return relationship.isAvailable !== false && supplier.isActive !== false;
  });

  if (!availableSuppliers.length) {
    return {
      status: PRODUCT_STATUS.DEAD,
      reasons: ['No available suppliers']
    };
  }

  if (
    profitSummary.estimatedProfit < BUSINESS_RULES.MIN_PROFIT_AMOUNT ||
    profitSummary.profitMargin < BUSINESS_RULES.MIN_PROFIT_MARGIN_PERCENT
  ) {
    reasons.push('Profit is below minimum threshold');
    return {
      status: PRODUCT_STATUS.LOW_PROFIT,
      reasons
    };
  }

  if (Number(bestSupplier?.stockQuantity || 0) <= BUSINESS_RULES.LOW_STOCK_THRESHOLD) {
    reasons.push('Best supplier stock is low');
  }

  if (Number(bestSupplier?.deliveryDays || 0) > BUSINESS_RULES.MAX_HEALTHY_DELIVERY_DAYS) {
    reasons.push('Best supplier delivery is slower than healthy threshold');
  }

  if (Number(bestSupplier?.reliabilityScore || 0) < BUSINESS_RULES.MIN_HEALTHY_RELIABILITY_SCORE) {
    reasons.push('Best supplier reliability is below healthy threshold');
  }

  if (reasons.length > 0) {
    return {
      status: PRODUCT_STATUS.RISKY,
      reasons
    };
  }

  return {
    status: PRODUCT_STATUS.ACTIVE,
    reasons: ['At least one supplier is available with healthy profit']
  };
};

const buildBusinessSnapshot = async (productId, computed) => {
  const product = await Product.findById(productId)
    .populate(activeSupplierPopulate)
    .populate(supplierPopulate)
    .populate(listingsPopulate);

  return {
    product: {
      _id: product._id,
      productId: product.productId,
      name: product.name,
      category: product.category,
      sellingPrice: product.sellingPrice,
      status: product.status,
      profitMargin: product.profitMargin,
      activeSupplier: product.activeSupplier,
      lastCalculatedAt: product.lastCalculatedAt
    },
    status: {
      value: product.status,
      reasons: computed.stateSummary.reasons,
      lastCalculatedAt: product.lastCalculatedAt
    },
    profit: computed.profitSummary,
    bestSupplier: computed.bestSupplier,
    supplierRankings: computed.supplierRankings,
    listings: computed.listings
  };
};

const getProductForCalculation = async (productReference) => {
  const product = await Product.findOne(buildProductIdentifierQuery(productReference))
    .populate(supplierPopulate)
    .populate(activeSupplierPopulate)
    .populate(listingsPopulate);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return product;
};

const getProductListings = (productId) =>
  Listing.find({
    $or: [{ linkedProduct: productId }, { productId }]
  });

const calculateAverageMarketplaceFees = (listings) => {
  if (!listings.length) {
    return BUSINESS_RULES.DEFAULT_MARKETPLACE_FEES;
  }

  const totalFees = listings.reduce((total, listing) => total + Number(listing.marketplaceFees || 0), 0);
  return roundCurrency(totalFees / listings.length);
};

const roundCurrency = (value) => Number(Number(value || 0).toFixed(2));

const buildProductIdentifierQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { _id: id };
  }

  return { productId: String(id).toUpperCase() };
};
