import { telegramIntelligenceApi } from '../api/telegramIntelligenceApi.js';

export const telegramIntelligenceService = {
  startRuntime: () => telegramIntelligenceApi.startRuntime(),
  connect: (payload) => telegramIntelligenceApi.connect(payload),
  ingestMessage: (payload) => telegramIntelligenceApi.ingestMessage(payload),
  processMessageNow: (payload) => telegramIntelligenceApi.processMessageNow(payload),
  dashboard: () => telegramIntelligenceApi.dashboard(),
  feed: (params) => telegramIntelligenceApi.feed(params),
  candidates: (params) => telegramIntelligenceApi.candidates(params),
  reviewTasks: (params) => telegramIntelligenceApi.reviewTasks(params),
  approveCandidate: (candidateId, payload) => telegramIntelligenceApi.approveCandidate(candidateId, payload),
  rejectCandidate: (candidateId, payload) => telegramIntelligenceApi.rejectCandidate(candidateId, payload),
  supplierActivity: () => telegramIntelligenceApi.supplierActivity(),
  lowConfidenceAlerts: (params) => telegramIntelligenceApi.lowConfidenceAlerts(params)
};
