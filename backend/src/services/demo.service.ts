import { deleteOwnSwipesAndMatches } from '../repositories/demo.repository.js';

// clears only the user's own swipes/matches, other people's likes stay
export async function resetDemoService(userId: string) {
  return deleteOwnSwipesAndMatches(userId);
}
