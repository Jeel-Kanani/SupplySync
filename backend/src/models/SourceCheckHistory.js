import mongoose from 'mongoose';

import { AUTOMATION_LOG_STATUS, SOURCE_TYPES } from '../config/constants.js';

const sourceCheckHistorySchema = new mongoose.Schema(
  {
    sourceType: {
      type: String,
      required: [true, 'Source type is required'],
      enum: Object.values(SOURCE_TYPES),
      index: true
    },
    sourceUrl: {
      type: String,
      required: [true, 'Source URL is required'],
      trim: true,
      index: true
    },
    sourceName: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: Object.values(AUTOMATION_LOG_STATUS),
      default: AUTOMATION_LOG_STATUS.SUCCESS,
      index: true
    },
    extractedData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    errorMessage: {
      type: String,
      trim: true,
      default: ''
    },
    executionTime: {
      type: Number,
      min: [0, 'Execution time cannot be negative'],
      default: 0
    },
    checkedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    versionKey: false
  }
);

sourceCheckHistorySchema.index({ sourceType: 1, checkedAt: -1 });
sourceCheckHistorySchema.index({ sourceUrl: 1, checkedAt: -1 });

export const SourceCheckHistory = mongoose.model('SourceCheckHistory', sourceCheckHistorySchema);
