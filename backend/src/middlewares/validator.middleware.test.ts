import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { genericErrorHandler } from './error.middleware.js';
import { validateQueryParams, validateRequestBody } from './validator.middleware.js';

const app = express();
app.use(express.json());
app.post(
  '/items',
  validateQueryParams(z.object({ limit: z.coerce.number().int().max(100).default(20) })),
  validateRequestBody(z.object({ name: z.string().trim().min(1) })),
  (req, res) => {
    res.json({ body: req.body, query: res.locals.query });
  },
);
app.use(genericErrorHandler);

describe('validators', () => {
  it('pass parsed values on', async () => {
    const res = await request(app).post('/items?limit=5').send({ name: '  book ' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ body: { name: 'book' }, query: { limit: 5 } });
  });

  it('reject invalid query and body', async () => {
    const query = await request(app).post('/items?limit=500').send({ name: 'x' });
    expect(query.status).toBe(400);
    expect(query.body.message).toBe('Invalid query params');

    const body = await request(app).post('/items').send({});
    expect(body.status).toBe(400);
    expect(body.body.details).toEqual([{ path: 'name', message: expect.any(String) }]);
  });
});
