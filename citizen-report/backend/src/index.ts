import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { connectMongo, disconnectMongo } from './lib/mongoose';

async function start() {
  await connectMongo();
  logger.info('Connected to MongoDB');

  // სწორად ვიღებთ app-ს ობიექტიდან, რომელსაც createApp() აბრუნებს
  const { app } = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Citizen Report API listening on :${env.PORT} (${env.NODE_ENV})`);
    logger.info(`API docs at http://localhost:${env.PORT}/api/docs`);
  });

  // Graceful shutdown.
  async function shutdown(signal: string) {
    logger.info(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectMongo();
      process.exit(0);
    });
    // Force-exit if not closed in time.
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});