import mongoose from 'mongoose';

const contactInfoSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Contact email must be valid']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [30, 'Phone number cannot exceed 30 characters']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters']
    }
  },
  {
    _id: false
  }
);

const supplierSchema = new mongoose.Schema(
  {
    supplierId: {
      type: String,
      required: [true, 'Supplier ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
      minlength: [2, 'Supplier name must be at least 2 characters'],
      maxlength: [160, 'Supplier name cannot exceed 160 characters']
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator(value) {
          return !value || /^https?:\/\/.+/i.test(value);
        },
        message: 'Supplier website must be a valid HTTP or HTTPS URL'
      }
    },
    contactInfo: {
      type: contactInfoSchema,
      default: {}
    },
    reliabilityScore: {
      type: Number,
      min: [0, 'Reliability score cannot be less than 0'],
      max: [100, 'Reliability score cannot exceed 100'],
      default: 50,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    averageDeliveryDays: {
      type: Number,
      min: [0, 'Average delivery days cannot be negative'],
      default: 7
    },
    suppliedProducts: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        }
      ],
      default: []
    },
    productsSupplied: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        }
      ],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        if ((!ret.suppliedProducts || ret.suppliedProducts.length === 0) && ret.productsSupplied?.length) {
          ret.suppliedProducts = ret.productsSupplied;
        }

        return ret;
      }
    }
  }
);

supplierSchema.index({ name: 'text', website: 'text' });
supplierSchema.index({ reliabilityScore: -1 });
supplierSchema.index({ suppliedProducts: 1 });

export const Supplier = mongoose.model('Supplier', supplierSchema);
