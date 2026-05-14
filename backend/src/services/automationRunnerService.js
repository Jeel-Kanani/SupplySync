import { AUTOMATION_LOG_STATUS, SOURCE_TYPES } from '../config/constants.js';
import { AutomationLog } from '../models/AutomationLog.js';
import { PriceHistory } from '../models/PriceHistory.js';
import { SourceCheckHistory } from '../models/SourceCheckHistory.js';
import { TelegramChannel } from '../models/TelegramChannel.js';
import { Supplier } from '../models/Supplier.js';
import { buildPagination } from '../utils/query.js';
import { monitorWebsites } from './websiteMonitoringService.js';
import {
  processTelegramMessage,
  startTelegramMonitoring
} from './telegramMonitoringService.js';

export const runWebsiteAutomation = (payload = {}) => monitorWebsites(payload);

export const runTelegramAutomation = async (payload = {}) => {
  if (payload.message || payload.text) {
    return processTelegramMessage(payload);
  }

  return startTelegramMonitoring();
};

export const getAutomationLogs = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filter = {};

  if (query.sourceType) filter.sourceType = String(query.sourceType).toUpperCase();
  if (query.status) filter.status = String(query.status).toUpperCase();
  if (query.actionType) filter.actionType = String(query.actionType).toUpperCase();

  const [items, total] = await Promise.all([
    AutomationLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AutomationLog.countDocuments(filter)
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getAutomationHistory = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const sourceFilter = {};

  if (query.sourceType) sourceFilter.sourceType = String(query.sourceType).toUpperCase();
  if (query.status) sourceFilter.status = String(query.status).toUpperCase();

  const [checks, checkTotal, priceHistory] = await Promise.all([
    SourceCheckHistory.find(sourceFilter).sort({ checkedAt: -1 }).skip(skip).limit(limit),
    SourceCheckHistory.countDocuments(sourceFilter),
    PriceHistory.find(query.sourceType ? { sourceType: String(query.sourceType).toUpperCase() } : {})
      .populate('product', 'productId name status')
      .populate('supplier', 'supplierId name')
      .sort({ changedAt: -1 })
      .limit(Math.min(limit, 50))
  ]);

  return {
    checks,
    priceHistory,
    pagination: {
      page,
      limit,
      total: checkTotal,
      pages: Math.ceil(checkTotal / limit)
    }
  };
};

export const getAutomationDashboard = async () => {
  const [
    monitoredWebsites,
    monitoredTelegramChannels,
    lastRun,
    failedJobs,
    recentExtractions,
    recentPriceChanges
  ] = await Promise.all([
    Supplier.countDocuments({ isActive: true, website: { $exists: true, $ne: '' } }),
    TelegramChannel.countDocuments({ isActive: true }),
    AutomationLog.findOne().sort({ createdAt: -1 }),
    AutomationLog.countDocuments({ status: AUTOMATION_LOG_STATUS.FAILED }),
    SourceCheckHistory.find().sort({ checkedAt: -1 }).limit(10),
    PriceHistory.find()
      .populate('product', 'productId name status')
      .populate('supplier', 'supplierId name')
      .sort({ changedAt: -1 })
      .limit(10)
  ]);

  return {
    monitoredWebsites,
    monitoredTelegramChannels,
    lastRun,
    failedJobs,
    recentExtractions,
    recentPriceChanges,
    sourceTypes: Object.values(SOURCE_TYPES)
  };
};
