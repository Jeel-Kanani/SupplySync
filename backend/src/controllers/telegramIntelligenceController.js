import * as telegramIntelligenceService from '../services/telegramIntelligenceService.js';
import { sendSuccess } from '../utils/response.js';

export const startRuntime = async (_req, res, next) => {
  try {
    const result = await telegramIntelligenceService.startTelegramIntelligenceRuntime();
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
};

export const connectTelegram = async (req, res, next) => {
  try {
    const result = await telegramIntelligenceService.connectIntelligenceTelegram(req.body);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
};

export const ingestMessage = async (req, res, next) => {
  try {
    const result = await telegramIntelligenceService.ingestTelegramMessage(req.body);
    sendSuccess(res, 202, result);
  } catch (error) {
    next(error);
  }
};

export const processMessageNow = async (req, res, next) => {
  try {
    const result = await telegramIntelligenceService.processTelegramMessageNow(req.body);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
};

export const getDashboard = async (_req, res, next) => {
  try {
    const dashboard = await telegramIntelligenceService.getTelegramIntelligenceDashboard();
    sendSuccess(res, 200, dashboard);
  } catch (error) {
    next(error);
  }
};

export const getFeed = async (req, res, next) => {
  try {
    const feed = await telegramIntelligenceService.getLiveMessageFeed(req.query);
    sendSuccess(res, 200, feed);
  } catch (error) {
    next(error);
  }
};

export const getCandidates = async (req, res, next) => {
  try {
    const candidates = await telegramIntelligenceService.getExtractedCandidates(req.query);
    sendSuccess(res, 200, candidates);
  } catch (error) {
    next(error);
  }
};

export const getReviewTasks = async (req, res, next) => {
  try {
    const tasks = await telegramIntelligenceService.getReviewTasks(req.query);
    sendSuccess(res, 200, tasks);
  } catch (error) {
    next(error);
  }
};

export const approveCandidate = async (req, res, next) => {
  try {
    const result = await telegramIntelligenceService.approveReviewCandidate(req.params.candidateId, req.body);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
};

export const rejectCandidate = async (req, res, next) => {
  try {
    const result = await telegramIntelligenceService.rejectReviewCandidate(req.params.candidateId, req.body);
    sendSuccess(res, 200, result);
  } catch (error) {
    next(error);
  }
};

export const getSupplierActivity = async (_req, res, next) => {
  try {
    const activity = await telegramIntelligenceService.getSupplierActivityTimeline();
    sendSuccess(res, 200, activity);
  } catch (error) {
    next(error);
  }
};

export const getLowConfidenceAlerts = async (req, res, next) => {
  try {
    const alerts = await telegramIntelligenceService.getLowConfidenceAlerts(req.query);
    sendSuccess(res, 200, alerts);
  } catch (error) {
    next(error);
  }
};
