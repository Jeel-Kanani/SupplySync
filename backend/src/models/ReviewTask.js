import mongoose from 'mongoose';

import {
  REVIEW_ASSIGNED_STATUS,
  REVIEW_PRIORITIES,
  REVIEW_TASK_TYPES
} from '../config/constants.js';

const reviewTaskSchema = new mongoose.Schema(
  {
    taskType: {
      type: String,
      enum: Object.values(REVIEW_TASK_TYPES),
      required: [true, 'Review task type is required'],
      index: true
    },
    priority: {
      type: String,
      enum: Object.values(REVIEW_PRIORITIES),
      default: REVIEW_PRIORITIES.MEDIUM,
      index: true
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExtractedProductCandidate',
      default: null,
      index: true
    },
    sourceMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TelegramMessage',
      default: null,
      index: true
    },
    extractedData: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Review extracted data is required']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      index: true
    },
    assignedStatus: {
      type: String,
      enum: Object.values(REVIEW_ASSIGNED_STATUS),
      default: REVIEW_ASSIGNED_STATUS.OPEN,
      index: true
    },
    reviewedBy: {
      type: String,
      trim: true,
      default: ''
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Review notes cannot exceed 2000 characters'],
      default: ''
    },
    resolution: {
      type: String,
      trim: true,
      default: ''
    },
    resolvedAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

reviewTaskSchema.index({ assignedStatus: 1, priority: 1, createdAt: -1 });
reviewTaskSchema.index({ confidence: 1, createdAt: -1 });

export const ReviewTask = mongoose.model('ReviewTask', reviewTaskSchema);
