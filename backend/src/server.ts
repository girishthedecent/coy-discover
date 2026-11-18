import { createApp } from './app.js';
import prismaClient from './config/db.config.js';
import { serverConfig } from './config/index.js';
import logger from './config/logger.config.js';

const server = createApp().listen(serverConfig.PORT, (err) => {
  if (err) {
    logger.error('Failed to start server', { error: err });
    process.exit(1);
  }
  logger.info(`Server running on http://localhost:${serverConfig.PORT}`);
});

function shutdown() {
  logger.info('Shutting down');
  server.close(async () => {
    await prismaClient.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
