import { z } from 'zod';
import { appConfig } from '../config/app.config.js';

export const feedQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(appConfig.feed.maxLimit)
    .default(appConfig.feed.defaultLimit),
});

export type FeedQuery = z.infer<typeof feedQuerySchema>;
