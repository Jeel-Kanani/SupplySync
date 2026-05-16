import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = ['MONGO_URI'];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  automationSchedulerEnabled: process.env.AUTOMATION_SCHEDULER_ENABLED !== 'false',
  telegramIntelligenceEnabled: process.env.TELEGRAM_INTELLIGENCE_ENABLED !== 'false',
  telegramAiParserEnabled: process.env.TELEGRAM_AI_PARSER_ENABLED !== 'false',
  telegramAiParserProvider: process.env.TELEGRAM_AI_PARSER_PROVIDER || 'openai',
  telegramAiParserModel: process.env.TELEGRAM_AI_PARSER_MODEL || 'gpt-4o-mini',
  telegramAiParserFallbackToHeuristic:
    process.env.TELEGRAM_AI_PARSER_FALLBACK_TO_HEURISTIC !== 'false',
  telegramAutoApplyConfidence: Number(process.env.TELEGRAM_AUTO_APPLY_CONFIDENCE || 90),
  telegramReviewConfidence: Number(process.env.TELEGRAM_REVIEW_CONFIDENCE || 70),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  telegramApiId: process.env.TELEGRAM_API_ID ? Number(process.env.TELEGRAM_API_ID) : null,
  telegramApiHash: process.env.TELEGRAM_API_HASH || '',
  telegramSession: process.env.TELEGRAM_SESSION || '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production'
};

export const corsOptions = {
  origin: env.corsOrigin === '*' ? true : env.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
