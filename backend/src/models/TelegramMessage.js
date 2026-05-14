import mongoose from 'mongoose';

import { TELEGRAM_EXTRACTION_STATUS } from '../config/constants.js';

const telegramMessageSchema = new mongoose.Schema(
  {
    messageId: {
      type: Number,
      required: [true, 'Telegram message ID is required'],
      index: true
    },
    channelId: {
      type: String,
      required: [true, 'Telegram channel ID is required'],
      trim: true,
      index: true
    },
    channelName: {
      type: String,
      trim: true,
      default: '',
      index: true
    },
    sender: {
      id: { type: String, trim: true, default: '' },
      username: { type: String, trim: true, default: '' },
      name: { type: String, trim: true, default: '' }
    },
    rawText: {
      type: String,
      trim: true,
      default: ''
    },
    media: {
      hasMedia: { type: Boolean, default: false },
      mediaType: { type: String, trim: true, default: '' },
      caption: { type: String, trim: true, default: '' },
      fileName: { type: String, trim: true, default: '' }
    },
    receivedAt: {
      type: Date,
      required: [true, 'Message received time is required'],
      index: true
    },
    processed: {
      type: Boolean,
      default: false,
      index: true
    },
    extractionStatus: {
      type: String,
      enum: Object.values(TELEGRAM_EXTRACTION_STATUS),
      default: TELEGRAM_EXTRACTION_STATUS.RAW,
      index: true
    },
    processingAttempts: {
      type: Number,
      min: 0,
      default: 0
    },
    messageFingerprint: {
      type: String,
      required: [true, 'Message fingerprint is required'],
      unique: true,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    processedAt: {
      type: Date,
      default: null
    },
    errorMessage: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

telegramMessageSchema.index({ channelId: 1, messageId: 1 }, { unique: true });
telegramMessageSchema.index({ channelName: 1, receivedAt: -1 });
telegramMessageSchema.index({ extractionStatus: 1, receivedAt: -1 });

export const TelegramMessage = mongoose.model('TelegramMessage', telegramMessageSchema);
