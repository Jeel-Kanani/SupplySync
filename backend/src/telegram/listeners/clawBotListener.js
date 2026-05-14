import { NewMessage } from 'telegram/events/index.js';

import { TelegramChannel } from '../../models/TelegramChannel.js';
import { connectClawBotClient, getClawBotClient } from '../client/gramClient.js';
import { enqueueTelegramMessage } from '../queue/telegramQueues.js';
import { processRawMessagePayload } from '../../services/telegramPipelineService.js';
import { normalizeTelegramUsername } from '../../automation/utils/sourceUtils.js';

let activeHandler = null;
let active = false;

export const startClawBotListener = async () => {
  const channels = await TelegramChannel.find({ isActive: true }).sort({ updatedAt: -1 });

  if (!channels.length) {
    return {
      active: false,
      message: 'No active Telegram channels configured'
    };
  }

  const { client } = await connectClawBotClient();

  if (activeHandler) {
    client.removeEventHandler(activeHandler);
    activeHandler = null;
  }

  const chatReferences = channels.map((channel) => normalizeTelegramUsername(channel.username));

  activeHandler = async (event) => {
    const payload = buildRawMessagePayload(event.message, channels);

    if (!payload.rawText && !payload.media.hasMedia) return;

    try {
      await enqueueTelegramMessage(payload);
    } catch {
      await processRawMessagePayload(payload);
    }
  };

  client.addEventHandler(activeHandler, new NewMessage({ chats: chatReferences }));
  active = true;

  return {
    active: true,
    channels: chatReferences
  };
};

export const stopClawBotListener = () => {
  const client = getClawBotClient();

  if (client && activeHandler) {
    client.removeEventHandler(activeHandler);
  }

  active = false;
  activeHandler = null;
};

export const getClawBotListenerStatus = () => ({
  active
});

const buildRawMessagePayload = (message, configuredChannels) => {
  const chatId = message?.chatId?.toString?.() || message?.peerId?.channelId?.toString?.() || '';
  const chatUsername = normalizeTelegramUsername(message?.chat?.username || '');
  const configuredChannel =
    configuredChannels.find((channel) =>
      [channel.channelId, channel.username, channel.title]
        .filter(Boolean)
        .map((value) => normalizeTelegramUsername(value))
        .includes(chatUsername || chatId)
    ) || configuredChannels[0];

  const rawText = message?.message || '';

  return {
    messageId: Number(message?.id || 0),
    channelId: configuredChannel?.channelId || chatId || configuredChannel?._id?.toString() || 'unknown',
    channelName: configuredChannel?.username || message?.chat?.username || configuredChannel?.title || chatId,
    sender: {
      id: message?.senderId?.toString?.() || '',
      username: message?.sender?.username || '',
      name: [message?.sender?.firstName, message?.sender?.lastName].filter(Boolean).join(' ')
    },
    rawText,
    media: {
      hasMedia: Boolean(message?.media),
      mediaType: message?.media?.className || '',
      caption: rawText,
      fileName: message?.media?.document?.attributes?.find?.((item) => item.fileName)?.fileName || ''
    },
    receivedAt: new Date(message?.date ? Number(message.date) * 1000 : Date.now()),
    metadata: {
      groupedId: message?.groupedId?.toString?.() || '',
      post: Boolean(message?.post),
      out: Boolean(message?.out)
    }
  };
};
