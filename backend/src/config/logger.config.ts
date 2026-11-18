import winston from 'winston';
import { getCorrelationId } from '../utils/helpers/request.helpers.js';
import { serverConfig } from './index.js';

const logger = winston.createLogger({
  level: serverConfig.LOG_LEVEL === 'silent' ? 'error' : serverConfig.LOG_LEVEL,
  silent: serverConfig.LOG_LEVEL === 'silent',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format((info) => ({ ...info, correlationId: getCorrelationId() }))(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
