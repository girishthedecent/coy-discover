import { beforeEach, describe, expect, it } from 'vitest';
import { testApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';
import {
  createMe,
  createUser,
  insertSwipe,
  ME,
  PUBLIC_PROFILE_KEYS,
  swipeAs,
} from './helpers/fixtures.js';

beforeEach(async () => {
  await resetDb();
  await createMe();
});

async function matchNames() {
  const res = await testApp().get('/api/v1/matches');
  expect(res.status).toBe(200);
  return res.body.data.matches.map((m: { profile: { name: string } }) => m.profile.name);
}

describe('GET /api/v1/matches', () => {
  it('is empty at first', async () => {
    expect(await matchNames()).toEqual([]);
  });

  it('lists mutual matches, newest first', async () => {
    const first = await createUser('First');
    const second = await createUser('Second');
    await insertSwipe(first, ME, 'like');
    await insertSwipe(second, ME, 'like');
    await swipeAs(ME, first, 'like');
    await swipeAs(ME, second, 'like');

    expect(await matchNames()).toEqual(['Second', 'First']);

    const res = await testApp().get('/api/v1/matches');
    const [match] = res.body.data.matches;
    expect(Object.keys(match).sort()).toEqual(['id', 'matchedAt', 'profile']);
    expect(Object.keys(match.profile).sort()).toEqual(PUBLIC_PROFILE_KEYS);
  });

  it('does not show one-sided likes', async () => {
    // they liked me, I haven't swiped
    const admirer = await createUser('Admirer');
    await insertSwipe(admirer, ME, 'like');
    // I liked them, they haven't swiped
    const crush = await createUser('Crush');
    await swipeAs(ME, crush, 'like');
    // they liked me, I passed
    const passed = await createUser('Passed');
    await insertSwipe(passed, ME, 'like');
    await swipeAs(ME, passed, 'pass');

    expect(await matchNames()).toEqual([]);
  });

  it("does not show other people's matches", async () => {
    const a = await createUser('A');
    const b = await createUser('B');
    await swipeAs(a, b, 'like');
    await swipeAs(b, a, 'like');

    expect(await matchNames()).toEqual([]);
  });
});

describe('POST /api/v1/demo/reset', () => {
  it('clears my swipes and matches but keeps likes from others', async () => {
    const liker = await createUser('Liker');
    await insertSwipe(liker, ME, 'like');
    await swipeAs(ME, liker, 'like');
    expect(await matchNames()).toEqual(['Liker']);

    const res = await testApp().post('/api/v1/demo/reset');
    expect(res.status).toBe(200);
    expect(await matchNames()).toEqual([]);

    const again = await testApp()
      .post('/api/v1/swipe')
      .send({ targetId: liker, direction: 'like' });
    expect(again.body.data.matched).toBe(true);
  });
});
