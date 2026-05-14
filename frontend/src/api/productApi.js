import apiClient from './apiClient.js';

export const productApi = {
  getProducts: async (params = {}) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },
  getProductById: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },
  createProduct: async (payload) => {
    const response = await apiClient.post('/products', payload);
    return response.data;
  },
  updateProduct: async (id, payload) => {
    const response = await apiClient.put(`/products/${id}`, payload);
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
  getProductStatus: async (id) => {
    const response = await apiClient.get(`/products/${id}/status`);
    return response.data;
  },
  getProductProfit: async (id) => {
    const response = await apiClient.get(`/products/${id}/profit`);
    return response.data;
  },
  getBestSupplier: async (id) => {
    const response = await apiClient.get(`/products/${id}/best-supplier`);
    return response.data;
  },
  recalculateProduct: async (id) => {
    const response = await apiClient.post(`/products/${id}/recalculate`);
    return response.data;
  }
};
