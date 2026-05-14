import mongoose from 'mongoose';

import { BUSINESS_RULES, SUPPLIER_SCORE_WEIGHTS } from '../config/constants.js';
import { Product } from '../models/Product.js';
import { Supplier } from '../models/Supplier.js';
import { ApiError } from '../utils/ApiError.js';

const supplierSelect = 'supplierId name website reliabilityScore isActive averageDeliveryDays';

export const rankProductSuppliers = (product) => {
  const relationships = product.suppliers || [];
  const buyPrices = relationships
    .map((relationship) => Number(relationship.buyPrice || 0))
    .filter((buyPrice) => buyPrice > 0);
  const lowestBuyPrice = buyPrices.length ? Math.min(...buyPrices) : 0;

  return relationships
    .map((relationship) => buildSupplierRanking(relationship, lowestBuyPrice))
    .sort(sortSupplierRankings);
};

export const getBestSupplierForProduct = (product) => {
  const rankings = rankProductSuppliers(product);
  return rankings.find((ranking) => ranking.isAvailable) || rankings[0] || null;
};

export const getProductSupplierRankings = async (productReference) => {
  const product = await Product.findOne(buildProductIdentifierQuery(productReference)).populate({
    path: 'suppliers.supplier',
    select: supplierSelect
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return {
    product: {
      _id: product._id,
      productId: product.productId,
      name: product.name
    },
    rankings: rankProductSuppliers(product)
  };
};

export const getSupplierRankings = async () => {
  const suppliers = await Supplier.find()
    .populate({
      path: 'suppliedProducts',
      select: 'productId name status profitMargin'
    })
    .sort({ reliabilityScore: -1, createdAt: -1 });

  const products = await Product.find({ suppliers: { $exists: true, $ne: [] } }).select(
    'productId name suppliers'
  );

  return suppliers
    .map((supplier) => {
      const supplierProductLinks = products
        .map((product) => {
          const relationship = product.suppliers.find(
            (item) => getObjectId(item.supplier) === supplier._id.toString()
          );

          if (!relationship) return null;

          return {
            product,
            relationship
          };
        })
        .filter(Boolean);

      const availableLinks = supplierProductLinks.filter(({ relationship }) =>
        isRelationshipAvailable(relationship, supplier)
      );
      const averageProductScore =
        supplierProductLinks.length > 0
          ? supplierProductLinks.reduce((total, { relationship }) => {
              const ranking = buildSupplierRanking(
                { ...relationship.toObject?.(), supplier },
                Number(relationship.buyPrice || 0)
              );
              return total + ranking.score;
            }, 0) / supplierProductLinks.length
          : 0;

      const coverageScore = Math.min(supplierProductLinks.length * 5, 20);
      const reliabilityScore = Number(supplier.reliabilityScore || 0) * 0.6;
      const availabilityScore =
        supplierProductLinks.length > 0
          ? (availableLinks.length / supplierProductLinks.length) * 20
          : supplier.isActive
            ? 10
            : 0;

      return {
        supplier,
        rankingScore: roundScore(reliabilityScore + availabilityScore + coverageScore),
        averageProductScore: roundScore(averageProductScore),
        productsLinked: supplierProductLinks.length,
        availableProducts: availableLinks.length
      };
    })
    .sort((first, second) => second.rankingScore - first.rankingScore);
};

const buildSupplierRanking = (relationship, lowestBuyPrice) => {
  const supplier = relationship.supplier || {};
  const buyPrice = Number(relationship.buyPrice || 0);
  const reliabilityScore = Number(supplier.reliabilityScore || 0);
  const isAvailable = isRelationshipAvailable(relationship, supplier);
  const priceScore = calculatePriceScore(buyPrice, lowestBuyPrice);
  const availabilityScore = isAvailable ? SUPPLIER_SCORE_WEIGHTS.AVAILABILITY : 0;
  const reliabilityContribution =
    (Math.min(Math.max(reliabilityScore, 0), 100) / 100) * SUPPLIER_SCORE_WEIGHTS.RELIABILITY;

  return {
    supplier,
    supplierId: getObjectId(supplier),
    buyPrice,
    isAvailable,
    stockQuantity: Number(relationship.stockQuantity || 0),
    deliveryDays: Number(relationship.deliveryDays ?? supplier.averageDeliveryDays ?? 0),
    reliabilityScore,
    score: roundScore(availabilityScore + priceScore + reliabilityContribution),
    scoreBreakdown: {
      availability: roundScore(availabilityScore),
      price: roundScore(priceScore),
      reliability: roundScore(reliabilityContribution)
    },
    reasons: buildSupplierReasons(relationship, supplier, isAvailable)
  };
};

const isRelationshipAvailable = (relationship, supplier) =>
  relationship.isAvailable !== false && supplier.isActive !== false;

const calculatePriceScore = (buyPrice, lowestBuyPrice) => {
  if (!buyPrice || !lowestBuyPrice) return 0;

  return Math.min((lowestBuyPrice / buyPrice) * SUPPLIER_SCORE_WEIGHTS.PRICE, SUPPLIER_SCORE_WEIGHTS.PRICE);
};

const buildSupplierReasons = (relationship, supplier, isAvailable) => {
  const reasons = [];

  if (!isAvailable) {
    reasons.push('Supplier is unavailable');
  }

  if (Number(relationship.stockQuantity || 0) <= BUSINESS_RULES.LOW_STOCK_THRESHOLD) {
    reasons.push('Low stock');
  }

  const deliveryDays = Number(relationship.deliveryDays ?? supplier.averageDeliveryDays ?? 0);
  if (deliveryDays > BUSINESS_RULES.MAX_HEALTHY_DELIVERY_DAYS) {
    reasons.push('Slow delivery');
  }

  if (Number(supplier.reliabilityScore || 0) < BUSINESS_RULES.MIN_HEALTHY_RELIABILITY_SCORE) {
    reasons.push('Reliability below healthy threshold');
  }

  return reasons;
};

const sortSupplierRankings = (first, second) => {
  if (second.score !== first.score) return second.score - first.score;
  if (first.buyPrice !== second.buyPrice) return first.buyPrice - second.buyPrice;
  if (second.reliabilityScore !== first.reliabilityScore) {
    return second.reliabilityScore - first.reliabilityScore;
  }
  return first.deliveryDays - second.deliveryDays;
};

const getObjectId = (value) => {
  if (!value) return null;
  return String(value._id || value);
};

const roundScore = (value) => Number(Number(value || 0).toFixed(2));

const buildProductIdentifierQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { _id: id };
  }

  return { productId: String(id).toUpperCase() };
};
