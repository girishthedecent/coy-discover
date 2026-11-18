import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { Prisma } from '../generated/prisma/client.js';
import { NotFoundError } from '../utils/errors/app.error.js';
import { attachCorrelationIdMiddleware } from './correlation.middleware.js';
import { genericErrorHandler, notFoundHandler } from './error.middleware.js';

function appThatThrows(err: unknown) {
  const app = express();
  app.use(attachCorrelationIdMiddleware);
  app.use(express.json({ limit: '10b' }));
  app.post('/boom', () => {
    throw err;
  });
  app.use(notFoundHandler);
  app.use(genericErrorHandler);
  return app;
}

const post = (err: unknown, body: object | string = {}) =>
  request(appThatThrows(err)).post('/boom').set('content-type', 'application/json').send(body);

describe('genericErrorHandler', () => {
  it('uses the status and code of an AppError', async () => {
    const res = await post(new NotFoundError('Profile not found'));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: 'Profile not found',
      code: 'NOT_FOUND',
      correlationId: res.headers['x-correlation-id'],
    });
  });

  it('turns zod errors into 400', async () => {
    const zodError = z.object({ name: z.string() }).safeParse({}).error;
    const res = await post(zodError);
    expect(res.status).toBe(400);
    expect(res.body.details[0].path).toBe('name');
  });

  it('maps prisma not found / unique errors', async () => {
    const prismaError = (code: string) =>
      new Prisma.PrismaClientKnownRequestError('db error', { code, clientVersion: 'test' });
    expect((await post(prismaError('P2025'))).status).toBe(404);
    expect((await post(prismaError('P2002'))).status).toBe(409);
  });

  it('hides the message of unexpected errors', async () => {
    const res = await post(new Error('secret connection string'));
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });

  it('handles bad json and big bodies', async () => {
    expect((await post(null, '{"a":')).status).toBe(400);
    expect((await post(null, { text: 'more than ten bytes' })).status).toBe(413);
  });

  it('returns json 404 for unknown routes', async () => {
    const res = await request(appThatThrows(null)).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
