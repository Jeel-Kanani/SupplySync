import * as telegramMonitoringService from '../services/telegramMonitoringService.js';
import { sendSuccess } from '../utils/response.js';

export const connectTelegram = async (req, res, next) => {
  try {
    const connection = await telegramMonitoringService.connectTelegram(req.body);
    sendSuccess(res, 200, connection);
  } catch (error) {
    next(error);
  }
};

export const addTelegramChannel = async (req, res, next) => {
  try {
    const channel = await telegramMonitoringService.addTelegramChannel(req.body);
    sendSuccess(res, 201, channel);
  } catch (error) {
    next(error);
  }
};

export const getTelegramChannels = async (_req, res, next) => {
  try {
    const channels = await telegramMonitoringService.getTelegramChannels();
    sendSuccess(res, 200, channels);
  } catch (error) {
    next(error);
  }
};

export const getLatestTelegramExtractions = async (req, res, next) => {
  try {
    const extractions = await telegramMonitoringService.getLatestTelegramExtractions(Number(req.query.limit || 20));
    sendSuccess(res, 200, extractions);
  } catch (error) {
    next(error);
  }
};
