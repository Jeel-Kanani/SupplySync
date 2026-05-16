import mongoose from 'mongoose';

import { env } from './env.js';

export const connectDB = async () => {
  mongoose.set('strictQuery', true);

  try {
    const connection = await mongoose.connect(env.mongoUri);

    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.warn(`MongoDB unavailable, starting in degraded mode: ${error.message}`);
    return null;
  }
};
