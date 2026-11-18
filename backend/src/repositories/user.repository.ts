import prismaClient from '../config/db.config.js';

export function findUserId(id: string) {
  return prismaClient.user.findUnique({ where: { id }, select: { id: true } });
}
