import apiClient from './apiClient.js';

export const automationApi = {
  getDashboard: async () => {
    const response = await apiClient.get('/automation/dashboard');
    return response.data;
  },
  runWebsites: async (payload = {}) => {
    const response = await apiClient.post('/automation/run-websites', payload);
    return response.data;
  },
  runTelegram: async (payload = {}) => {
    const response = await apiClient.post('/automation/run-telegram', payload);
    return response.data;
  },
  getLogs: async (params = {}) => {
    const response = await apiClient.get('/automation/logs', { params });
    return response.data;
  },
  getHistory: async (params = {}) => {
    const response = await apiClient.get('/automation/history', { params });
    return response.data;
  }
};
