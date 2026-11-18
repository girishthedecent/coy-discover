import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import logger from '../config/logger.config.js';
import { Prisma } from '../generated/prisma/client.js';
import {
  AppError,
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  PayloadTooLargeError,
} from '../utils/errors/app.error.js';
import { getCorrelationId } from '../utils/helpers/request.helpers.js';

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return new BadRequestError('Invalid request', issues);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') return new NotFoundError();
    if (err.code === 'P2002') return new ConflictError('Already exists');
  }

  // errors thrown by express.json()
  const type = (err as { type?: unknown } | null)?.type;
  if (type === 'entity.too.large') return new PayloadTooLargeError('Request body too large');
  if (type === 'entity.parse.failed') return new BadRequestError('Malformed JSON body');

  if (err instanceof URIError) return new BadRequestError('Malformed URL');

  return new InternalServerError();
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError(`Route not found: ${req.method} ${req.path}`));
}

export function genericErrorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(err);

  const appError = toAppError(err);
  if (appError.statusCode >= 500) {
    logger.error('Unhandled error', { error: err, method: req.method, path: req.path });
  }

  res.status(appError.statusCode).json({
    success: false,
    message: appError.message,
    code: appError.code,
    ...(appError.details !== undefined && { details: appError.details }),
    correlationId: getCorrelationId(),
  });
}
