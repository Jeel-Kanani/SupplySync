import mongoose from 'mongoose';

const telegramChannelSchema = new mongoose.Schema(
  {
    channelId: {
      type: String,
      trim: true,
      default: '',
      index: true
    },
    username: {
      type: String,
      required: [true, 'Telegram channel username or invite reference is required'],
      trim: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      trim: true,
      default: ''
    },
    supplierName: {
      type: String,
      trim: true,
      default: ''
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastMessageId: {
      type: Number,
      default: 0,
      index: true
    },
    lastCheckedAt: {
      type: Date,
      default: null,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

telegramChannelSchema.index({ isActive: 1, updatedAt: -1 });

export const TelegramChannel = mongoose.model('TelegramChannel', telegramChannelSchema);
