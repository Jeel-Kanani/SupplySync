import { Supplier } from '../models/Supplier.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPagination } from '../utils/query.js';
import { recalculateProduct } from './productCalculationService.js';
import { getSupplierRankings as buildSupplierRankings } from './supplierSelectionService.js';

const supplierPopulate = {
  path: 'suppliedProducts',
  select: 'productId name category status sellingPrice'
};

export const getSuppliers = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filter = {};

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const [items, total] = await Promise.all([
    Supplier.find(filter)
      .populate(supplierPopulate)
      .sort({ reliabilityScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Supplier.countDocuments(filter)
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

export const createSupplier = async (payload) => {
  const normalizedPayload = normalizeSupplierPayload(payload);

  if (normalizedPayload.suppliedProducts?.length) {
    const productCount = await Product.countDocuments({
      _id: { $in: normalizedPayload.suppliedProducts }
    });

    if (productCount !== normalizedPayload.suppliedProducts.length) {
      throw new ApiError(404, 'One or more supplied products were not found');
    }
  }

  const supplier = await Supplier.create(normalizedPayload);

  if (supplier.suppliedProducts.length) {
    const products = await Product.find({ _id: { $in: supplier.suppliedProducts } });

    await Promise.all(
      products.map(async (product) => {
        const alreadyLinked = product.suppliers.some(
          (relationship) => String(relationship.supplier) === supplier._id.toString()
        );

        if (!alreadyLinked) {
          product.suppliers.push({
            supplier: supplier._id,
            buyPrice: 0,
            isAvailable: supplier.isActive,
            stockQuantity: 0,
            deliveryDays: supplier.averageDeliveryDays
          });
          await product.save();
        }

        return recalculateProduct(product._id);
      })
    );
  }

  return Supplier.findById(supplier._id).populate(supplierPopulate);
};

export const getSupplierProducts = async (id) => {
  const supplier = await Supplier.findOne(buildSupplierIdentifierQuery(id)).populate(supplierPopulate);

  if (!supplier) {
    throw new ApiError(404, 'Supplier not found');
  }

  const suppliedProductIds = (supplier.suppliedProducts || []).map((product) => product._id || product);

  const products = await Product.find({
    $or: [
      { _id: { $in: suppliedProductIds } },
      { 'suppliers.supplier': supplier._id }
    ]
  })
    .populate({
      path: 'activeSupplier',
      select: 'supplierId name reliabilityScore'
    })
    .populate({
      path: 'suppliers.supplier',
      select: 'supplierId name reliabilityScore isActive averageDeliveryDays'
    })
    .sort({ updatedAt: -1 });

  return {
    supplier,
    products
  };
};

export const getSupplierRankings = async () => buildSupplierRankings();

const normalizeSupplierPayload = (payload) => {
  const suppliedProducts = payload.suppliedProducts || payload.productsSupplied || [];

  return {
    ...payload,
    suppliedProducts,
    productsSupplied: suppliedProducts
  };
};

const buildSupplierIdentifierQuery = (id) => {
  if (id.match?.(/^[0-9a-fA-F]{24}$/)) {
    return { _id: id };
  }

  return { supplierId: String(id).toUpperCase() };
};
