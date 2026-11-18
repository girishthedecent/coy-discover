import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { asyncLocalStorage } from '../utils/helpers/request.helpers.js';

export function attachCorrelationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header('x-correlation-id');
  // only reuse short, safe ids from the client
  const correlationId = incoming && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID();

  res.setHeader('x-correlation-id', correlationId);
  asyncLocalStorage.run({ correlationId }, () => next());
}
