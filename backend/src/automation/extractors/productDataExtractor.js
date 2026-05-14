import { normalizeText } from '../utils/sourceUtils.js';

const PRICE_PATTERNS = [
  /(?:₹|rs\.?|inr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
  /([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:₹|rs\.?|inr)/i,
  /(?:price|rate|wholesale|deal)\D{0,20}([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i
];

const OUT_OF_STOCK_PATTERNS = [
  /out\s*of\s*stock/i,
  /sold\s*out/i,
  /not\s*available/i,
  /unavailable/i,
  /stock\s*(?:0|zero|nil|finished)/i,
  /no\s*stock/i
];

const IN_STOCK_PATTERNS = [
  /in\s*stock/i,
  /stock\s*available/i,
  /available/i,
  /ready\s*stock/i,
  /limited\s*stock/i
];

export const extractPrice = (value = '') => {
  const text = normalizeText(value);

  for (const pattern of PRICE_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return Number(match[1].replace(/,/g, ''));
    }
  }

  return 0;
};

export const extractAvailability = (value = '', fallback = true) => {
  const text = normalizeText(value);

  if (OUT_OF_STOCK_PATTERNS.some((pattern) => pattern.test(text))) {
    return false;
  }

  if (IN_STOCK_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  return fallback;
};

export const extractProductNameFromText = (value = '') => {
  const text = String(value || '').trim();
  if (!text) return '';

  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeText(line))
    .filter(Boolean);

  const usefulLine = lines.find((line) => !PRICE_PATTERNS.some((pattern) => pattern.test(line)));
  if (!usefulLine) return normalizeText(lines[0] || '');

  return usefulLine
    .replace(/(?:stock\s*available|in\s*stock|available|out\s*of\s*stock).*/i, '')
    .trim();
};

export const extractStockQuantity = (value = '') => {
  const text = normalizeText(value);
  const match = text.match(/(?:stock|qty|quantity)\D{0,12}([0-9]+)/i);

  return match?.[1] ? Number(match[1]) : null;
};
