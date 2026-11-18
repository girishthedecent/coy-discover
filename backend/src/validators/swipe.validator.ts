import { z } from 'zod';

export const swipeBodySchema = z.object({
  // lowercase so orderPair sorts the same as postgres
  targetId: z.uuid().transform((id) => id.toLowerCase()),
  direction: z.enum(['like', 'pass']),
});

export type SwipeBody = z.infer<typeof swipeBodySchema>;
