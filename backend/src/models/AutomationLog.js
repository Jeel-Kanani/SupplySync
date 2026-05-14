import mongoose from 'mongoose';

import {
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_LOG_STATUS,
  SOURCE_TYPES
} from '../config/constants.js';

const automationLogSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      required: [true, 'Action type is required'],
      enum: Object.values(AUTOMATION_ACTION_TYPES),
      index: true
    },
    sourceType: {
      type: String,
      required: [true, 'Source type is required'],
      enum: Object.values(SOURCE_TYPES),
      index: true
    },
    status: {
      type: String,
      required: [true, 'Automation status is required'],
      enum: Object.values(AUTOMATION_LOG_STATUS),
      index: true
    },
    message: {
      type: String,
      required: [true, 'Log message is required'],
      trim: true,
      maxlength: [1000, 'Log message cannot exceed 1000 characters']
    },
    executionTime: {
      type: Number,
      min: [0, 'Execution time cannot be negative'],
      default: 0
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    versionKey: false
  }
);

automationLogSchema.index({ sourceType: 1, createdAt: -1 });
automationLogSchema.index({ status: 1, createdAt: -1 });

export const AutomationLog = mongoose.model('AutomationLog', automationLogSchema);
