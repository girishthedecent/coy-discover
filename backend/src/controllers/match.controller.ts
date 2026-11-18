import type { Request, Response } from 'express';
import { getCurrentUserId } from '../middlewares/currentUser.middleware.js';
import { successResponse } from '../utils/helpers/response.helpers.js';
import { listMatchesService } from '../services/match.service.js';

export async function listMatchesHandler(_req: Request, res: Response) {
  const result = await listMatchesService(getCurrentUserId(res));
  res.json(successResponse('Matches fetched', result));
}
