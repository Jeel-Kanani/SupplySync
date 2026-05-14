import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';

import { env } from '../../config/env.js';

let client = null;
let session = null;

export const connectClawBotClient = async ({
  apiId = env.telegramApiId,
  apiHash = env.telegramApiHash,
  sessionString = env.telegramSession,
  botToken = env.telegramBotToken
} = {}) => {
  if (!apiId || !apiHash) {
    throw new Error('TELEGRAM_API_ID and TELEGRAM_API_HASH are required for GramJS monitoring');
  }

  if (client?.connected) {
    return {
      client,
      connected: true,
      sessionString: session?.save?.() || sessionString || ''
    };
  }

  session = new StringSession(sessionString || '');
  client = new TelegramClient(session, Number(apiId), apiHash, {
    connectionRetries: 8,
    autoReconnect: true,
    useWSS: true
  });

  if (botToken) {
    await client.start({ botAuthToken: botToken });
  } else {
    await client.connect();
    const authorized = await client.isUserAuthorized().catch(() => false);

    if (!authorized) {
      throw new Error('Telegram user session is not authorized. Provide TELEGRAM_SESSION or TELEGRAM_BOT_TOKEN.');
    }
  }

  return {
    client,
    connected: true,
    sessionString: session.save()
  };
};

export const getClawBotClient = () => client;

export const getClawBotClientStatus = () => ({
  connected: Boolean(client?.connected),
  hasSession: Boolean(session?.save?.()),
  sessionString: session?.save?.() || ''
});

export const disconnectClawBotClient = async () => {
  if (!client) return;

  await client.disconnect().catch(() => {});
  client = null;
  session = null;
};
