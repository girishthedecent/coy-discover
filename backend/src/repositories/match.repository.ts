import prismaClient from '../config/db.config.js';
import { PUBLIC_PROFILE_SELECT } from '../mappers/profile.mapper.js';

export async function findMatchesForUser(userId: string) {
  return prismaClient.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      createdAt: true,
      userAId: true,
      userA: { select: PUBLIC_PROFILE_SELECT },
      userB: { select: PUBLIC_PROFILE_SELECT },
    },
  });
}
