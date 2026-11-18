import { toMatchView, type MatchView } from '../mappers/match.mapper.js';
import { findMatchesForUser } from '../repositories/match.repository.js';

export async function listMatchesService(userId: string): Promise<{ matches: MatchView[] }> {
  const rows = await findMatchesForUser(userId);
  const now = new Date();
  return {
    matches: rows.map((row) =>
      toMatchView(row, row.userAId === userId ? row.userB : row.userA, now),
    ),
  };
}
