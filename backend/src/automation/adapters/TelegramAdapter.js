import { SOURCE_TYPES } from '../../config/constants.js';
import { normalizeTelegramData } from '../../services/dataNormalizationService.js';
import { parseTelegramMessage } from '../telegram/telegramMessageParser.js';
import { BaseAdapter } from './BaseAdapter.js';

export class TelegramAdapter extends BaseAdapter {
  constructor(source = {}) {
    super({
      ...source,
      sourceType: SOURCE_TYPES.TELEGRAM
    });
  }

  async execute(messagePayload = null) {
    const payload = messagePayload || this.source.messagePayload;

    if (!payload) {
      throw new Error('Telegram adapter requires a message payload');
    }

    const parsedMessage = parseTelegramMessage(payload.text || payload.message || '');
    const rawData = {
      ...payload,
      ...parsedMessage,
      detectedAt: payload.detectedAt || new Date()
    };
    const normalizedProduct = normalizeTelegramData(rawData, {
      ...this.source,
      sourceType: SOURCE_TYPES.TELEGRAM
    });

    return this.validateNormalizedData(normalizedProduct);
  }
}
