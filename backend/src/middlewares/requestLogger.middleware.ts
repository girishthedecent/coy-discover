import type { NextFunction, Request, Response } from 'express';
import logger from '../config/logger.config.js';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api/v1/health')) return next();

  const start = Date.now();
  // log the path without the query string
  const path = req.originalUrl.split('?')[0];

  res.on('finish', () => {
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger.log(level, `${req.method} ${path} ${res.statusCode}`, {
      durationMs: Date.now() - start,
    });
  });
  next();
}
