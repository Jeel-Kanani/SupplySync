import { SOURCE_TYPES } from '../config/constants.js';
import {
  extractAvailability,
  extractPrice,
  extractProductNameFromText
} from '../automation/extractors/productDataExtractor.js';
import { normalizeText } from '../automation/utils/sourceUtils.js';

const buildNormalizedProduct = ({
  productName = '',
  supplierName = '',
  sourceType,
  sourceUrl = '',
  price = 0,
  availability = true,
  detectedAt = new Date(),
  rawData = {}
}) => ({
  productName: normalizeText(productName),
  supplierName: normalizeText(supplierName),
  sourceType,
  sourceUrl: normalizeText(sourceUrl),
  price: Number(price || 0),
  availability: availability !== false,
  detectedAt: detectedAt instanceof Date ? detectedAt.toISOString() : new Date(detectedAt).toISOString(),
  rawData
});

export const normalizeWebsiteData = (rawData = {}, source = {}) => {
  const combinedText = [
    rawData.title,
    rawData.productName,
    rawData.priceText,
    rawData.availabilityText,
    rawData.bodyText
  ]
    .filter(Boolean)
    .join('\n');

  const productName =
    rawData.productName ||
    rawData.title ||
    extractProductNameFromText(combinedText);
  const price = Number(rawData.price || 0) || extractPrice(combinedText);
  const availability =
    rawData.availability === undefined
      ? extractAvailability(combinedText, true)
      : rawData.availability;

  return buildNormalizedProduct({
    productName,
    supplierName: source.supplierName || rawData.supplierName || '',
    sourceType: source.sourceType || rawData.sourceType || SOURCE_TYPES.WEBSITE,
    sourceUrl: source.sourceUrl || source.url || rawData.sourceUrl || '',
    price,
    availability,
    detectedAt: rawData.detectedAt || new Date(),
    rawData
  });
};

export const normalizeTelegramData = (rawData = {}, source = {}) => {
  const text = rawData.text || rawData.message || '';
  const productName =
    rawData.productName ||
    extractProductNameFromText(text);
  const price = Number(rawData.price || 0) || extractPrice(text);
  const availability =
    rawData.availability === undefined
      ? extractAvailability(text, true)
      : rawData.availability;

  return buildNormalizedProduct({
    productName,
    supplierName: source.supplierName || rawData.supplierName || source.title || '',
    sourceType: SOURCE_TYPES.TELEGRAM,
    sourceUrl: source.sourceUrl || rawData.sourceUrl || '',
    price,
    availability,
    detectedAt: rawData.detectedAt || new Date(),
    rawData
  });
};

export const isNormalizedProductUsable = (normalizedProduct) =>
  Boolean(
    normalizedProduct?.productName &&
      normalizedProduct?.sourceType &&
      normalizedProduct?.detectedAt &&
      Number(normalizedProduct.price) >= 0
  );
