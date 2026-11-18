import { findUserId } from '../repositories/user.repository.js';
import { UnauthorizedError } from '../utils/errors/app.error.js';

export async function getCurrentUserIdService(configuredId: string): Promise<string> {
  const user = await findUserId(configuredId);
  if (!user) throw new UnauthorizedError('Current user not found. Run `pnpm db:seed`.');
  return user.id;
}
