import { productApi } from '../api/productApi.js';

export const productService = {
  list: (params) => productApi.getProducts(params),
  create: (payload) => productApi.createProduct(payload),
  update: (id, payload) => productApi.updateProduct(id, payload),
  remove: (id) => productApi.deleteProduct(id),
  status: (id) => productApi.getProductStatus(id),
  profit: (id) => productApi.getProductProfit(id),
  bestSupplier: (id) => productApi.getBestSupplier(id),
  recalculate: (id) => productApi.recalculateProduct(id)
};
