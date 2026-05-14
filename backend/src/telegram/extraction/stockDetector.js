import { normalizeWhitespace } from '../utils/textUtils.js';

const AVAILABLE_PATTERNS = [
  /\bavailable\b/i,
  /\bstock\b/i,
  /\bready\b/i,
  /\binstock\b/i,
  /\bin\s*stock\b/i,
  /\bready\s*stock\b/i,
  /\blive\s*stock\b/i
];

const UNAVAILABLE_PATTERNS = [
  /\bsold\s*out\b/i,
  /\bout\s*of\s*stock\b/i,
  /\bfinished\b/i,
  /\bnot\s*available\b/i,
  /\bunavailable\b/i,
  /\bstock\s*(?:0|zero|nil)\b/i
];

export const detectStockSignals = (text = '') => {
  const normalized = normalizeWhitespace(text);
  const quantityMatch = normalized.match(/\b(?:qty|quantity|stock)\D{0,10}([0-9]+)/i);
  const reasoning = [];
  const uncertaintyFlags = [];

  if (UNAVAILABLE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    reasoning.push('Detected unavailable stock wording.');
    return {
      availability: false,
      stockQuantity: quantityMatch?.[1] ? Number(quantityMatch[1]) : 0,
      stockCertainty: 'explicit-unavailable',
      reasoning,
      uncertaintyFlags
    };
  }

  if (AVAILABLE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    reasoning.push('Detected available stock wording.');
    return {
      availability: true,
      stockQuantity: quantityMatch?.[1] ? Number(quantityMatch[1]) : null,
      stockCertainty: 'explicit-available',
      reasoning,
      uncertaintyFlags
    };
  }

  reasoning.push('No explicit stock signal was found.');
  uncertaintyFlags.push('STOCK_MISSING');

  return {
    availability: null,
    stockQuantity: null,
    stockCertainty: 'missing',
    reasoning,
    uncertaintyFlags
  };
};
