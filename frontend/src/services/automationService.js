import { automationApi } from '../api/automationApi.js';

export const automationService = {
  dashboard: () => automationApi.getDashboard(),
  runWebsites: (payload) => automationApi.runWebsites(payload),
  runTelegram: (payload) => automationApi.runTelegram(payload),
  logs: (params) => automationApi.getLogs(params),
  history: (params) => automationApi.getHistory(params)
};
