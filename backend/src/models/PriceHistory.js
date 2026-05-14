import mongoose from 'mongoose';

import { SOURCE_TYPES } from '../config/constants.js';

const priceHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
      index: true
    },
    oldPrice: {
      type: Number,
      required: [true, 'Old price is required'],
      min: [0, 'Old price cannot be negative']
    },
    newPrice: {
      type: Number,
      required: [true, 'New price is required'],
      min: [0, 'New price cannot be negative']
    },
    sourceType: {
      type: String,
      required: [true, 'Source type is required'],
      enum: Object.values(SOURCE_TYPES),
      index: true
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: ''
    },
    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    changedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    versionKey: false
  }
);

priceHistorySchema.index({ product: 1, changedAt: -1 });
priceHistorySchema.index({ sourceType: 1, changedAt: -1 });

export const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);
