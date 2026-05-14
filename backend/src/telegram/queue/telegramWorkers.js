import { Worker } from 'bullmq';

import { TELEGRAM_QUEUE_NAMES } from '../../config/constants.js';
import { getRedisConnection } from './telegramQueues.js';
import {
  processExtractionForMessage,
  processRawMessagePayload,
  processReviewForCandidate
} from '../../services/telegramPipelineService.js';

const workers = [];

export const startTelegramIntelligenceWorkers = () => {
  if (workers.length) return workers;

  const connection = getRedisConnection();

  workers.push(
    new Worker(
      TELEGRAM_QUEUE_NAMES.MESSAGE,
      async (job) => processRawMessagePayload(job.data),
      { connection, concurrency: 5 }
    ),
    new Worker(
      TELEGRAM_QUEUE_NAMES.EXTRACTION,
      async (job) => processExtractionForMessage(job.data),
      { connection, concurrency: 3 }
    ),
    new Worker(
      TELEGRAM_QUEUE_NAMES.REVIEW,
      async (job) => processReviewForCandidate(job.data),
      { connection, concurrency: 3 }
    )
  );

  workers.forEach((worker) => {
    worker.on('failed', (job, error) => {
      console.error(`Telegram intelligence worker failed ${job?.name || 'job'}:`, error.message);
    });
  });

  return workers;
};

export const stopTelegramIntelligenceWorkers = async () => {
  await Promise.all(workers.map((worker) => worker.close().catch(() => {})));
  workers.length = 0;
};
