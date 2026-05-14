import {
  REVIEW_PRIORITIES,
  REVIEW_STATUS,
  REVIEW_TASK_TYPES
} from '../../config/constants.js';
import { env } from '../../config/env.js';

export const getCandidateReviewStatus = ({ confidence, requiresReview }) => {
  if (!requiresReview && confidence >= env.telegramAutoApplyConfidence) return REVIEW_STATUS.AUTO_CONFIRMED;
  if (confidence < 40) return REVIEW_STATUS.LOW_CONFIDENCE;
  return REVIEW_STATUS.NEEDS_REVIEW;
};

export const getReviewTaskType = (candidate) => {
  if (candidate.uncertaintyFlags?.includes('PRICE_RANGE') || candidate.uncertaintyFlags?.includes('MULTIPLE_PRICES')) {
    return REVIEW_TASK_TYPES.PRICE_AMBIGUITY;
  }

  if (candidate.uncertaintyFlags?.includes('STOCK_MISSING')) {
    return REVIEW_TASK_TYPES.STOCK_AMBIGUITY;
  }

  return REVIEW_TASK_TYPES.PRODUCT_EXTRACTION;
};

export const getReviewPriority = (candidate) => {
  if (candidate.confidence < 40) return REVIEW_PRIORITIES.HIGH;
  if (candidate.uncertaintyFlags?.some((flag) => ['PRICE_RANGE', 'MULTIPLE_PRICES'].includes(flag))) {
    return REVIEW_PRIORITIES.HIGH;
  }
  if (candidate.confidence < 70) return REVIEW_PRIORITIES.MEDIUM;
  return REVIEW_PRIORITIES.LOW;
};

export const shouldAutoApplyCandidate = (candidate, autoApplyConfidence) =>
  candidate.confidence >= autoApplyConfidence &&
  candidate.requiresReview === false &&
  Number(candidate.normalizedPrice || candidate.detectedPrice || 0) > 0 &&
  !candidate.uncertaintyFlags?.some((flag) =>
    ['PRICE_RANGE', 'MULTIPLE_PRICES', 'PRODUCT_NAME_MISSING'].includes(flag)
  );
