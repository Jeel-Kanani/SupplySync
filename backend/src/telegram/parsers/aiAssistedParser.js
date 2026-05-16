import { env } from '../../config/env.js';
import { extractPriceSignals } from '../extraction/priceExtractor.js';
import { extractProductNameSignals } from '../extraction/productNameExtractor.js';
import { detectStockSignals } from '../extraction/stockDetector.js';
import { splitMessageIntoSegments, normalizeWhitespace, toTitleCase } from '../utils/textUtils.js';

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/responses';
const HEURISTIC_MODEL_NAME = 'heuristic-v1';

const CANDIDATE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'segment',
    'product_name',
    'normalized_name',
    'detected_price',
    'detected_price_range',
    'normalized_price',
    'availability',
    'stock_quantity',
    'parser_confidence',
    'signals',
    'extraction_reasoning',
    'uncertainty_flags'
  ],
  properties: {
    segment: { type: 'string' },
    product_name: { type: 'string' },
    normalized_name: { type: 'string' },
    detected_price: { type: 'number', minimum: 0 },
    detected_price_range: {
      type: 'array',
      items: { type: 'number', minimum: 0 },
      minItems: 0,
      maxItems: 2
    },
    normalized_price: { type: 'number', minimum: 0 },
    availability: { type: ['boolean', 'null'] },
    stock_quantity: { type: ['integer', 'null'], minimum: 0 },
    parser_confidence: { type: 'number', minimum: 0, maximum: 100 },
    signals: {
      type: 'object',
      additionalProperties: false,
      required: [
        'product_name_certainty',
        'price_certainty',
        'stock_certainty',
        'all_prices',
        'known_supplier',
        'has_media',
        'structured_formatting',
        'segment_count'
      ],
      properties: {
        product_name_certainty: {
          type: 'string',
          enum: ['known-exact', 'known-fuzzy', 'pattern', 'heuristic', 'weak', 'missing']
        },
        price_certainty: {
          type: 'string',
          enum: ['single', 'range', 'multiple', 'missing']
        },
        stock_certainty: {
          type: 'string',
          enum: ['explicit-available', 'explicit-unavailable', 'missing']
        },
        all_prices: {
          type: 'array',
          items: { type: 'number', minimum: 0 },
          minItems: 0
        },
        known_supplier: { type: 'boolean' },
        has_media: { type: 'boolean' },
        structured_formatting: { type: 'boolean' },
        segment_count: { type: 'integer', minimum: 0 }
      }
    },
    extraction_reasoning: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1
    },
    uncertainty_flags: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0
    }
  }
};

const OPENAI_SCHEMA = {
  name: 'telegram_supplier_message_extraction',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'parser_source',
      'parser_provider',
      'parser_model',
      'parser_confidence',
      'parser_reasoning',
      'message_signals',
      'candidates'
    ],
    properties: {
      parser_source: { type: 'string', enum: ['openai'] },
      parser_provider: { type: 'string', enum: ['openai'] },
      parser_model: { type: 'string' },
      parser_confidence: { type: 'number', minimum: 0, maximum: 100 },
      parser_reasoning: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1
      },
      message_signals: {
        type: 'object',
        additionalProperties: false,
        required: ['has_media', 'known_supplier', 'segment_count'],
        properties: {
          has_media: { type: 'boolean' },
          known_supplier: { type: 'boolean' },
          segment_count: { type: 'integer', minimum: 0 }
        }
      },
      candidates: {
        type: 'array',
        items: CANDIDATE_SCHEMA,
        minItems: 0
      }
    }
  }
};

export const parseTelegramSupplierMessage = async (
  message,
  {
    productDictionary = [],
    knownSupplier = false
  } = {}
) => {
  if (shouldUseOpenAiParser()) {
    try {
      return await parseWithOpenAi(message, { productDictionary, knownSupplier });
    } catch (error) {
      if (!env.telegramAiParserFallbackToHeuristic) {
        throw error;
      }

      return parseWithHeuristic(message, {
        productDictionary,
        knownSupplier,
        parserFallbackUsed: true,
        fallbackReason: error.message
      });
    }
  }

  return parseWithHeuristic(message, {
    productDictionary,
    knownSupplier,
    parserFallbackUsed: false,
    fallbackReason: shouldUseOpenAiParserReason()
  });
};

const parseWithOpenAi = async (message, { productDictionary, knownSupplier }) => {
  const rawText = message.rawText || message.text || '';
  const prompt = buildOpenAiPrompt(rawText, { productDictionary, knownSupplier, message });
  const payload = await callOpenAiResponsesApi(prompt);
  const parsed = normalizeOpenAiPayload(payload, { knownSupplier, message });

  return {
    ...parsed,
    parserFallbackUsed: false,
    parserReasoning: parsed.parserReasoning.length
      ? parsed.parserReasoning
      : ['OpenAI structured parser completed successfully.']
  };
};

const callOpenAiResponsesApi = async (prompt) => {
  const fetchFn = globalThis.fetch;

  if (typeof fetchFn !== 'function') {
    throw new Error('Global fetch is not available for OpenAI parser requests');
  }

  const response = await fetchFn(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.telegramAiParserModel,
      input: [
        {
          role: 'system',
          content:
            'Extract supplier product candidates from messy Telegram messages. Return only structured JSON that matches the schema. Never add markdown. Keep uncertainty flags when the message is ambiguous. Preserve source evidence in the segment field.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: OPENAI_SCHEMA.name,
          strict: true,
          schema: OPENAI_SCHEMA.schema
        }
      },
      temperature: 0
    })
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`OpenAI parser request failed (${response.status}): ${responseText}`);
  }

  const payload = responseText ? JSON.parse(responseText) : {};

  if (payload.status && payload.status !== 'completed') {
    throw new Error(`OpenAI parser finished with status ${payload.status}`);
  }

  return payload;
};

const normalizeOpenAiPayload = (payload, { knownSupplier, message }) => {
  const parsedText = extractOpenAiText(payload);

  if (!parsedText) {
    throw new Error('OpenAI parser response did not contain structured text output');
  }

  const raw = JSON.parse(parsedText);
  const candidates = Array.isArray(raw.candidates)
    ? raw.candidates.map((candidate, index) => normalizeAiCandidate(candidate, index))
    : [];

  return {
    parserSource: 'openai',
    parserProvider: raw.parser_provider || 'openai',
    parserModel: raw.parser_model || env.telegramAiParserModel,
    parserConfidence: clampScore(raw.parser_confidence),
    parserReasoning: Array.isArray(raw.parser_reasoning) && raw.parser_reasoning.length
      ? raw.parser_reasoning
      : ['OpenAI structured parser completed successfully.'],
    messageSignals: {
      hasMedia: Boolean(raw.message_signals?.has_media ?? message.media?.hasMedia),
      knownSupplier: Boolean(raw.message_signals?.known_supplier ?? knownSupplier),
      segmentCount: Number(raw.message_signals?.segment_count ?? candidates.length)
    },
    candidates
  };
};

const extractOpenAiText = (payload) => {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  for (const item of payload.output || []) {
    if (item.type === 'message' && Array.isArray(item.content)) {
      for (const contentItem of item.content) {
        if (contentItem.type === 'output_text' && typeof contentItem.text === 'string') {
          return contentItem.text.trim();
        }

        if (contentItem.type === 'refusal') {
          throw new Error(`OpenAI parser refusal: ${contentItem.refusal}`);
        }
      }
    }
  }

  return '';
};

const normalizeAiCandidate = (candidate, index) => ({
  segment: normalizeWhitespace(candidate.segment),
  index,
  productName: normalizeWhitespace(candidate.product_name),
  normalizedName: normalizeWhitespace(candidate.normalized_name) || toTitleCase(candidate.product_name),
  detectedPrice: Number(candidate.detected_price || 0),
  detectedPriceRange: normalizeNumberArray(candidate.detected_price_range),
  normalizedPrice: Number(candidate.normalized_price || 0),
  availability: candidate.availability,
  stockQuantity: candidate.stock_quantity === null || candidate.stock_quantity === undefined
    ? null
    : Number(candidate.stock_quantity),
  parserSource: 'openai',
  parserProvider: 'openai',
  parserModel: env.telegramAiParserModel,
  parserConfidence: clampScore(candidate.parser_confidence),
  signals: {
    productNameCertainty: candidate.signals.product_name_certainty,
    priceCertainty: candidate.signals.price_certainty,
    stockCertainty: candidate.signals.stock_certainty,
    allPrices: normalizeNumberArray(candidate.signals.all_prices),
    knownSupplier: Boolean(candidate.signals.known_supplier),
    hasMedia: Boolean(candidate.signals.has_media),
    structuredFormatting: Boolean(candidate.signals.structured_formatting),
    segmentCount: Number(candidate.signals.segment_count || 0)
  },
  extractionReasoning: Array.isArray(candidate.extraction_reasoning) && candidate.extraction_reasoning.length
    ? candidate.extraction_reasoning
    : ['OpenAI structured parser extracted this candidate.'],
  uncertaintyFlags: Array.isArray(candidate.uncertainty_flags) ? candidate.uncertainty_flags : []
});

const parseWithHeuristic = (
  message,
  {
    productDictionary = [],
    knownSupplier = false,
    parserFallbackUsed = false,
    fallbackReason = ''
  } = {}
) => {
  const rawText = message.rawText || message.text || '';
  const segments = splitMessageIntoSegments(rawText);
  const candidateSegments = buildCandidateSegments(segments);

  if (!candidateSegments.length) {
    return {
      candidates: [],
      parserSource: 'heuristic',
      parserProvider: 'local-rules',
      parserModel: HEURISTIC_MODEL_NAME,
      parserConfidence: 35,
      parserFallbackUsed,
      parserReasoning: [
        'No product, price, or stock signal was strong enough to create a candidate.',
        ...(fallbackReason ? [`OpenAI parser fallback reason: ${fallbackReason}`] : [])
      ],
      messageSignals: {
        hasMedia: Boolean(message.media?.hasMedia),
        knownSupplier,
        segmentCount: segments.length
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
      parserSource: 'heuristic',
      parserProvider: 'local-rules',
      parserModel: HEURISTIC_MODEL_NAME,
      parserConfidence: 45,
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
        ...stockSignals.reasoning,
        ...(fallbackReason ? [`OpenAI parser fallback reason: ${fallbackReason}`] : [])
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
    parserSource: 'heuristic',
    parserProvider: 'local-rules',
    parserModel: HEURISTIC_MODEL_NAME,
    parserConfidence: 45,
    parserFallbackUsed,
    parserReasoning: [
      `Evaluated ${segments.length || 1} message segment(s).`,
      `Created ${candidates.length} product candidate(s) from product-like signals.`,
      ...(fallbackReason ? [`OpenAI parser fallback reason: ${fallbackReason}`] : [])
    ],
    messageSignals: {
      hasMedia: Boolean(message.media?.hasMedia),
      knownSupplier,
      segmentCount: segments.length
    }
  };
};

const buildOpenAiPrompt = (rawText, { productDictionary, knownSupplier, message }) => {
  const dictionarySample = buildDictionarySample(productDictionary);
  const hasMedia = Boolean(message.media?.hasMedia);
  const segmentCount = splitMessageIntoSegments(rawText).length || 1;

  return [
    'Extract every product candidate from the Telegram supplier message below.',
    'Return only structured JSON that follows the schema exactly.',
    'Use the source message text as evidence, keep ambiguity visible, and do not invent missing facts.',
    `Known supplier: ${knownSupplier ? 'yes' : 'no'}.`,
    `Has media: ${hasMedia ? 'yes' : 'no'}.`,
    `Estimated segment count: ${segmentCount}.`,
    dictionarySample ? `Known product names: ${dictionarySample}.` : 'Known product names: none provided.',
    '',
    'Source message:',
    rawText || '(empty message)'
  ].join('\n');
};

const buildDictionarySample = (productDictionary) => {
  if (!Array.isArray(productDictionary) || !productDictionary.length) return '';

  return [...new Set(
    productDictionary
      .map((product) => normalizeWhitespace(product?.name || ''))
      .filter(Boolean)
  )]
    .slice(0, 100)
    .join(', ');
};

const shouldUseOpenAiParser = () =>
  env.telegramAiParserEnabled &&
  env.telegramAiParserProvider === 'openai' &&
  Boolean(env.openaiApiKey);

const shouldUseOpenAiParserReason = () => {
  if (!env.telegramAiParserEnabled) return 'TELEGRAM_AI_PARSER_ENABLED is disabled';
  if (env.telegramAiParserProvider !== 'openai') return `Unsupported parser provider: ${env.telegramAiParserProvider}`;
  if (!env.openaiApiKey) return 'OPENAI_API_KEY is missing';
  return '';
};

const normalizeNumberArray = (values = []) =>
  Array.isArray(values)
    ? values
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value >= 0)
    : [];

const clampScore = (value) => {
  const score = Number(value);

  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
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
