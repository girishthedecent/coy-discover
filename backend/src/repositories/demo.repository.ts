import prismaClient from '../config/db.config.js';

export async function deleteOwnSwipesAndMatches(userId: string) {
  const [swipes, matches] = await prismaClient.$transaction([
    prismaClient.swipe.deleteMany({ where: { swiperId: userId } }),
    prismaClient.match.deleteMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] } }),
  ]);
  return { swipesDeleted: swipes.count, matchesDeleted: matches.count };
}
