import { Queue } from 'bullmq';
import IORedis from 'ioredis';

import { TELEGRAM_QUEUE_NAMES } from '../../config/constants.js';
import { env } from '../../config/env.js';

let connection = null;
let queues = null;
let redisErrorLogged = false;

export const getRedisConnection = () => {
  if (!connection) {
    connection = new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: () => null
    });

    connection.on('error', (error) => {
      if (!redisErrorLogged) {
        redisErrorLogged = true;
        console.error('Redis connection error:', error.message);
      }
    });
  }

  return connection;
};

export const getTelegramQueues = () => {
  if (!queues) {
    const redisConnection = getRedisConnection();

    queues = {
      messageQueue: new Queue(TELEGRAM_QUEUE_NAMES.MESSAGE, { connection: redisConnection }),
      extractionQueue: new Queue(TELEGRAM_QUEUE_NAMES.EXTRACTION, { connection: redisConnection }),
      reviewQueue: new Queue(TELEGRAM_QUEUE_NAMES.REVIEW, { connection: redisConnection })
    };
  }

  return queues;
};

export const enqueueTelegramMessage = async (payload) => {
  const { messageQueue } = getTelegramQueues();
  const jobId = buildMessageJobId(payload);

  return messageQueue.add('store-telegram-message', payload, {
    jobId,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 500,
    removeOnFail: 1000
  });
};

export const enqueueExtraction = async (payload) => {
  const { extractionQueue } = getTelegramQueues();

  return extractionQueue.add('extract-product-candidates', payload, {
    jobId: `extract:${payload.telegramMessageId}`,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 500,
    removeOnFail: 1000
  });
};

export const enqueueReview = async (payload) => {
  const { reviewQueue } = getTelegramQueues();

  return reviewQueue.add('create-review-task', payload, {
    jobId: `review:${payload.candidateId}`,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1500
    },
    removeOnComplete: 500,
    removeOnFail: 1000
  });
};

export const getQueueHealth = async () => {
  try {
    const redisConnection = getRedisConnection();
    await redisConnection.ping();
    const { messageQueue, extractionQueue, reviewQueue } = getTelegramQueues();
    const [messageCounts, extractionCounts, reviewCounts] = await Promise.all([
      messageQueue.getJobCounts(),
      extractionQueue.getJobCounts(),
      reviewQueue.getJobCounts()
    ]);

    return {
      redisConnected: true,
      queues: {
        messageQueue: messageCounts,
        extractionQueue: extractionCounts,
        reviewQueue: reviewCounts
      }
    };
  } catch (error) {
    return {
      redisConnected: false,
      error: error.message,
      queues: {}
    };
  }
};

export const closeTelegramQueues = async () => {
  if (queues) {
    await Promise.all(Object.values(queues).map((queue) => queue.close().catch(() => {})));
    queues = null;
  }

  if (connection) {
    await connection.quit().catch(() => {});
    connection = null;
  }
};

const buildMessageJobId = (payload) =>
  `message:${payload.channelId || payload.channelName || 'unknown'}:${payload.messageId || Date.now()}`;
