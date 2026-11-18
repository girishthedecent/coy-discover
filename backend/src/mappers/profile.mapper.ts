import type { Prisma } from '../generated/prisma/client.js';

// only these fields are ever sent to the client
export const PUBLIC_PROFILE_SELECT = {
  id: true,
  name: true,
  birthDate: true,
  bio: true,
  city: true,
  college: true,
  photoUrl: true,
  interests: true,
} as const satisfies Prisma.UserSelect;

export type ProfileRow = Prisma.UserGetPayload<{ select: typeof PUBLIC_PROFILE_SELECT }>;

export type PublicProfile = {
  id: string;
  name: string;
  age: number;
  bio: string;
  city: string;
  college: string | null;
  photoUrl: string;
  interests: string[];
};

export function ageOn(birthDate: Date, on: Date = new Date()): number {
  let age = on.getUTCFullYear() - birthDate.getUTCFullYear();
  const beforeBirthday =
    on.getUTCMonth() < birthDate.getUTCMonth() ||
    (on.getUTCMonth() === birthDate.getUTCMonth() && on.getUTCDate() < birthDate.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function toPublicProfile(row: ProfileRow, now: Date = new Date()): PublicProfile {
  return {
    id: row.id,
    name: row.name,
    age: ageOn(row.birthDate, now),
    bio: row.bio,
    city: row.city,
    college: row.college,
    photoUrl: row.photoUrl,
    interests: row.interests,
  };
}
