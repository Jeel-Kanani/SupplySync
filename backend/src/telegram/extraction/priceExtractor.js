import { normalizeWhitespace } from '../utils/textUtils.js';

const CURRENCY_PRICE_PATTERN =
  /(?:₹|rs\.?|inr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)|([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:₹|rs\.?|inr)/gi;
const CONTEXT_PRICE_PATTERN =
  /(?:price|rate|deal|wholesale|cost|mrp)\D{0,16}([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi;
const UNIT_PRICE_PATTERN =
  /\b([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:\/\s*)?(?:pc|pcs|piece|pieces|unit|only)\b/gi;
const PRICE_RANGE_PATTERN =
  /(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*[-–to]+\s*(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;

export const extractPriceSignals = (text = '') => {
  const normalized = normalizeWhitespace(text);
  const rangeMatch = normalized.match(PRICE_RANGE_PATTERN);
  const prices = [
    ...collectPrices(normalized, CURRENCY_PRICE_PATTERN),
    ...collectPrices(normalized, CONTEXT_PRICE_PATTERN),
    ...collectPrices(normalized, UNIT_PRICE_PATTERN)
  ];
  const uniquePrices = [...new Set(prices)].filter((price) => price > 0);
  const reasoning = [];
  const uncertaintyFlags = [];

  if (rangeMatch) {
    const detectedPriceRange = [
      parsePrice(rangeMatch[1]),
      parsePrice(rangeMatch[2])
    ].filter((price) => price > 0);

    if (detectedPriceRange.length === 2) {
      reasoning.push('Detected a price range instead of a single price.');
      uncertaintyFlags.push('PRICE_RANGE');

      return {
        detectedPrice: 0,
        detectedPriceRange,
        normalizedPrice: 0,
        priceCertainty: 'range',
        allPrices: detectedPriceRange,
        reasoning,
        uncertaintyFlags
      };
    }
  }

  if (uniquePrices.length === 1) {
    reasoning.push('Detected one price-like value with supplier-message context.');
    return {
      detectedPrice: uniquePrices[0],
      detectedPriceRange: [],
      normalizedPrice: uniquePrices[0],
      priceCertainty: 'single',
      allPrices: uniquePrices,
      reasoning,
      uncertaintyFlags
    };
  }

  if (uniquePrices.length > 1) {
    reasoning.push('Detected multiple price-like values; human verification is needed.');
    uncertaintyFlags.push('MULTIPLE_PRICES');

    return {
      detectedPrice: uniquePrices[0],
      detectedPriceRange: uniquePrices.slice(0, 2),
      normalizedPrice: 0,
      priceCertainty: 'multiple',
      allPrices: uniquePrices,
      reasoning,
      uncertaintyFlags
    };
  }

  reasoning.push('No reliable price pattern was detected.');
  uncertaintyFlags.push('PRICE_MISSING');

  return {
    detectedPrice: 0,
    detectedPriceRange: [],
    normalizedPrice: 0,
    priceCertainty: 'missing',
    allPrices: [],
    reasoning,
    uncertaintyFlags
  };
};

const collectPrices = (text, pattern) => {
  const prices = [];
  let match = pattern.exec(text);

  while (match) {
    const value = match[1] || match[2];
    const price = parsePrice(value);

    if (price > 0) prices.push(price);
    match = pattern.exec(text);
  }

  pattern.lastIndex = 0;
  return prices;
};

const parsePrice = (value = '') => Number(String(value).replace(/,/g, '')) || 0;
