import { extractPriceSignals } from '../extraction/priceExtractor.js';
import { extractProductNameSignals } from '../extraction/productNameExtractor.js';
import { detectStockSignals } from '../extraction/stockDetector.js';
import { splitMessageIntoSegments } from '../utils/textUtils.js';

export const parseTelegramSupplierMessage = (
  message,
  {
    productDictionary = [],
    knownSupplier = false
  } = {}
) => {
  const rawText = message.rawText || message.text || '';
  const segments = splitMessageIntoSegments(rawText);
  const candidateSegments = buildCandidateSegments(segments);

  if (!candidateSegments.length) {
    return {
      candidates: [],
      parserReasoning: ['No product, price, or stock signal was strong enough to create a candidate.'],
      messageSignals: {
        hasMedia: Boolean(message.media?.hasMedia),
        knownSupplier
      }
    };
  }

  const candidates = candidateSegments.map((segment, index) => {
    const priceSignals = extractPriceSignals(segment);
    const stockSignals = detectStockSignals(segment);
    const productSignals = extractProductNameSignals(segment, productDictionary);

    return {
      segment,
      index,
      productName: productSignals.productName,
      normalizedName: productSignals.normalizedName,
      detectedPrice: priceSignals.detectedPrice,
      detectedPriceRange: priceSignals.detectedPriceRange,
      normalizedPrice: priceSignals.normalizedPrice,
      availability: stockSignals.availability,
      stockQuantity: stockSignals.stockQuantity,
      signals: {
        priceCertainty: priceSignals.priceCertainty,
        productNameCertainty: productSignals.productNameCertainty,
        stockCertainty: stockSignals.stockCertainty,
        allPrices: priceSignals.allPrices,
        knownSupplier,
        hasMedia: Boolean(message.media?.hasMedia),
        structuredFormatting: segments.length > 1,
        segmentCount: candidateSegments.length
      },
      extractionReasoning: [
        ...productSignals.reasoning,
        ...priceSignals.reasoning,
        ...stockSignals.reasoning
      ],
      uncertaintyFlags: [
        ...productSignals.uncertaintyFlags,
        ...priceSignals.uncertaintyFlags,
        ...stockSignals.uncertaintyFlags,
        ...(candidateSegments.length > 1 ? ['MULTI_PRODUCT_MESSAGE'] : [])
      ]
    };
  });

  return {
    candidates,
    parserReasoning: [
      `Evaluated ${segments.length || 1} message segment(s).`,
      `Created ${candidates.length} product candidate(s) from product-like signals.`
    ],
    messageSignals: {
      hasMedia: Boolean(message.media?.hasMedia),
      knownSupplier,
      segmentCount: segments.length
    }
  };
};

const buildCandidateSegments = (segments) => {
  const groups = [];

  segments.forEach((segment) => {
    if (hasProductPriceSignal(segment)) {
      groups.push(segment);
      return;
    }

    if (hasStockOnlySignal(segment) && groups.length) {
      groups[groups.length - 1] = `${groups[groups.length - 1]}\n${segment}`;
      return;
    }

    if (hasStockOnlySignal(segment)) {
      groups.push(segment);
    }
  });

  return groups;
};

const hasProductPriceSignal = (segment = '') =>
  /(?:₹|rs\.?|inr|\/\s*(?:pc|piece)|\bonly\b|\bprice\b|\brate\b|\b[0-9][0-9,]*(?:\.[0-9]{1,2})?\s*[-–]\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?\b)/i.test(segment);

const hasStockOnlySignal = (segment = '') =>
  /(?:\bstock\b|\bavailable\b|\bsold\s*out\b|\bout\s*of\s*stock\b|\bfinished\b|\bready\b|\binstock\b)/i.test(segment);
