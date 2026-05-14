import { env } from '../config/env.js';
import {
  REVIEW_ASSIGNED_STATUS,
  REVIEW_STATUS,
  TELEGRAM_EXTRACTION_STATUS
} from '../config/constants.js';
import { TelegramMessage } from '../models/TelegramMessage.js';
import { ExtractedProductCandidate } from '../models/ExtractedProductCandidate.js';
import { ReviewTask } from '../models/ReviewTask.js';
import { TelegramChannel } from '../models/TelegramChannel.js';
import { buildPagination } from '../utils/query.js';
import { connectClawBotClient, getClawBotClientStatus } from '../telegram/client/gramClient.js';
import {
  getClawBotListenerStatus,
  startClawBotListener
} from '../telegram/listeners/clawBotListener.js';
import {
  enqueueTelegramMessage,
  getQueueHealth
} from '../telegram/queue/telegramQueues.js';
import { startTelegramIntelligenceWorkers } from '../telegram/queue/telegramWorkers.js';
import {
  applyReviewedCandidate,
  processRawMessagePayload,
  rejectCandidate
} from './telegramPipelineService.js';

export const startTelegramIntelligenceRuntime = async () => {
  if (!env.telegramIntelligenceEnabled) {
    return {
      active: false,
      message: 'Telegram intelligence runtime disabled'
    };
  }

  let workersStarted = false;

  try {
    const health = await getQueueHealth();
    if (health.redisConnected) {
      startTelegramIntelligenceWorkers();
      workersStarted = true;
    }
  } catch (error) {
    console.error('Telegram intelligence workers did not start:', error.message);
  }

  let listener = {
    active: false,
    message: 'Telegram listener not started'
  };

  if (env.telegramApiId && env.telegramApiHash && (env.telegramSession || env.telegramBotToken)) {
    try {
      listener = await startClawBotListener();
    } catch (error) {
      listener = {
        active: false,
        message: error.message
      };
    }
  }

  return {
    workersStarted,
    listener,
    client: getClawBotClientStatus()
  };
};

export const connectIntelligenceTelegram = async (credentials = {}) => {
  const connection = await connectClawBotClient(credentials);

  return {
    connected: connection.connected,
    sessionString: connection.sessionString
  };
};

export const ingestTelegramMessage = async (payload) => {
  try {
    const job = await enqueueTelegramMessage(payload);
    return {
      queued: true,
      jobId: job.id
    };
  } catch (error) {
    const telegramMessage = await processRawMessagePayload(payload);
    return {
      queued: false,
      fallbackProcessed: true,
      telegramMessage,
      queueError: error.message
    };
  }
};

export const processTelegramMessageNow = async (payload) => {
  const telegramMessage = await processRawMessagePayload(payload);
  return {
    telegramMessage
  };
};

export const getTelegramIntelligenceDashboard = async () => {
  const [
    totalMessages,
    unprocessedMessages,
    extractedCandidates,
    openReviewTasks,
    lowConfidenceCandidates,
    latestMessages,
    latestCandidates,
    queueHealth,
    confidenceDistribution,
    activeChannels
  ] = await Promise.all([
    TelegramMessage.countDocuments(),
    TelegramMessage.countDocuments({ processed: false }),
    ExtractedProductCandidate.countDocuments(),
    ReviewTask.countDocuments({ assignedStatus: { $ne: REVIEW_ASSIGNED_STATUS.RESOLVED } }),
    ExtractedProductCandidate.countDocuments({
      $or: [
        { confidence: { $lt: 70 } },
        { reviewStatus: REVIEW_STATUS.LOW_CONFIDENCE }
      ]
    }),
    TelegramMessage.find().sort({ receivedAt: -1 }).limit(8),
    ExtractedProductCandidate.find()
      .populate('sourceMessage')
      .sort({ extractedAt: -1 })
      .limit(8),
    getQueueHealth(),
    getConfidenceDistribution(),
    TelegramChannel.countDocuments({ isActive: true })
  ]);

  return {
    totals: {
      totalMessages,
      unprocessedMessages,
      extractedCandidates,
      openReviewTasks,
      lowConfidenceCandidates,
      activeChannels
    },
    latestMessages,
    latestCandidates,
    confidenceDistribution,
    queueHealth,
    runtime: {
      client: getClawBotClientStatus(),
      listener: getClawBotListenerStatus(),
      autoApplyConfidence: env.telegramAutoApplyConfidence,
      reviewConfidence: env.telegramReviewConfidence
    }
  };
};

export const getLiveMessageFeed = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filter = {};

  if (query.channelName) filter.channelName = query.channelName;
  if (query.extractionStatus) filter.extractionStatus = String(query.extractionStatus).toUpperCase();

  const [items, total] = await Promise.all([
    TelegramMessage.find(filter).sort({ receivedAt: -1 }).skip(skip).limit(limit),
    TelegramMessage.countDocuments(filter)
  ]);

  return buildPaged(items, total, page, limit);
};

export const getExtractedCandidates = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filter = {};

  if (query.reviewStatus) filter.reviewStatus = String(query.reviewStatus).toUpperCase();
  if (query.requiresReview !== undefined) filter.requiresReview = query.requiresReview === 'true';
  if (query.maxConfidence) filter.confidence = { $lte: Number(query.maxConfidence) };
  if (query.sourceChannel) filter.sourceChannel = query.sourceChannel;

  const [items, total] = await Promise.all([
    ExtractedProductCandidate.find(filter)
      .populate('sourceMessage')
      .sort({ extractedAt: -1 })
      .skip(skip)
      .limit(limit),
    ExtractedProductCandidate.countDocuments(filter)
  ]);

  return buildPaged(items, total, page, limit);
};

export const getReviewTasks = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filter = {};

  if (query.assignedStatus) filter.assignedStatus = String(query.assignedStatus).toUpperCase();
  if (query.priority) filter.priority = String(query.priority).toUpperCase();

  const [items, total] = await Promise.all([
    ReviewTask.find(filter)
      .populate('candidate')
      .populate('sourceMessage')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ReviewTask.countDocuments(filter)
  ]);

  return buildPaged(items, total, page, limit);
};

export const approveReviewCandidate = (candidateId, payload = {}) =>
  applyReviewedCandidate(candidateId, payload);

export const rejectReviewCandidate = (candidateId, payload = {}) =>
  rejectCandidate(candidateId, payload);

export const getSupplierActivityTimeline = async () => {
  const [channelActivity, recentEvents] = await Promise.all([
    TelegramMessage.aggregate([
      {
        $group: {
          _id: '$channelName',
          messages: { $sum: 1 },
          latestMessageAt: { $max: '$receivedAt' },
          extractedMessages: {
            $sum: {
              $cond: [{ $eq: ['$extractionStatus', TELEGRAM_EXTRACTION_STATUS.EXTRACTED] }, 1, 0]
            }
          }
        }
      },
      { $sort: { latestMessageAt: -1 } },
      { $limit: 20 }
    ]),
    ExtractedProductCandidate.find()
      .populate('sourceMessage')
      .sort({ extractedAt: -1 })
      .limit(30)
  ]);

  return {
    channelActivity,
    recentEvents
  };
};

export const getLowConfidenceAlerts = async (query = {}) => {
  const limit = Number(query.limit || 50);

  return ExtractedProductCandidate.find({
    $or: [
      { confidence: { $lt: 70 } },
      { requiresReview: true },
      { reviewStatus: REVIEW_STATUS.LOW_CONFIDENCE }
    ]
  })
    .populate('sourceMessage')
    .sort({ confidence: 1, extractedAt: -1 })
    .limit(limit);
};

const getConfidenceDistribution = () =>
  ExtractedProductCandidate.aggregate([
    {
      $bucket: {
        groupBy: '$confidence',
        boundaries: [0, 40, 70, 90, 101],
        default: 'unknown',
        output: { count: { $sum: 1 } }
      }
    }
  ]);

const buildPaged = (items, total, page, limit) => ({
  items,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
});
