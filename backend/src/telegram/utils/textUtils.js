export const normalizeWhitespace = (value = '') =>
  String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();

export const stripDecorations = (value = '') =>
  normalizeWhitespace(value)
    .replace(/[🔥✨✅❌📦💥⭐️🚚🛒💰]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const splitMessageIntoSegments = (text = '') => {
  const normalized = String(text || '').replace(/\r/g, '');
  const lines = normalized
    .split(/\n+/)
    .map((line) => stripDecorations(line))
    .filter(Boolean);

  if (lines.length <= 1) {
    return normalized
      .split(/\s*[;|]\s*/)
      .map((segment) => stripDecorations(segment))
      .filter(Boolean);
  }

  return lines;
};

export const toTitleCase = (value = '') =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

export const normalizeNameKey = (value = '') =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const tokenOverlapScore = (first = '', second = '') => {
  const firstTokens = new Set(normalizeNameKey(first).split(' ').filter(Boolean));
  const secondTokens = new Set(normalizeNameKey(second).split(' ').filter(Boolean));

  if (!firstTokens.size || !secondTokens.size) return 0;

  const overlap = [...firstTokens].filter((token) => secondTokens.has(token)).length;
  return overlap / Math.max(firstTokens.size, secondTokens.size);
};
