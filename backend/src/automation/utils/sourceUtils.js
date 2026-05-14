import { SOURCE_TYPES } from '../../config/constants.js';

export const buildTelegramSourceUrl = (username = '') => {
  const normalized = normalizeTelegramUsername(username);

  if (!normalized) return '';
  if (normalized.startsWith('https://') || normalized.startsWith('http://')) return normalized;

  return `https://t.me/${normalized}`;
};

export const normalizeTelegramUsername = (value = '') =>
  String(value || '')
    .trim()
    .replace(/^https?:\/\/t\.me\//i, '')
    .replace(/^t\.me\//i, '')
    .replace(/^@/, '');

export const detectWebsiteSourceType = (url = '') => {
  const normalizedUrl = String(url || '').toLowerCase();
  return normalizedUrl.includes('indiamart.com') ? SOURCE_TYPES.INDIAMART : SOURCE_TYPES.WEBSITE;
};

export const normalizeText = (value = '') =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizeNameKey = (value = '') =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const isValidHttpUrl = (value = '') => /^https?:\/\/.+/i.test(String(value || '').trim());
