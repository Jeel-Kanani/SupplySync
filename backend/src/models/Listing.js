import mongoose from 'mongoose';

import { LISTING_HEALTH, LISTING_STATUS, MARKETPLACE_PLATFORM } from '../config/constants.js';

const listingSchema = new mongoose.Schema(
  {
    listingId: {
      type: String,
      required: [true, 'Listing ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true
    },
    linkedProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Linked product is required'],
      index: true
    },
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      enum: Object.values(MARKETPLACE_PLATFORM),
      index: true
    },
    listingUrl: {
      type: String,
      required: [true, 'Listing URL is required'],
      trim: true,
      validate: {
        validator(value) {
          return /^https?:\/\/.+/i.test(value);
        },
        message: 'Listing URL must be a valid HTTP or HTTPS URL'
      }
    },
    listingPrice: {
      type: Number,
      required: [true, 'Listing price is required'],
      min: [0, 'Listing price cannot be negative']
    },
    marketplaceFees: {
      type: Number,
      min: [0, 'Marketplace fees cannot be negative'],
      default: 0
    },
    estimatedProfit: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: Object.values(LISTING_STATUS),
      default: LISTING_STATUS.ACTIVE,
      index: true
    },
    health: {
      type: String,
      enum: Object.values(LISTING_HEALTH),
      default: LISTING_HEALTH.HEALTHY,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

listingSchema.pre('validate', function setLinkedProduct(next) {
  if (!this.linkedProduct && this.productId) {
    this.linkedProduct = this.productId;
  }

  if (!this.productId && this.linkedProduct) {
    this.productId = this.linkedProduct;
  }

  next();
});

listingSchema.index({ productId: 1, platform: 1 });
listingSchema.index({ linkedProduct: 1, platform: 1 });
listingSchema.index({ platform: 1, status: 1 });
listingSchema.index({ health: 1, status: 1 });

export const Listing = mongoose.model('Listing', listingSchema);
