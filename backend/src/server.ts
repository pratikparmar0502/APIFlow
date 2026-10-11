import { createApp } from './app';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';

async function main(): Promise<void> {
  try {
    console.log('[Server] Connecting to MongoDB...');
    await connectDatabase();
  } catch (err) {
    console.error('[Server] Failed to connect to database during startup:', err);
    // In dev or testing, we might still want the server to start even if Mongo isn't up yet
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`[Server] APIFlow backend running on port ${config.port} in ${config.nodeEnv} mode`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed');
      try {
        await disconnectDatabase();
        console.log('[Server] Database disconnected');
      } catch (err) {
        console.error('[Server] Error disconnecting database:', err);
      }
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[Server] Unhandled startup error:', err);
  process.exit(1);
});
