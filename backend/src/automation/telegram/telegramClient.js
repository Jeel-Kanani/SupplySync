import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';

import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

let activeClient = null;
let activeSession = null;

export const connectTelegramClient = async ({
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
      'Telegram credentials missing. Enter API ID, API hash, and either Session String or Bot Token.'
    );
  }

  if (!normalizedSessionString && !normalizedBotToken) {
    throw new ApiError(
      400,
      'Telegram authentication missing. Provide a Session String for user monitoring or a Bot Token for bot-accessible channels.'
    );
  }

  if (activeClient?.connected) {
    return {
      client: activeClient,
      sessionString: activeSession?.save?.() || normalizedSessionString || '',
      connected: true
    };
  }

  activeSession = new StringSession(normalizedSessionString);
  activeClient = new TelegramClient(activeSession, normalizedApiId, normalizedApiHash, {
    connectionRetries: 5,
    autoReconnect: true
  });

  if (normalizedBotToken) {
    await activeClient.start({ botAuthToken: normalizedBotToken });
  } else {
    await activeClient.connect();
    const authorized = await activeClient.isUserAuthorized().catch(() => false);

    if (!authorized) {
      throw new ApiError(
        401,
        'Telegram session is not authorized. Generate a valid GramJS session string or use a bot token for bot-accessible channels.'
      );
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
  hasSession: Boolean(activeSession?.save?.())
});

export const disconnectTelegramClient = async () => {
  if (!activeClient) return;

  await activeClient.disconnect().catch(() => {});
  activeClient = null;
  activeSession = null;
};
