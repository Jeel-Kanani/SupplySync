import apiClient from './apiClient.js';

export const telegramApi = {
  connect: async (payload = {}) => {
    const response = await apiClient.post('/telegram/connect', payload);
    return response.data;
  },
  addChannel: async (payload) => {
    const response = await apiClient.post('/telegram/add-channel', payload);
    return response.data;
  },
  getChannels: async () => {
    const response = await apiClient.get('/telegram/channels');
    return response.data;
  },
  getExtractions: async (params = {}) => {
    const response = await apiClient.get('/telegram/extractions', { params });
    return response.data;
  }
};
