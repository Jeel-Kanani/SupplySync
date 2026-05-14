import cron from 'node-cron';

import { env } from '../../config/env.js';
import {
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_LOG_STATUS,
  SOURCE_TYPES
} from '../../config/constants.js';
import { createAutomationLog } from '../logs/automationLogger.js';
import { monitorWebsites } from '../../services/websiteMonitoringService.js';
import { startTelegramMonitoring } from '../../services/telegramMonitoringService.js';

const scheduledJobs = [];

export const startAutomationSchedulers = async () => {
  if (!env.automationSchedulerEnabled) {
    await createAutomationLog({
      actionType: AUTOMATION_ACTION_TYPES.SCHEDULER,
      sourceType: SOURCE_TYPES.WEBSITE,
      status: AUTOMATION_LOG_STATUS.SKIPPED,
      message: 'Automation scheduler disabled by environment'
    });
    return scheduledJobs;
  }

  const websiteJob = cron.schedule('0 */6 * * *', async () => {
    try {
      await monitorWebsites();
    } catch (error) {
      await createAutomationLog({
        actionType: AUTOMATION_ACTION_TYPES.SCHEDULER,
        sourceType: SOURCE_TYPES.WEBSITE,
        status: AUTOMATION_LOG_STATUS.FAILED,
        message: `Scheduled website monitoring failed: ${error.message}`
      });
    }
  });

  scheduledJobs.push(websiteJob);

  startTelegramMonitoring().catch((error) => {
    createAutomationLog({
      actionType: AUTOMATION_ACTION_TYPES.TELEGRAM_LISTEN,
      sourceType: SOURCE_TYPES.TELEGRAM,
      status: AUTOMATION_LOG_STATUS.FAILED,
      message: `Telegram listener did not start: ${error.message}`
    });
  });

  await createAutomationLog({
    actionType: AUTOMATION_ACTION_TYPES.SCHEDULER,
    sourceType: SOURCE_TYPES.WEBSITE,
    status: AUTOMATION_LOG_STATUS.SUCCESS,
    message: 'Website monitoring scheduled every 6 hours'
  });

  return scheduledJobs;
};

export const stopAutomationSchedulers = () => {
  scheduledJobs.forEach((job) => job.stop());
  scheduledJobs.length = 0;
};
