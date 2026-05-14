import {
  extractAvailability,
  extractPrice,
  extractStockQuantity
} from '../extractors/productDataExtractor.js';
import { normalizeText } from '../utils/sourceUtils.js';

const PRICE_TOKEN_PATTERN = /(?:₹|rs\.?|inr)\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?|[0-9][0-9,]*(?:\.[0-9]{1,2})?\s*(?:₹|rs\.?|inr)/gi;
const STOCK_LINE_PATTERN = /(stock|available|unavailable|sold\s*out|out\s*of\s*stock|ready\s*stock|qty|quantity)/i;
const URL_PATTERN = /https?:\/\/\S+/gi;
const HASHTAG_PATTERN = /#[\w-]+/g;

export const parseTelegramMessage = (message = '') => {
  const text = String(message || '').trim();
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeText(line))
    .filter(Boolean);

  const productName = extractTelegramProductName(lines, text);
  const price = extractPrice(text);
  const availability = extractAvailability(text, true);
  const stockQuantity = extractStockQuantity(text);

  return {
    productName,
    price,
    availability,
    stockQuantity,
    text
  };
};

const extractTelegramProductName = (lines, fallbackText) => {
  const line = lines.find((item) => {
    const withoutPrice = item.replace(PRICE_TOKEN_PATTERN, '').trim();
    return withoutPrice && !STOCK_LINE_PATTERN.test(withoutPrice);
  });

  const candidate = line || lines[0] || fallbackText || '';

  return normalizeText(
    candidate
      .replace(URL_PATTERN, '')
      .replace(HASHTAG_PATTERN, '')
      .replace(PRICE_TOKEN_PATTERN, '')
      .replace(/\b(stock|available|ready stock|limited stock|out of stock|sold out)\b/gi, '')
      .replace(/[-:|]+$/g, '')
  );
};
