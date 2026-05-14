import { env } from '../../config/env.js';

export const calculateCandidateConfidence = (candidate, context = {}) => {
  const factors = [];
  let score = 20;

  if (candidate.signals.productNameCertainty === 'known-exact') {
    score += 25;
    factors.push('Known product exact match (+25)');
  } else if (candidate.signals.productNameCertainty === 'known-fuzzy') {
    score += 18;
    factors.push('Known product fuzzy match (+18)');
  } else if (candidate.signals.productNameCertainty === 'pattern') {
    score += 16;
    factors.push('Known shorthand pattern (+16)');
  } else if (candidate.signals.productNameCertainty === 'heuristic') {
    score += 12;
    factors.push('Readable product-like name (+12)');
  } else if (candidate.signals.productNameCertainty === 'weak') {
    score += 4;
    factors.push('Weak product name (+4)');
  } else {
    score -= 10;
    factors.push('Missing product name (-10)');
  }

  if (candidate.signals.priceCertainty === 'single') {
    score += 25;
    factors.push('Single price detected (+25)');
  } else if (candidate.signals.priceCertainty === 'range') {
    score -= 22;
    factors.push('Price range ambiguity (-22)');
  } else if (candidate.signals.priceCertainty === 'multiple') {
    score += 6;
    score -= 16;
    factors.push('Multiple prices detected (+6, ambiguity -16)');
  } else {
    score -= 12;
    factors.push('Missing price (-12)');
  }

  if (candidate.signals.stockCertainty === 'explicit-available') {
    score += 10;
    factors.push('Explicit availability wording (+10)');
  } else if (candidate.signals.stockCertainty === 'explicit-unavailable') {
    score += 10;
    factors.push('Explicit unavailability wording (+10)');
  } else {
    score -= 4;
    factors.push('Missing stock signal (-4)');
  }

  if (candidate.signals.knownSupplier || context.knownSupplier) {
    score += 10;
    factors.push('Known configured supplier/channel (+10)');
  } else {
    score -= 5;
    factors.push('Unknown supplier/channel (-5)');
  }

  if (candidate.signals.structuredFormatting) {
    score += 8;
    factors.push('Structured message formatting (+8)');
  }

  if (context.repeatedPattern) {
    score += 5;
    factors.push('Repeated channel pattern (+5)');
  }

  if (candidate.signals.hasMedia && !candidate.productName) {
    score -= 8;
    factors.push('Media-heavy message without text name (-8)');
  }

  if (candidate.uncertaintyFlags.includes('MULTI_PRODUCT_MESSAGE')) {
    score -= 6;
    factors.push('Multi-product message needs separation (-6)');
  }

  if (candidate.uncertaintyFlags.includes('SHORT_PRODUCT_NAME')) {
    score -= 8;
    factors.push('Short product name (-8)');
  }

  const confidence = clampScore(score);
  const confidenceBand = getConfidenceBand(confidence);
  const requiresReview =
    confidence < env.telegramAutoApplyConfidence ||
    candidate.uncertaintyFlags.includes('PRICE_RANGE') ||
    candidate.uncertaintyFlags.includes('MULTIPLE_PRICES') ||
    candidate.uncertaintyFlags.includes('PRODUCT_NAME_MISSING');

  return {
    confidence,
    confidenceBand,
    requiresReview,
    factors
  };
};

export const getConfidenceBand = (confidence) => {
  if (confidence >= 90) return 'HIGHLY_RELIABLE';
  if (confidence >= 70) return 'LIKELY_CORRECT';
  if (confidence >= 40) return 'NEEDS_REVIEW';
  return 'LOW_CONFIDENCE';
};

export const getReviewStatusForConfidence = (confidence, requiresReview) => {
  if (!requiresReview && confidence >= env.telegramAutoApplyConfidence) return 'AUTO_CONFIRMED';
  if (confidence < 40) return 'LOW_CONFIDENCE';
  return 'NEEDS_REVIEW';
};

export const getReviewPriorityForCandidate = (candidate) => {
  if (candidate.confidence < 40) return 'HIGH';
  if (candidate.uncertaintyFlags?.some((flag) => ['PRICE_RANGE', 'MULTIPLE_PRICES'].includes(flag))) {
    return 'HIGH';
  }
  if (candidate.confidence < 70) return 'MEDIUM';
  return 'LOW';
};

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));
