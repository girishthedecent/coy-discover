import prismaClient from '../config/db.config.js';
import type { Prisma, SwipeDirection } from '../generated/prisma/client.js';
import { PUBLIC_PROFILE_SELECT } from '../mappers/profile.mapper.js';

type Tx = Prisma.TransactionClient;

export function withTransaction<T>(fn: (tx: Tx) => Promise<T>) {
  return prismaClient.$transaction(fn);
}

// Lock the pair for the rest of the transaction. Otherwise two people liking each other at
// the same time can both miss the other's like and no match gets created.
export async function lockPair(tx: Tx, a: string, b: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${a}:${b}`}, 0))`;
}

export function findProfile(tx: Tx, id: string) {
  return tx.user.findUnique({ where: { id }, select: PUBLIC_PROFILE_SELECT });
}

export function findSwipe(tx: Tx, swiperId: string, targetId: string) {
  return tx.swipe.findUnique({
    where: { swiperId_targetId: { swiperId, targetId } },
    select: { direction: true },
  });
}

export function createSwipe(tx: Tx, swiperId: string, targetId: string, direction: SwipeDirection) {
  return tx.swipe.create({ data: { swiperId, targetId, direction }, select: { id: true } });
}

export function findMatch(tx: Tx, userAId: string, userBId: string) {
  return tx.match.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
    select: { id: true, createdAt: true },
  });
}

export function createMatch(tx: Tx, userAId: string, userBId: string) {
  return tx.match.create({ data: { userAId, userBId }, select: { id: true, createdAt: true } });
}
