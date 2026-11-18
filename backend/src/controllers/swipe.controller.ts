import type { Request, Response } from 'express';
import { getCurrentUserId } from '../middlewares/currentUser.middleware.js';
import { successResponse } from '../utils/helpers/response.helpers.js';
import type { SwipeBody } from '../validators/swipe.validator.js';
import { recordSwipeService } from '../services/swipe.service.js';

export async function recordSwipeHandler(req: Request, res: Response) {
  const result = await recordSwipeService(getCurrentUserId(res), req.body as SwipeBody);
  res.json(successResponse('Swipe recorded', result));
}
