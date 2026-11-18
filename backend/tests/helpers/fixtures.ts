import prismaClient from '../../src/config/db.config.js';
import { SwipeDirection } from '../../src/generated/prisma/client.js';
import { recordSwipeService } from '../../src/services/swipe.service.js';

// same as CURRENT_USER_ID in testEnv.ts
export const ME = '00000000-0000-4000-8000-000000000001';

export const PUBLIC_PROFILE_KEYS = [
  'age',
  'bio',
  'city',
  'college',
  'id',
  'interests',
  'name',
  'photoUrl',
];

let counter = 0;

export async function createUser(name = `Person ${++counter}`, id?: string) {
  const user = await prismaClient.user.create({
    data: {
      id,
      name,
      birthDate: new Date('2003-05-20'),
      bio: 'Hi there',
      city: 'Hyderabad',
      photoUrl: 'https://example.test/photo.svg',
      interests: ['music', 'chai'],
    },
  });
  return user.id;
}

export const createMe = () => createUser('Me', ME);

export async function createProfiles(count: number) {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) ids.push(await createUser());
  return ids;
}

// insert a swipe directly, skips the match logic
export async function insertSwipe(swiperId: string, targetId: string, direction: 'like' | 'pass') {
  await prismaClient.swipe.create({
    data: {
      swiperId,
      targetId,
      direction: direction === 'like' ? SwipeDirection.LIKE : SwipeDirection.PASS,
    },
  });
}

// swipe through the service, so matches get created
export function swipeAs(swiperId: string, targetId: string, direction: 'like' | 'pass') {
  return recordSwipeService(swiperId, { targetId, direction });
}
