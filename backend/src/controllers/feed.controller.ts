import type { Request, Response } from 'express';
import { getCurrentUserId } from '../middlewares/currentUser.middleware.js';
import { successResponse } from '../utils/helpers/response.helpers.js';
import type { FeedQuery } from '../validators/feed.validator.js';
import { getFeedService } from '../services/feed.service.js';

export async function getFeedHandler(_req: Request, res: Response) {
  const { limit } = res.locals.query as FeedQuery;
  const feed = await getFeedService(getCurrentUserId(res), limit);
  res.json(successResponse('Feed fetched', feed));
}
