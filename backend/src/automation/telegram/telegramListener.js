import { NewMessage } from 'telegram/events/index.js';

import { connectTelegramClient } from './telegramClient.js';
import { buildTelegramSourceUrl, normalizeTelegramUsername } from '../utils/sourceUtils.js';

let listenerActive = false;
let registeredHandler = null;

export const startTelegramListener = async ({ channels = [], onMessage }) => {
  if (!channels.length) {
    return {
      active: false,
      message: 'No active Telegram channels configured'
    };
  }

  const { client } = await connectTelegramClient();

  if (registeredHandler) {
    client.removeEventHandler(registeredHandler);
    registeredHandler = null;
  }

  const channelMap = new Map(
    channels.map((channel) => [normalizeTelegramUsername(channel.username), channel])
  );
  const chats = Array.from(channelMap.keys());

  registeredHandler = async (event) => {
    const message = event.message;
    const text = message?.message || '';
    if (!text.trim()) return;

    const chatUsername = normalizeTelegramUsername(
      message?.chat?.username ||
        message?.peerId?.channelId?.toString?.() ||
        message?.chatId?.toString?.() ||
        ''
    );
    const configuredChannel =
      channelMap.get(chatUsername) ||
      channels.find((channel) => String(message?.chatId || '').includes(String(channel.channelId || ''))) ||
      channels[0];

    await onMessage({
      messageId: Number(message.id || 0),
      channel: configuredChannel,
      text,
      detectedAt: new Date(message.date ? Number(message.date) * 1000 : Date.now()),
      sourceUrl: configuredChannel.sourceUrl || buildTelegramSourceUrl(configuredChannel.username),
      rawMessage: {
        id: message.id,
        chatId: message.chatId?.toString?.() || '',
        peerId: message.peerId?.toString?.() || ''
      }
    });
  };

  client.addEventHandler(registeredHandler, new NewMessage({ chats }));
  listenerActive = true;

  return {
    active: true,
    channels: chats
  };
};

export const stopTelegramListener = async () => {
  const { getTelegramClient } = await import('./telegramClient.js');
  const client = getTelegramClient();

  if (client && registeredHandler) {
    client.removeEventHandler(registeredHandler);
  }

  listenerActive = false;
  registeredHandler = null;
};

export const getTelegramListenerStatus = () => ({
  active: listenerActive
});
