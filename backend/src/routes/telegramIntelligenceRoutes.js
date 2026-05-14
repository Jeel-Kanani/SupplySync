import { Router } from 'express';

import {
  approveCandidate,
  connectTelegram,
  getCandidates,
  getDashboard,
  getFeed,
  getLowConfidenceAlerts,
  getReviewTasks,
  getSupplierActivity,
  ingestMessage,
  processMessageNow,
  rejectCandidate,
  startRuntime
} from '../controllers/telegramIntelligenceController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  validateClawBotConnect,
  validateReviewResolution,
  validateTelegramMessageIngest
} from '../validators/telegramIntelligenceValidator.js';

const router = Router();

router.post('/runtime/start', startRuntime);
router.post('/connect', validateRequest(validateClawBotConnect), connectTelegram);
router.post('/messages/ingest', validateRequest(validateTelegramMessageIngest), ingestMessage);
router.post('/messages/process-now', validateRequest(validateTelegramMessageIngest), processMessageNow);
router.get('/dashboard', getDashboard);
router.get('/feed', getFeed);
router.get('/candidates', getCandidates);
router.get('/review-tasks', getReviewTasks);
router.post('/candidates/:candidateId/approve', validateRequest(validateReviewResolution), approveCandidate);
router.post('/candidates/:candidateId/reject', validateRequest(validateReviewResolution), rejectCandidate);
router.get('/supplier-activity', getSupplierActivity);
router.get('/low-confidence-alerts', getLowConfidenceAlerts);

export default router;
