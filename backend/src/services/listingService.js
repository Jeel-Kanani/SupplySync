import mongoose from 'mongoose';

import { Listing } from '../models/Listing.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPagination } from '../utils/query.js';
import { recalculateProduct } from './productCalculationService.js';

const listingPopulate = {
  path: 'linkedProduct',
  select: 'productId name category status sellingPrice activeSupplier',
  populate: {
    path: 'activeSupplier',
    select: 'supplierId name reliabilityScore isActive averageDeliveryDays'
  }
};

export const getListings = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filter = {};

  if (query.platform) {
    filter.platform = query.platform.toUpperCase();
  }

  if (query.status) {
    filter.status = query.status.toUpperCase();
  }

  if (query.health) {
    filter.health = query.health.toUpperCase();
  }

  if (query.productId) {
    const product = await Product.findOne(buildProductLookupQuery(query.productId)).select('_id');

    if (!product) {
      return {
        items: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      };
    }

    filter.$or = [{ productId: product._id }, { linkedProduct: product._id }];
  }

  const [items, total] = await Promise.all([
    Listing.find(filter)
      .populate(listingPopulate)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Listing.countDocuments(filter)
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

export const createListing = async (payload) => {
  const product = await Product.findOne(buildProductLookupQuery(payload.productId));

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const listing = await Listing.create({
    ...payload,
    productId: product._id,
    linkedProduct: product._id
  });

  await Product.findByIdAndUpdate(product._id, {
    $addToSet: { listings: listing._id }
  });
  await recalculateProduct(product._id);

  return Listing.findById(listing._id).populate(listingPopulate);
};

const buildProductLookupQuery = (productReference) => {
  if (mongoose.Types.ObjectId.isValid(productReference)) {
    return { _id: productReference };
  }

  return { productId: String(productReference).toUpperCase() };
};
