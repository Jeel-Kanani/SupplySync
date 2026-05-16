import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';

import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

let client = null;
let session = null;

export const connectClawBotClient = async ({
  apiId = env.telegramApiId,
  apiHash = env.telegramApiHash,
  sessionString = env.telegramSession,
  botToken = env.telegramBotToken
} = {}) => {
  const normalizedApiId = Number(apiId);
  const normalizedApiHash = String(apiHash || '').trim();
  const normalizedSessionString = String(sessionString || '').trim();
  const normalizedBotToken = String(botToken || '').trim();

  if (!Number.isFinite(normalizedApiId) || !normalizedApiHash) {
    throw new ApiError(
      400,
      'OpenClaw Bot credentials missing. Enter API ID, API hash, and either Session String or Bot Token.'
    );
  }

  if (!normalizedSessionString && !normalizedBotToken) {
    throw new ApiError(
      400,
      'OpenClaw Bot authentication missing. Provide a Session String for user monitoring or a Bot Token for bot-accessible channels.'
    );
  }

  if (client?.connected) {
    return {
      client,
      connected: true,
      sessionString: session?.save?.() || normalizedSessionString || ''
    };
  }

  session = new StringSession(normalizedSessionString);
  client = new TelegramClient(session, normalizedApiId, normalizedApiHash, {
    connectionRetries: 8,
    autoReconnect: true,
    useWSS: true
  });

  if (normalizedBotToken) {
    await client.start({ botAuthToken: normalizedBotToken });
  } else {
    await client.connect();
    const authorized = await client.isUserAuthorized().catch(() => false);

    if (!authorized) {
      throw new ApiError(
        401,
        'Telegram user session is not authorized. Generate a valid GramJS session string or use a bot token for bot-accessible channels.'
      );
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
  hasSession: Boolean(session?.save?.())
});

export const disconnectClawBotClient = async () => {
  if (!client) return;

  await client.disconnect().catch(() => {});
  client = null;
  session = null;
};
