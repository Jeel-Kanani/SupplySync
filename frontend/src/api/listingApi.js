import apiClient from './apiClient.js';

export const listingApi = {
  getListings: async (params = {}) => {
    const response = await apiClient.get('/listings', { params });
    return response.data;
  },
  createListing: async (payload) => {
    const response = await apiClient.post('/listings', payload);
    return response.data;
  }
};
