import { describe, expect, it } from 'vitest';
import { ageOn, toPublicProfile, type ProfileRow } from './profile.mapper.js';

const date = (s: string) => new Date(`${s}T00:00:00Z`);

describe('ageOn', () => {
  it('only counts the birthday once it has passed', () => {
    expect(ageOn(date('2003-06-15'), date('2026-06-14'))).toBe(22);
    expect(ageOn(date('2003-06-15'), date('2026-06-15'))).toBe(23);
  });

  it('handles 29 Feb birthdays', () => {
    expect(ageOn(date('2004-02-29'), date('2026-02-28'))).toBe(21);
    expect(ageOn(date('2004-02-29'), date('2026-03-01'))).toBe(22);
  });
});

describe('toPublicProfile', () => {
  it('drops any extra fields', () => {
    const row = {
      id: 'u1',
      name: 'Asha',
      birthDate: date('2002-01-10'),
      bio: 'Chai over coffee',
      city: 'Pune',
      college: null,
      photoUrl: 'https://example.test/a.svg',
      interests: ['music'],
      likedYou: true,
    } as ProfileRow;

    const profile = toPublicProfile(row, date('2026-11-18'));
    expect(profile).not.toHaveProperty('likedYou');
    expect(profile.age).toBe(24);
  });
});
