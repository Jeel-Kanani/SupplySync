import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';

import { env } from '../../config/env.js';

let activeClient = null;
let activeSession = null;

export const connectTelegramClient = async ({
  apiId = env.telegramApiId,
  apiHash = env.telegramApiHash,
  sessionString = env.telegramSession,
  botToken = env.telegramBotToken
} = {}) => {
  if (!apiId || !apiHash) {
    throw new Error('Telegram API ID and API hash are required');
  }

  if (activeClient?.connected) {
    return {
      client: activeClient,
      sessionString: activeSession?.save?.() || sessionString || '',
      connected: true
    };
  }

  activeSession = new StringSession(sessionString || '');
  activeClient = new TelegramClient(activeSession, Number(apiId), apiHash, {
    connectionRetries: 5,
    autoReconnect: true
  });

  if (botToken) {
    await activeClient.start({ botAuthToken: botToken });
  } else {
    await activeClient.connect();
    const authorized = await activeClient.isUserAuthorized().catch(() => false);

    if (!authorized) {
      throw new Error('Telegram session is not authorized. Provide TELEGRAM_SESSION or TELEGRAM_BOT_TOKEN.');
    }
  }

  return {
    client: activeClient,
    sessionString: activeSession.save(),
    connected: true
  };
};

export const getTelegramClient = () => activeClient;

export const getTelegramClientStatus = () => ({
  connected: Boolean(activeClient?.connected),
  hasSession: Boolean(activeSession?.save?.()),
  sessionString: activeSession?.save?.() || ''
});

export const disconnectTelegramClient = async () => {
  if (!activeClient) return;

  await activeClient.disconnect().catch(() => {});
  activeClient = null;
  activeSession = null;
};
