import { AutomationLog } from '../../models/AutomationLog.js';
import { AUTOMATION_LOG_STATUS } from '../../config/constants.js';

export const createAutomationLog = async ({
  actionType,
  sourceType,
  status = AUTOMATION_LOG_STATUS.SUCCESS,
  message,
  executionTime = 0,
  metadata = {}
}) => {
  try {
    return await AutomationLog.create({
      actionType,
      sourceType,
      status,
      message,
      executionTime,
      metadata
    });
  } catch (error) {
    console.error('Failed to persist automation log:', error.message);
    return null;
  }
};

export const timeOperation = async (operation) => {
  const startedAt = Date.now();

  try {
    const data = await operation();
    return {
      data,
      executionTime: Date.now() - startedAt
    };
  } catch (error) {
    error.executionTime = Date.now() - startedAt;
    throw error;
  }
};
