export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const withRetry = async (
  operation,
  {
    retries = 2,
    delayMs = 1000,
    backoff = 1.7,
    onRetry = null,
    shouldRetry = () => true
  } = {}
) => {
  let attempt = 0;
  let currentDelay = delayMs;

  while (attempt <= retries) {
    try {
      return await operation({ attempt });
    } catch (error) {
      const isLastAttempt = attempt >= retries;

      if (isLastAttempt || !shouldRetry(error)) {
        throw error;
      }

      if (typeof onRetry === 'function') {
        await onRetry(error, attempt + 1);
      }

      await sleep(currentDelay);
      currentDelay = Math.round(currentDelay * backoff);
      attempt += 1;
    }
  }

  return null;
};
