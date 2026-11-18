import logger from '../config/logger.config.js';
import { pingDatabase } from '../repositories/health.repository.js';

export async function getReadinessService() {
  try {
    await pingDatabase();
    return { status: 'ok', db: 'ok' };
  } catch (error) {
    logger.warn('Database is not reachable', { error });
    return { status: 'degraded', db: 'down' };
  }
}
