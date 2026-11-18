import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { appConfig } from './config/app.config.js';
import { serverConfig } from './config/index.js';
import { attachCorrelationIdMiddleware } from './middlewares/correlation.middleware.js';
import { genericErrorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { requestLoggerMiddleware } from './middlewares/requestLogger.middleware.js';
import v1Router from './routes/v1/index.routes.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', serverConfig.TRUST_PROXY);
  app.set('etag', false);

  app.use(attachCorrelationIdMiddleware);
  app.use(requestLoggerMiddleware);
  app.use(helmet());
  app.use(cors({ origin: serverConfig.TRUSTED_ORIGINS }));
  app.use(express.json({ limit: appConfig.jsonLimit }));

  app.use('/api/v1', v1Router);

  app.use(notFoundHandler);
  app.use(genericErrorHandler);

  return app;
}
