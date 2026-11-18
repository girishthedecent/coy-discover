import { toPublicProfile, type PublicProfile } from '../mappers/profile.mapper.js';
import { findUnswipedProfiles } from '../repositories/feed.repository.js';

export type Feed = {
  profiles: PublicProfile[];
  hasMore: boolean;
};

export async function getFeedService(userId: string, limit: number): Promise<Feed> {
  // fetch one extra to know if there's more
  const rows = await findUnswipedProfiles(userId, limit + 1);
  const now = new Date();
  return {
    profiles: rows.slice(0, limit).map((row) => toPublicProfile(row, now)),
    hasMore: rows.length > limit,
  };
}
