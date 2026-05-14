import {
  normalizeNameKey,
  normalizeWhitespace,
  stripDecorations,
  toTitleCase,
  tokenOverlapScore
} from '../utils/textUtils.js';

const PRICE_TOKEN_PATTERN =
  /(?:₹|rs\.?|inr)\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?|[0-9][0-9,]*(?:\.[0-9]{1,2})?\s*(?:₹|rs\.?|inr|\/?\s*(?:pc|pcs|piece|pieces|unit|only))/gi;
const RANGE_TOKEN_PATTERN =
  /(?:₹|rs\.?|inr)?\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?\s*[-–]\s*(?:₹|rs\.?|inr)?\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?/gi;
const STOCK_TOKEN_PATTERN =
  /\b(?:stock|available|ready|instock|in stock|sold out|out of stock|finished|qty|quantity)\b.*$/i;
const URL_PATTERN = /https?:\/\/\S+/gi;
const HASHTAG_PATTERN = /#[\w-]+/g;
const CODE_PATTERN = /\b(?:sku|code|item)\s*[:#-]?\s*[a-z0-9-]+\b/gi;

const NORMALIZATION_DICTIONARY = [
  { pattern: /\bspider\s*(?:web\s*)?shooter\b/i, normalizedName: 'Spider Web Shooter' },
  { pattern: /\bweb\s*shooter\b/i, normalizedName: 'Spider Web Shooter' },
  { pattern: /\bmini\s*printer\b/i, normalizedName: 'Mini Printer' },
  { pattern: /\bled\s*strip\b/i, normalizedName: 'LED Strip Light' },
  { pattern: /\bphone\s*holder\b/i, normalizedName: 'Phone Holder' }
];

export const extractProductNameSignals = (segment = '', productDictionary = []) => {
  const cleaned = cleanupProductText(segment);
  const dictionaryMatch = findDictionaryMatch(cleaned, productDictionary);
  const builtInMatch = NORMALIZATION_DICTIONARY.find((item) => item.pattern.test(cleaned));
  const reasoning = [];
  const uncertaintyFlags = [];

  if (!cleaned) {
    reasoning.push('No product-like text remained after removing price and stock tokens.');
    uncertaintyFlags.push('PRODUCT_NAME_MISSING');
    return {
      productName: '',
      normalizedName: '',
      productNameCertainty: 'missing',
      reasoning,
      uncertaintyFlags
    };
  }

  if (dictionaryMatch) {
    reasoning.push(`Matched existing product dictionary entry: ${dictionaryMatch.name}.`);
    return {
      productName: cleaned,
      normalizedName: dictionaryMatch.name,
      productNameCertainty: dictionaryMatch.score >= 0.8 ? 'known-exact' : 'known-fuzzy',
      reasoning,
      uncertaintyFlags
    };
  }

  if (builtInMatch) {
    reasoning.push(`Normalized common supplier shorthand to ${builtInMatch.normalizedName}.`);
    return {
      productName: cleaned,
      normalizedName: builtInMatch.normalizedName,
      productNameCertainty: 'pattern',
      reasoning,
      uncertaintyFlags
    };
  }

  if (cleaned.split(' ').length < 2) {
    reasoning.push('Product name is very short and may be incomplete.');
    uncertaintyFlags.push('SHORT_PRODUCT_NAME');
  } else {
    reasoning.push('Used cleaned product-like message segment as product name.');
  }

  return {
    productName: cleaned,
    normalizedName: toTitleCase(cleaned),
    productNameCertainty: uncertaintyFlags.includes('SHORT_PRODUCT_NAME') ? 'weak' : 'heuristic',
    reasoning,
    uncertaintyFlags
  };
};

const cleanupProductText = (value = '') =>
  stripDecorations(value)
    .replace(URL_PATTERN, '')
    .replace(HASHTAG_PATTERN, '')
    .replace(CODE_PATTERN, '')
    .replace(RANGE_TOKEN_PATTERN, '')
    .replace(PRICE_TOKEN_PATTERN, '')
    .replace(STOCK_TOKEN_PATTERN, '')
    .replace(/[|:=-]+$/g, '')
    .replace(/^[|:=-]+/g, '')
    .replace(/\bnew\s*arrival\b/gi, '')
    .replace(/\border\s*now\b/gi, '')
    .replace(/\bdm\b.*$/gi, '')
    .trim();

const findDictionaryMatch = (candidate, productDictionary) => {
  if (!candidate || !Array.isArray(productDictionary) || !productDictionary.length) return null;

  const exact = productDictionary.find(
    (product) => normalizeNameKey(product.name) === normalizeNameKey(candidate)
  );

  if (exact) {
    return {
      name: exact.name,
      score: 1
    };
  }

  const fuzzy = productDictionary
    .map((product) => ({
      name: product.name,
      score: tokenOverlapScore(candidate, product.name)
    }))
    .filter((match) => match.score >= 0.55)
    .sort((first, second) => second.score - first.score)[0];

  return fuzzy || null;
};
