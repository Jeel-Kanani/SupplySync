const STORAGE_KEY = 'supplysync.telegram.credentials';

export const loadTelegramCredentials = () => {
  if (typeof window === 'undefined') return emptyTelegramCredentials();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return emptyTelegramCredentials();

    const parsed = JSON.parse(raw);

    return {
      apiId: String(parsed.apiId || ''),
      apiHash: String(parsed.apiHash || ''),
      sessionString: String(parsed.sessionString || ''),
      botToken: String(parsed.botToken || '')
    };
  } catch {
    return emptyTelegramCredentials();
  }
};

export const saveTelegramCredentials = (credentials) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeTelegramCredentials(credentials)));
  } catch {
    // Ignore storage failures (private mode, quota limits, etc.).
  }
};

export const clearTelegramCredentials = () => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
};

export const normalizeTelegramCredentials = (credentials = {}) => ({
  apiId: String(credentials.apiId || '').trim(),
  apiHash: String(credentials.apiHash || '').trim(),
  sessionString: String(credentials.sessionString || '').trim(),
  botToken: String(credentials.botToken || '').trim()
});

export const emptyTelegramCredentials = () => ({
  apiId: '',
  apiHash: '',
  sessionString: '',
  botToken: ''
});