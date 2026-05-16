import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';

import { corsOptions } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: 'SupplySync API',
      status: mongoose.connection.readyState === 1 ? 'healthy' : 'degraded',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
