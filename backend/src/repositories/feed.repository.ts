import prismaClient from '../config/db.config.js';
import type { ProfileRow } from '../mappers/profile.mapper.js';

// Only looks at the user's own swipes. Ordering by who liked you would leak it, so the
// order is just a hash of (user, profile) - stable per user, unrelated to likes.
export async function findUnswipedProfiles(userId: string, limit: number): Promise<ProfileRow[]> {
  return prismaClient.$queryRaw<ProfileRow[]>`
    SELECT u.id, u.name, u."birthDate", u.bio, u.city, u.college, u."photoUrl", u.interests
    FROM users u
    WHERE u.id <> ${userId}::uuid
      AND NOT EXISTS (
        SELECT 1 FROM swipes s
        WHERE s."swiperId" = ${userId}::uuid AND s."targetId" = u.id
      )
    ORDER BY md5(${userId}::text || u.id::text), u.id
    LIMIT ${limit}
  `;
}
