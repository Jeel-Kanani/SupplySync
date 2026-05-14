import apiClient from './apiClient.js';

export const supplierApi = {
  getSuppliers: async (params = {}) => {
    const response = await apiClient.get('/suppliers', { params });
    return response.data;
  },
  createSupplier: async (payload) => {
    const response = await apiClient.post('/suppliers', payload);
    return response.data;
  },
  getSupplierProducts: async (id) => {
    const response = await apiClient.get(`/suppliers/${id}/products`);
    return response.data;
  },
  getSupplierRankings: async () => {
    const response = await apiClient.get('/suppliers/rankings');
    return response.data;
  }
};
