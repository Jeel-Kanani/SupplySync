import { Router } from 'express';

import {
  addTelegramChannel,
  connectTelegram,
  getLatestTelegramExtractions,
  getTelegramChannels
} from '../controllers/telegramController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  validateAddTelegramChannel,
  validateTelegramConnect
} from '../validators/automationValidator.js';

const router = Router();

router.post('/connect', validateRequest(validateTelegramConnect), connectTelegram);
router.post('/add-channel', validateRequest(validateAddTelegramChannel), addTelegramChannel);
router.get('/channels', getTelegramChannels);
router.get('/extractions', getLatestTelegramExtractions);

export default router;
