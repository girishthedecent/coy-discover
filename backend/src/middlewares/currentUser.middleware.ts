import type { NextFunction, Request, Response } from 'express';
import { serverConfig } from '../config/index.js';
import { getCurrentUserIdService } from '../services/user.service.js';
import { UnauthorizedError } from '../utils/errors/app.error.js';

// No auth for now: always the configured user. Swap this out for a session lookup later.
export async function attachCurrentUser(_req: Request, res: Response, next: NextFunction) {
  res.locals.userId = await getCurrentUserIdService(serverConfig.CURRENT_USER_ID);
  next();
}

export function getCurrentUserId(res: Response): string {
  const { userId } = res.locals;
  if (!userId) throw new UnauthorizedError();
  return userId;
}

export function noStoreMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('cache-control', 'no-store');
  next();
}
