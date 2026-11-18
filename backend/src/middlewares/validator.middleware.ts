import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';
import { BadRequestError } from '../utils/errors/app.error.js';

function issuesOf(error: z.ZodError) {
  return error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
}

export function validateRequestBody(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) throw new BadRequestError('Invalid request body', issuesOf(result.error));
    req.body = result.data;
    next();
  };
}

// req.query is read-only in express 5, so the parsed query goes on res.locals
export function validateQueryParams(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) throw new BadRequestError('Invalid query params', issuesOf(result.error));
    res.locals.query = result.data;
    next();
  };
}
