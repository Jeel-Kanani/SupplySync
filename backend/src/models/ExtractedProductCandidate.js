import mongoose from 'mongoose';

import { REVIEW_STATUS, SOURCE_TYPES } from '../config/constants.js';

const extractedProductCandidateSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      trim: true,
      default: '',
      index: true
    },
    normalizedName: {
      type: String,
      trim: true,
      default: '',
      index: true
    },
    detectedPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    detectedPriceRange: {
      type: [Number],
      default: []
    },
    normalizedPrice: {
      type: Number,
      min: 0,
      default: 0
    },
    availability: {
      type: Boolean,
      default: null
    },
    stockQuantity: {
      type: Number,
      min: 0,
      default: null
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      required: [true, 'Candidate confidence is required'],
      index: true
    },
    confidenceBand: {
      type: String,
      trim: true,
      default: '',
      index: true
    },
    sourceType: {
      type: String,
      enum: Object.values(SOURCE_TYPES),
      default: SOURCE_TYPES.TELEGRAM,
      index: true
    },
    sourceMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TelegramMessage',
      required: [true, 'Source Telegram message is required'],
      index: true
    },
    sourceChannel: {
      type: String,
      trim: true,
      required: [true, 'Source channel is required'],
      index: true
    },
    supplierName: {
      type: String,
      trim: true,
      default: '',
      index: true
    },
    extractionReasoning: {
      type: [String],
      default: []
    },
    uncertaintyFlags: {
      type: [String],
      default: [],
      index: true
    },
    requiresReview: {
      type: Boolean,
      default: true,
      index: true
    },
    reviewStatus: {
      type: String,
      enum: Object.values(REVIEW_STATUS),
      default: REVIEW_STATUS.NEEDS_REVIEW,
      index: true
    },
    candidateData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    extractedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    appliedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

extractedProductCandidateSchema.index({ sourceChannel: 1, extractedAt: -1 });
extractedProductCandidateSchema.index({ reviewStatus: 1, confidence: 1 });

export const ExtractedProductCandidate = mongoose.model(
  'ExtractedProductCandidate',
  extractedProductCandidateSchema
);
