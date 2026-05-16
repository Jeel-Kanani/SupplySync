import { SOURCE_TYPES } from '../../config/constants.js';
import { normalizeNameKey, toTitleCase } from '../utils/textUtils.js';

export const normalizeCandidate = (candidate, sourceMessage, confidenceResult, parserMeta = {}) => {
  const normalizedName =
    candidate.normalizedName ||
    toTitleCase(candidate.productName || '');
  const normalizedPrice =
    candidate.normalizedPrice ||
    (candidate.signals.priceCertainty === 'single' ? candidate.detectedPrice : 0);

  return {
    productName: candidate.productName || normalizedName,
    normalizedName,
    normalizedKey: normalizeNameKey(normalizedName),
    detectedPrice: Number(candidate.detectedPrice || 0),
    detectedPriceRange: candidate.detectedPriceRange || [],
    normalizedPrice: Number(normalizedPrice || 0),
    availability: candidate.availability,
    stockQuantity: candidate.stockQuantity,
    sourceType: SOURCE_TYPES.TELEGRAM,
    sourceChannel: sourceMessage.channelName || sourceMessage.channelId,
    supplierName: sourceMessage.channelName || '',
    sourceMessage: sourceMessage._id,
    sourceMessageId: sourceMessage.messageId,
    sourceUrl: buildTelegramMessageUrl(sourceMessage),
    confidence: confidenceResult.confidence,
    confidenceBand: confidenceResult.confidenceBand,
    requiresReview: confidenceResult.requiresReview,
    parserSource: parserMeta.parserSource || candidate.parserSource || 'heuristic',
    parserProvider: parserMeta.parserProvider || candidate.parserProvider || 'local-rules',
    parserModel: parserMeta.parserModel || candidate.parserModel || '',
    parserConfidence:
      Number.isFinite(Number(candidate.parserConfidence))
        ? Number(candidate.parserConfidence)
        : Number(parserMeta.parserConfidence || 0),
    parserFallbackUsed: Boolean(parserMeta.parserFallbackUsed),
    extractionReasoning: [
      ...candidate.extractionReasoning,
      ...confidenceResult.factors
    ],
    uncertaintyFlags: candidate.uncertaintyFlags || [],
    candidateData: {
      segment: candidate.segment,
      signals: candidate.signals,
      parser: {
        source: parserMeta.parserSource || candidate.parserSource || 'heuristic',
        provider: parserMeta.parserProvider || candidate.parserProvider || 'local-rules',
        model: parserMeta.parserModel || candidate.parserModel || '',
        confidence:
          Number.isFinite(Number(candidate.parserConfidence))
            ? Number(candidate.parserConfidence)
            : Number(parserMeta.parserConfidence || 0),
        fallbackUsed: Boolean(parserMeta.parserFallbackUsed)
      },
      rawText: sourceMessage.rawText,
      media: sourceMessage.media
    },
    extractedAt: new Date()
  };
};

export const toAutomationNormalizedProduct = (candidate) => ({
  productName: candidate.normalizedName || candidate.productName,
  supplierName: candidate.supplierName || candidate.sourceChannel,
  sourceType: SOURCE_TYPES.TELEGRAM,
  sourceUrl: candidate.candidateData?.sourceUrl || '',
  price: Number(candidate.normalizedPrice || candidate.detectedPrice || 0),
  availability: candidate.availability !== false,
  detectedAt: new Date(candidate.extractedAt || Date.now()).toISOString(),
  rawData: {
    candidateId: candidate._id,
    confidence: candidate.confidence,
    confidenceBand: candidate.confidenceBand,
    uncertaintyFlags: candidate.uncertaintyFlags,
    stockQuantity: candidate.stockQuantity,
    reasoning: candidate.extractionReasoning
  }
});

const buildTelegramMessageUrl = (message) => {
  const channelName = String(message.channelName || '').replace(/^@/, '');

  if (!channelName || channelName.match(/^-?\d+$/)) return '';
  return `https://t.me/${channelName}/${message.messageId}`;
};
