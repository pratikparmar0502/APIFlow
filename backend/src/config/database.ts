import mongoose from 'mongoose';
import { config } from './env';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) return;
  
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    isConnected = true;
    console.log('[DB] Connected to MongoDB');

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[DB] Disconnected from MongoDB');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      console.log('[DB] Reconnected to MongoDB');
    });
  } catch (error) {
    console.error('[DB] Connection failed:', error);
    throw error;
  }
}

export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
