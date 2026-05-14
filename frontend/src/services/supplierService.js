import { supplierApi } from '../api/supplierApi.js';

export const supplierService = {
  list: (params) => supplierApi.getSuppliers(params),
  create: (payload) => supplierApi.createSupplier(payload),
  products: (id) => supplierApi.getSupplierProducts(id),
  rankings: () => supplierApi.getSupplierRankings()
};
