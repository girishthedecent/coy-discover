import type { Request, Response } from 'express';
import { getCurrentUserId } from '../middlewares/currentUser.middleware.js';
import { successResponse } from '../utils/helpers/response.helpers.js';
import { resetDemoService } from '../services/demo.service.js';

export async function resetDemoHandler(_req: Request, res: Response) {
  const result = await resetDemoService(getCurrentUserId(res));
  res.json(successResponse('Demo reset', result));
}
