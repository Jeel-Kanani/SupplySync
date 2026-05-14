import { telegramApi } from '../api/telegramApi.js';

export const telegramService = {
  connect: (payload) => telegramApi.connect(payload),
  addChannel: (payload) => telegramApi.addChannel(payload),
  channels: () => telegramApi.getChannels(),
  extractions: (params) => telegramApi.getExtractions(params)
};
