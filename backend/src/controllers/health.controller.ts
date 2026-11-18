import type { Request, Response } from 'express';
import { getReadinessService } from '../services/health.service.js';
import { getCorrelationId } from '../utils/helpers/request.helpers.js';
import { successResponse } from '../utils/helpers/response.helpers.js';

export function getLivenessHandler(_req: Request, res: Response) {
  res.json(successResponse('Service is up', { status: 'ok' }));
}

export async function getReadinessHandler(_req: Request, res: Response) {
  const readiness = await getReadinessService();
  if (readiness.status !== 'ok') {
    res.status(503).json({
      success: false,
      message: 'Service is not ready',
      code: 'SERVICE_UNAVAILABLE',
      data: readiness,
      correlationId: getCorrelationId(),
    });
    return;
  }
  res.json(successResponse('Service is ready', readiness));
}
