import { afterEach, describe, expect, it, vi } from 'vitest';
import prismaClient from '../src/config/db.config.js';
import { testApp } from './helpers/app.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('health', () => {
  it('live is ok', async () => {
    const res = await testApp().get('/api/v1/health/live');
    expect(res.status).toBe(200);
  });

  it('ready checks the database', async () => {
    const res = await testApp().get('/api/v1/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ status: 'ok', db: 'ok' });
  });

  it('ready returns 503 when the database is down', async () => {
    vi.spyOn(prismaClient, '$queryRaw').mockRejectedValueOnce(new Error('connection refused'));
    const res = await testApp().get('/api/v1/health/ready');
    expect(res.status).toBe(503);
    expect(res.body.data).toEqual({ status: 'degraded', db: 'down' });
  });
});

describe('correlation id', () => {
  it('keeps a valid incoming id and replaces an invalid one', async () => {
    const kept = await testApp().get('/api/v1/health/live').set('x-correlation-id', 'abc-123');
    expect(kept.headers['x-correlation-id']).toBe('abc-123');

    const replaced = await testApp()
      .get('/api/v1/health/live')
      .set('x-correlation-id', 'has spaces; and "quotes"');
    expect(replaced.headers['x-correlation-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});
