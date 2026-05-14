import crypto from 'crypto';

import { env } from '../config/env.js';
import {
  REVIEW_ASSIGNED_STATUS,
  REVIEW_STATUS,
  SOURCE_TYPES,
  TELEGRAM_EXTRACTION_STATUS
} from '../config/constants.js';
import { TelegramMessage } from '../models/TelegramMessage.js';
import { ExtractedProductCandidate } from '../models/ExtractedProductCandidate.js';
import { ReviewTask } from '../models/ReviewTask.js';
import { TelegramChannel } from '../models/TelegramChannel.js';
import { Product } from '../models/Product.js';
import { parseTelegramSupplierMessage } from '../telegram/parsers/aiAssistedParser.js';
import { calculateCandidateConfidence } from '../telegram/confidence/confidenceEngine.js';
import { normalizeCandidate, toAutomationNormalizedProduct } from '../telegram/normalization/productNormalizer.js';
import {
  getCandidateReviewStatus,
  getReviewPriority,
  getReviewTaskType,
  shouldAutoApplyCandidate
} from '../telegram/review/reviewPolicy.js';
import {
  enqueueExtraction,
  enqueueReview
} from '../telegram/queue/telegramQueues.js';
import { applyNormalizedProductUpdate } from './automationDataService.js';

export const processRawMessagePayload = async (payload, { enqueueNext = true } = {}) => {
  const telegramMessage = await upsertTelegramMessage(payload);

  if (enqueueNext) {
    try {
      await enqueueExtraction({ telegramMessageId: telegramMessage._id.toString() });
    } catch (error) {
      await processExtractionForMessage({ telegramMessageId: telegramMessage._id.toString() }, { enqueueNext: false });
    }
  }

  return telegramMessage;
};

export const processExtractionForMessage = async ({ telegramMessageId }, { enqueueNext = true } = {}) => {
  const telegramMessage = await TelegramMessage.findById(telegramMessageId);
  if (!telegramMessage) {
    throw new Error('Telegram message not found for extraction');
  }

  telegramMessage.extractionStatus = TELEGRAM_EXTRACTION_STATUS.PROCESSING;
  telegramMessage.processingAttempts += 1;
  await telegramMessage.save();

  try {
    const productDictionary = await Product.find().select('name productId').limit(1000);
    const knownSupplier = await isKnownTelegramSupplier(telegramMessage);
    const parsed = parseTelegramSupplierMessage(telegramMessage, {
      productDictionary,
      knownSupplier
    });

    if (!parsed.candidates.length) {
      telegramMessage.processed = true;
      telegramMessage.extractionStatus = TELEGRAM_EXTRACTION_STATUS.NO_PRODUCT_SIGNAL;
      telegramMessage.processedAt = new Date();
      await telegramMessage.save();

      return {
        telegramMessage,
        candidates: []
      };
    }

    const candidates = [];

    for (const parsedCandidate of parsed.candidates) {
      const confidenceResult = calculateCandidateConfidence(parsedCandidate, {
        knownSupplier,
        repeatedPattern: await hasRepeatedPattern(telegramMessage.channelName, parsedCandidate.normalizedName)
      });
      const normalized = normalizeCandidate(parsedCandidate, telegramMessage, confidenceResult);
      const reviewStatus = getCandidateReviewStatus({
        confidence: normalized.confidence,
        requiresReview: normalized.requiresReview
      });

      const candidate = await ExtractedProductCandidate.create({
        ...normalized,
        reviewStatus,
        candidateData: {
          ...normalized.candidateData,
          sourceUrl: normalized.sourceUrl,
          parserReasoning: parsed.parserReasoning
        }
      });

      candidates.push(candidate);

      if (shouldAutoApplyCandidate(candidate, env.telegramAutoApplyConfidence)) {
        await applyAutoConfirmedCandidate(candidate);
      } else if (enqueueNext) {
        try {
          await enqueueReview({ candidateId: candidate._id.toString() });
        } catch {
          await processReviewForCandidate({ candidateId: candidate._id.toString() });
        }
      } else {
        await processReviewForCandidate({ candidateId: candidate._id.toString() });
      }
    }

    telegramMessage.processed = true;
    telegramMessage.extractionStatus = TELEGRAM_EXTRACTION_STATUS.EXTRACTED;
    telegramMessage.processedAt = new Date();
    await telegramMessage.save();

    return {
      telegramMessage,
      candidates
    };
  } catch (error) {
    telegramMessage.extractionStatus = TELEGRAM_EXTRACTION_STATUS.FAILED;
    telegramMessage.errorMessage = error.message;
    await telegramMessage.save();
    throw error;
  }
};

export const processReviewForCandidate = async ({ candidateId }) => {
  const candidate = await ExtractedProductCandidate.findById(candidateId);
  if (!candidate) {
    throw new Error('Extracted product candidate not found for review');
  }

  if (candidate.reviewStatus === REVIEW_STATUS.AUTO_CONFIRMED) {
    return null;
  }

  const existingTask = await ReviewTask.findOne({ candidate: candidate._id });
  if (existingTask) return existingTask;

  return ReviewTask.create({
    taskType: getReviewTaskType(candidate),
    priority: getReviewPriority(candidate),
    candidate: candidate._id,
    sourceMessage: candidate.sourceMessage,
    extractedData: candidate.toObject(),
    confidence: candidate.confidence,
    assignedStatus: REVIEW_ASSIGNED_STATUS.OPEN
  });
};

export const applyReviewedCandidate = async (candidateId, { reviewedBy = '', reviewNotes = '' } = {}) => {
  const candidate = await ExtractedProductCandidate.findById(candidateId);
  if (!candidate) {
    throw new Error('Extracted product candidate not found');
  }

  const result = await applyNormalizedProductUpdate(toAutomationNormalizedProduct(candidate));

  candidate.reviewStatus = REVIEW_STATUS.VERIFIED;
  candidate.requiresReview = false;
  candidate.appliedAt = new Date();
  await candidate.save();

  await ReviewTask.updateMany(
    { candidate: candidate._id },
    {
      $set: {
        assignedStatus: REVIEW_ASSIGNED_STATUS.RESOLVED,
        reviewedBy,
        reviewNotes,
        resolution: 'VERIFIED',
        resolvedAt: new Date()
      }
    }
  );

  return {
    candidate,
    result
  };
};

export const rejectCandidate = async (candidateId, { reviewedBy = '', reviewNotes = '' } = {}) => {
  const candidate = await ExtractedProductCandidate.findById(candidateId);
  if (!candidate) {
    throw new Error('Extracted product candidate not found');
  }

  candidate.reviewStatus = REVIEW_STATUS.REJECTED;
  candidate.requiresReview = false;
  await candidate.save();

  await ReviewTask.updateMany(
    { candidate: candidate._id },
    {
      $set: {
        assignedStatus: REVIEW_ASSIGNED_STATUS.RESOLVED,
        reviewedBy,
        reviewNotes,
        resolution: 'REJECTED',
        resolvedAt: new Date()
      }
    }
  );

  return candidate;
};

const upsertTelegramMessage = async (payload) => {
  const channelId = String(payload.channelId || payload.channel?.channelId || payload.channelName || 'unknown');
  const channelName = String(payload.channelName || payload.channel?.username || payload.channel?.title || channelId);
  const messageId = Number(payload.messageId || payload.id || Date.now());
  const receivedAt = payload.receivedAt || payload.detectedAt || new Date();
  const rawText = payload.rawText || payload.text || payload.message || payload.caption || '';
  const messageFingerprint = buildMessageFingerprint({ channelId, messageId, rawText, receivedAt });

  return TelegramMessage.findOneAndUpdate(
    {
      $or: [
        { channelId, messageId },
        { messageFingerprint }
      ]
    },
    {
      $setOnInsert: {
        messageId,
        channelId,
        channelName,
        sender: payload.sender || {},
        rawText,
        media: normalizeMedia(payload.media),
        receivedAt,
        messageFingerprint,
        metadata: payload.metadata || payload.rawMessage || {},
        extractionStatus: TELEGRAM_EXTRACTION_STATUS.QUEUED
      }
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );
};

const normalizeMedia = (media = {}) => ({
  hasMedia: Boolean(media.hasMedia || media.mediaType || media.photo || media.document),
  mediaType: media.mediaType || media.type || '',
  caption: media.caption || '',
  fileName: media.fileName || ''
});

const buildMessageFingerprint = ({ channelId, messageId, rawText, receivedAt }) =>
  crypto
    .createHash('sha1')
    .update(`${channelId}:${messageId}:${rawText}:${new Date(receivedAt).toISOString()}`)
    .digest('hex');

const isKnownTelegramSupplier = async (telegramMessage) => {
  const channel = await TelegramChannel.findOne({
    $or: [
      { username: telegramMessage.channelName },
      { channelId: telegramMessage.channelId },
      { title: telegramMessage.channelName }
    ]
  });

  return Boolean(channel);
};

const hasRepeatedPattern = async (sourceChannel, normalizedName) => {
  if (!sourceChannel || !normalizedName) return false;

  const count = await ExtractedProductCandidate.countDocuments({
    sourceChannel,
    normalizedName,
    extractedAt: {
      $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    }
  });

  return count >= 2;
};

const applyAutoConfirmedCandidate = async (candidate) => {
  const result = await applyNormalizedProductUpdate(toAutomationNormalizedProduct(candidate));
  candidate.reviewStatus = REVIEW_STATUS.AUTO_CONFIRMED;
  candidate.appliedAt = new Date();
  await candidate.save();

  return result;
};
