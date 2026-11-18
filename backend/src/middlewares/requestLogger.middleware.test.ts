import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import logger from '../config/logger.config.js';
import { requestLoggerMiddleware } from './requestLogger.middleware.js';

afterEach(() => {
  vi.restoreAllMocks();
});

function app() {
  const app = express();
  app.use(requestLoggerMiddleware);
  app.get('/api/v1/items/:id', (_req, res) => {
    res.json({});
  });
  app.get('/api/v1/health/live', (_req, res) => {
    res.json({});
  });
  app.get('/broken', (_req, res) => {
    res.status(500).json({});
  });
  return app;
}

describe('requestLoggerMiddleware', () => {
  it('logs method, path and status without the query string', async () => {
    const log = vi.spyOn(logger, 'log');
    await request(app()).get('/api/v1/items/42?token=secret');

    expect(log).toHaveBeenCalledWith('info', 'GET /api/v1/items/42 200', expect.any(Object));
    expect(JSON.stringify(log.mock.calls)).not.toContain('secret');
  });

  it('logs server errors as error', async () => {
    const log = vi.spyOn(logger, 'log');
    await request(app()).get('/broken');
    expect(log).toHaveBeenCalledWith('error', 'GET /broken 500', expect.any(Object));
  });

  it('skips health checks', async () => {
    const log = vi.spyOn(logger, 'log');
    await request(app()).get('/api/v1/health/live');
    expect(log).not.toHaveBeenCalled();
  });
});
