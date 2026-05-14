import { AUTOMATION_ACTION_TYPES, AUTOMATION_LOG_STATUS, SOURCE_TYPES } from '../config/constants.js';
import { TelegramChannel } from '../models/TelegramChannel.js';
import { SourceCheckHistory } from '../models/SourceCheckHistory.js';
import { TelegramAdapter } from '../automation/adapters/TelegramAdapter.js';
import {
  connectTelegramClient,
  getTelegramClientStatus
} from '../automation/telegram/telegramClient.js';
import {
  getTelegramListenerStatus,
  startTelegramListener
} from '../automation/telegram/telegramListener.js';
import { createAutomationLog, timeOperation } from '../automation/logs/automationLogger.js';
import {
  buildTelegramSourceUrl,
  normalizeTelegramUsername
} from '../automation/utils/sourceUtils.js';
import { applyNormalizedProductUpdate } from './automationDataService.js';

export const connectTelegram = async (credentials = {}) => {
  const { data, executionTime } = await timeOperation(async () => connectTelegramClient(credentials));

  await createAutomationLog({
    actionType: AUTOMATION_ACTION_TYPES.TELEGRAM_CONNECT,
    sourceType: SOURCE_TYPES.TELEGRAM,
    status: AUTOMATION_LOG_STATUS.SUCCESS,
    message: 'Telegram client connected',
    executionTime,
    metadata: {
      connected: data.connected,
      hasSession: Boolean(data.sessionString)
    }
  });

  return {
    connected: data.connected,
    sessionString: data.sessionString
  };
};

export const addTelegramChannel = async (payload) => {
  const username = normalizeTelegramUsername(payload.username || payload.channel || payload.sourceUrl);
  const sourceUrl = payload.sourceUrl || buildTelegramSourceUrl(username);

  const channel = await TelegramChannel.findOneAndUpdate(
    { username },
    {
      $set: {
        username,
        channelId: payload.channelId || '',
        title: payload.title || payload.name || username,
        supplierName: payload.supplierName || payload.title || payload.name || username,
        sourceUrl,
        isActive: payload.isActive !== false,
        metadata: payload.metadata || {}
      }
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );

  await createAutomationLog({
    actionType: AUTOMATION_ACTION_TYPES.TELEGRAM_LISTEN,
    sourceType: SOURCE_TYPES.TELEGRAM,
    status: AUTOMATION_LOG_STATUS.SUCCESS,
    message: `Telegram channel configured: ${username}`,
    metadata: { channelId: channel._id }
  });

  return channel;
};

export const getTelegramChannels = async () =>
  TelegramChannel.find().sort({ isActive: -1, updatedAt: -1 });

export const startTelegramMonitoring = async () => {
  const channels = await TelegramChannel.find({ isActive: true }).sort({ updatedAt: -1 });

  const listenerStatus = await startTelegramListener({
    channels,
    onMessage: async (messagePayload) => {
      try {
        await processTelegramMessage(messagePayload);
      } catch (error) {
        await createAutomationLog({
          actionType: AUTOMATION_ACTION_TYPES.TELEGRAM_MESSAGE,
          sourceType: SOURCE_TYPES.TELEGRAM,
          status: AUTOMATION_LOG_STATUS.FAILED,
          message: `Telegram message processing failed: ${error.message}`,
          metadata: {
            channel: messagePayload.channel?.username,
            messageId: messagePayload.messageId
          }
        });
      }
    }
  });

  await createAutomationLog({
    actionType: AUTOMATION_ACTION_TYPES.TELEGRAM_LISTEN,
    sourceType: SOURCE_TYPES.TELEGRAM,
    status: listenerStatus.active ? AUTOMATION_LOG_STATUS.SUCCESS : AUTOMATION_LOG_STATUS.SKIPPED,
    message: listenerStatus.active
      ? `Telegram listener started for ${listenerStatus.channels.length} channel(s)`
      : listenerStatus.message
  });

  return {
    ...listenerStatus,
    client: getTelegramClientStatus(),
    listener: getTelegramListenerStatus()
  };
};

export const processTelegramMessage = async (messagePayload) => {
  const channel = await resolveMessageChannel(messagePayload);

  if (
    channel &&
    messagePayload.messageId &&
    channel.lastMessageId &&
    Number(messagePayload.messageId) <= Number(channel.lastMessageId)
  ) {
    return {
      skipped: true,
      reason: 'Message was already processed',
      channel
    };
  }

  const adapter = new TelegramAdapter({
    supplierName: channel?.supplierName || messagePayload.supplierName || '',
    title: channel?.title || '',
    sourceUrl:
      channel?.sourceUrl ||
      messagePayload.sourceUrl ||
      buildTelegramSourceUrl(channel?.username || messagePayload.username || '')
  });

  const { data, executionTime } = await timeOperation(async () => {
    const normalizedProduct = await adapter.execute({
      text: messagePayload.text || messagePayload.message,
      messageId: messagePayload.messageId || 0,
      detectedAt: messagePayload.detectedAt || new Date(),
      sourceUrl: adapter.source.sourceUrl,
      rawMessage: messagePayload.rawMessage || {}
    });
    const updateResult = await applyNormalizedProductUpdate(normalizedProduct);

    return {
      normalizedProduct,
      updateResult
    };
  });

  if (channel) {
    channel.lastMessageId = Math.max(Number(channel.lastMessageId || 0), Number(messagePayload.messageId || 0));
    channel.lastCheckedAt = new Date();
    await channel.save();
  }

  await createAutomationLog({
    actionType: AUTOMATION_ACTION_TYPES.TELEGRAM_MESSAGE,
    sourceType: SOURCE_TYPES.TELEGRAM,
    status: AUTOMATION_LOG_STATUS.SUCCESS,
    message: `Telegram message extracted ${data.normalizedProduct.productName}`,
    executionTime,
    metadata: {
      channel: channel?.username,
      messageId: messagePayload.messageId,
      matched: data.updateResult.matched,
      priceChanged: data.updateResult.priceChanged
    }
  });

  return {
    channel,
    executionTime,
    ...data
  };
};

export const getLatestTelegramExtractions = async (limit = 20) =>
  SourceCheckHistory.find({ sourceType: SOURCE_TYPES.TELEGRAM })
    .sort({ checkedAt: -1 })
    .limit(limit);

const resolveMessageChannel = async (messagePayload) => {
  if (messagePayload.channel?._id) {
    return TelegramChannel.findById(messagePayload.channel._id);
  }

  const username = normalizeTelegramUsername(
    messagePayload.username ||
      messagePayload.channel?.username ||
      messagePayload.sourceUrl ||
      ''
  );

  if (!username) return null;

  return TelegramChannel.findOne({ username });
};
