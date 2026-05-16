import app from './src/app.js';
import { startAutomationSchedulers, stopAutomationSchedulers } from './src/automation/schedulers/automationScheduler.js';
import { connectDB } from './src/config/db.js';
import { env } from './src/config/env.js';
import { startTelegramIntelligenceRuntime } from './src/services/telegramIntelligenceService.js';
import { stopTelegramIntelligenceWorkers } from './src/telegram/queue/telegramWorkers.js';
import { closeTelegramQueues } from './src/telegram/queue/telegramQueues.js';

let server;
let shuttingDown = false;

const shutdown = async (signal, restart = false) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  stopAutomationSchedulers();
  await stopTelegramIntelligenceWorkers().catch(() => {});
  await closeTelegramQueues().catch(() => {});

  if (server) {
    await new Promise((resolve) => server.close(resolve));
    server = null;
  }

  if (restart) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(0);
};

const startServer = async () => {
  try {
    await connectDB();
    await startAutomationSchedulers();
    startTelegramIntelligenceRuntime().catch((error) => {
      console.error('Telegram intelligence runtime did not start:', error.message);
    });

    server = app.listen(env.port, () => {
      console.log(`SupplySync API running on port ${env.port} in ${env.nodeEnv} mode`);
    });
  } catch (error) {
    console.error('Failed to start SupplySync API:', error.message);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  // Treat Redis connection rejections as non-fatal during startup
  try {
    const msg = typeof reason === 'string' ? reason : reason?.message || '';
    if (msg.includes('ECONNREFUSED') && msg.includes('127.0.0.1:6379')) {
      console.warn('Ignored Redis connection rejection during startup:', msg);
      return;
    }
  } catch (e) {
    // ignore
  }

  console.error('Unhandled rejection:', reason);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  // Ignore ioredis connection errors so missing Redis doesn't crash the service
  try {
    const msg = error?.message || '';
    const stack = error?.stack || '';
    if (msg.includes('ECONNREFUSED') && stack.includes('ioredis')) {
      console.warn('Ignored ioredis connection error:', msg);
      return;
    }
  } catch (e) {
    // fallthrough
  }

  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully.');
  shutdown('SIGTERM');
});

process.once('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully.');
  shutdown('SIGINT');
});

process.once('SIGUSR2', () => {
  console.log('SIGUSR2 received. Restarting gracefully.');
  shutdown('SIGUSR2', true);
});

startServer();
