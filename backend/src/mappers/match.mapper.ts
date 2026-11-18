import { toPublicProfile, type ProfileRow, type PublicProfile } from './profile.mapper.js';

export type MatchView = {
  id: string;
  matchedAt: Date;
  profile: PublicProfile;
};

export function toMatchView(
  match: { id: string; createdAt: Date },
  other: ProfileRow,
  now: Date = new Date(),
): MatchView {
  return { id: match.id, matchedAt: match.createdAt, profile: toPublicProfile(other, now) };
}

export function orderPair(x: string, y: string): [string, string] {
  return x < y ? [x, y] : [y, x];
}
