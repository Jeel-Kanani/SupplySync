import { Router } from 'express';

import {
  getAutomationDashboard,
  getAutomationHistory,
  getAutomationLogs,
  runTelegram,
  runWebsites
} from '../controllers/automationController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  validateRunTelegram,
  validateRunWebsites
} from '../validators/automationValidator.js';

const router = Router();

router.get('/dashboard', getAutomationDashboard);
router.post('/run-websites', validateRequest(validateRunWebsites), runWebsites);
router.post('/run-telegram', validateRequest(validateRunTelegram), runTelegram);
router.get('/logs', getAutomationLogs);
router.get('/history', getAutomationHistory);

export default router;
