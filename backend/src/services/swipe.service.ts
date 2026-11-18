import { SwipeDirection } from '../generated/prisma/client.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors/app.error.js';
import { orderPair, toMatchView, type MatchView } from '../mappers/match.mapper.js';
import {
  createMatch,
  createSwipe,
  findMatch,
  findProfile,
  findSwipe,
  lockPair,
  withTransaction,
} from '../repositories/swipe.repository.js';
import type { SwipeBody } from '../validators/swipe.validator.js';

// a pass and a one-sided like must look the same to the client
export type SwipeResult = { matched: false } | { matched: true; match: MatchView };

const NO_MATCH: SwipeResult = { matched: false };

const DIRECTION = {
  like: SwipeDirection.LIKE,
  pass: SwipeDirection.PASS,
} as const;

export async function recordSwipeService(
  swiperId: string,
  { targetId, direction }: SwipeBody,
): Promise<SwipeResult> {
  if (swiperId === targetId) throw new BadRequestError("You can't swipe on yourself");
  const dir = DIRECTION[direction];
  const [userAId, userBId] = orderPair(swiperId, targetId);

  return withTransaction(async (tx) => {
    await lockPair(tx, userAId, userBId);

    const target = await findProfile(tx, targetId);
    if (!target) throw new NotFoundError('Profile not found');

    const existing = await findSwipe(tx, swiperId, targetId);
    if (existing) {
      if (existing.direction !== dir) {
        throw new ConflictError('You have already swiped on this profile');
      }
      // retry of the same swipe -> same answer
      if (dir === SwipeDirection.PASS) return NO_MATCH;
      const match = await findMatch(tx, userAId, userBId);
      return match ? { matched: true, match: toMatchView(match, target) } : NO_MATCH;
    }

    await createSwipe(tx, swiperId, targetId, dir);
    if (dir === SwipeDirection.PASS) return NO_MATCH;

    const theirs = await findSwipe(tx, targetId, swiperId);
    if (theirs?.direction !== SwipeDirection.LIKE) return NO_MATCH;

    const match = await createMatch(tx, userAId, userBId);
    return { matched: true, match: toMatchView(match, target) };
  });
}
