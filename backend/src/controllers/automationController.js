import * as automationRunnerService from '../services/automationRunnerService.js';
import { sendSuccess } from '../utils/response.js';

export const getAutomationDashboard = async (_req, res, next) => {
  try {
    const dashboard = await automationRunnerService.getAutomationDashboard();
    sendSuccess(res, 200, dashboard);
  } catch (error) {
    next(error);
  }
};

export const runWebsites = async (req, res, next) => {
  try {
    const result = await automationRunnerService.runWebsiteAutomation(req.body);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
};

export const runTelegram = async (req, res, next) => {
  try {
    const result = await automationRunnerService.runTelegramAutomation(req.body);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
};

export const getAutomationLogs = async (req, res, next) => {
  try {
    const logs = await automationRunnerService.getAutomationLogs(req.query);
    sendSuccess(res, 200, logs);
  } catch (error) {
    next(error);
  }
};

export const getAutomationHistory = async (req, res, next) => {
  try {
    const history = await automationRunnerService.getAutomationHistory(req.query);
    sendSuccess(res, 200, history);
  } catch (error) {
    next(error);
  }
};
