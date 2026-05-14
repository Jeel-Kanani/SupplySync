import apiClient from './apiClient.js';

export const telegramIntelligenceApi = {
  startRuntime: async () => {
    const response = await apiClient.post('/telegram-intelligence/runtime/start');
    return response.data;
  },
  connect: async (payload = {}) => {
    const response = await apiClient.post('/telegram-intelligence/connect', payload);
    return response.data;
  },
  ingestMessage: async (payload) => {
    const response = await apiClient.post('/telegram-intelligence/messages/ingest', payload);
    return response.data;
  },
  processMessageNow: async (payload) => {
    const response = await apiClient.post('/telegram-intelligence/messages/process-now', payload);
    return response.data;
  },
  dashboard: async () => {
    const response = await apiClient.get('/telegram-intelligence/dashboard');
    return response.data;
  },
  feed: async (params = {}) => {
    const response = await apiClient.get('/telegram-intelligence/feed', { params });
    return response.data;
  },
  candidates: async (params = {}) => {
    const response = await apiClient.get('/telegram-intelligence/candidates', { params });
    return response.data;
  },
  reviewTasks: async (params = {}) => {
    const response = await apiClient.get('/telegram-intelligence/review-tasks', { params });
    return response.data;
  },
  approveCandidate: async (candidateId, payload = {}) => {
    const response = await apiClient.post(`/telegram-intelligence/candidates/${candidateId}/approve`, payload);
    return response.data;
  },
  rejectCandidate: async (candidateId, payload = {}) => {
    const response = await apiClient.post(`/telegram-intelligence/candidates/${candidateId}/reject`, payload);
    return response.data;
  },
  supplierActivity: async () => {
    const response = await apiClient.get('/telegram-intelligence/supplier-activity');
    return response.data;
  },
  lowConfidenceAlerts: async (params = {}) => {
    const response = await apiClient.get('/telegram-intelligence/low-confidence-alerts', { params });
    return response.data;
  }
};
