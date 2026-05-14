import app from './src/app.js';
import { startAutomationSchedulers, stopAutomationSchedulers } from './src/automation/schedulers/automationScheduler.js';
import { connectDB } from './src/config/db.js';
import { env } from './src/config/env.js';
import { startTelegramIntelligenceRuntime } from './src/services/telegramIntelligenceService.js';
import { stopTelegramIntelligenceWorkers } from './src/telegram/queue/telegramWorkers.js';
import { closeTelegramQueues } from './src/telegram/queue/telegramQueues.js';

let server;

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
  console.error('Unhandled rejection:', reason);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully.');
  stopAutomationSchedulers();
  stopTelegramIntelligenceWorkers().finally(() => closeTelegramQueues());
  if (server) {
    server.close(() => process.exit(0));
  }
});

startServer();
