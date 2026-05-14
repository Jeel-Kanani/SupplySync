import mongoose from 'mongoose';

import { PRODUCT_STATUS } from '../config/constants.js';

const productSupplierSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier reference is required']
    },
    buyPrice: {
      type: Number,
      required: [true, 'Supplier buy price is required'],
      min: [0, 'Supplier buy price cannot be negative'],
      default: 0
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true
    },
    stockQuantity: {
      type: Number,
      min: [0, 'Stock quantity cannot be negative'],
      default: 0
    },
    deliveryDays: {
      type: Number,
      min: [0, 'Delivery days cannot be negative'],
      default: 7
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Supplier notes cannot exceed 500 characters'],
      default: ''
    },
    lastCheckedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [160, 'Product name cannot exceed 160 characters']
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: ''
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator(images) {
          return images.every((image) => /^https?:\/\/.+/i.test(image));
        },
        message: 'Images must contain valid HTTP or HTTPS URLs'
      }
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative']
    },
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.ACTIVE,
      index: true
    },
    suppliers: {
      type: [productSupplierSchema],
      default: []
    },
    listings: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Listing'
        }
      ],
      default: []
    },
    activeSupplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
      index: true
    },
    profitMargin: {
      type: Number,
      default: 0
    },
    lastCalculatedAt: {
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

productSchema.index({ name: 'text', category: 'text' });
productSchema.index({ status: 1, category: 1 });
productSchema.index({ 'suppliers.supplier': 1 });

export const Product = mongoose.model('Product', productSchema);
