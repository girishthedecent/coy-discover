import { beforeEach, describe, expect, it } from 'vitest';
import prismaClient from '../src/config/db.config.js';
import { testApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';
import {
  createMe,
  createProfiles,
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

const swipe = (targetId: string | undefined, direction: string) =>
  testApp().post('/api/v1/swipe').send({ targetId, direction });

describe('POST /api/v1/swipe', () => {
  it('records a pass', async () => {
    const [id] = await createProfiles(1);
    const res = await swipe(id, 'pass');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ matched: false });
    const saved = await prismaClient.swipe.findFirst({ where: { swiperId: ME } });
    expect(saved).toMatchObject({ targetId: id, direction: 'PASS' });
  });

  it('records a like without a match if they have not liked me', async () => {
    const [id] = await createProfiles(1);
    const res = await swipe(id, 'like');

    expect(res.body.data).toEqual({ matched: false });
    expect(await prismaClient.match.count()).toBe(0);
  });

  it('creates a match if they already liked me', async () => {
    const id = await createUser('Ananya');
    await insertSwipe(id, ME, 'like');

    const res = await swipe(id, 'like');
    expect(res.body.data.matched).toBe(true);
    expect(res.body.data.match.profile).toMatchObject({ id, name: 'Ananya' });
    expect(Object.keys(res.body.data.match.profile).sort()).toEqual(PUBLIC_PROFILE_KEYS);
    expect(await prismaClient.match.count()).toBe(1);
  });

  it('does not match if they passed on me', async () => {
    const id = await createUser();
    await insertSwipe(id, ME, 'pass');

    expect((await swipe(id, 'like')).body.data).toEqual({ matched: false });
    expect(await prismaClient.match.count()).toBe(0);
  });

  it('matches later when they like me back', async () => {
    const [id] = await createProfiles(1);
    await swipe(id, 'like');

    const theirs = await swipeAs(id!, ME, 'like');
    expect(theirs.matched).toBe(true);

    const res = await testApp().get('/api/v1/matches');
    expect(res.body.data.matches).toHaveLength(1);
  });

  it('gives the same response for a pass and a one-sided like', async () => {
    const [stranger, passer, liker] = await createProfiles(3);
    await insertSwipe(passer!, ME, 'pass');
    await insertSwipe(liker!, ME, 'like');

    const a = await swipe(stranger, 'like');
    const b = await swipe(passer, 'like');
    const c = await swipe(liker, 'pass');
    expect(b.body).toEqual(a.body);
    expect(c.body).toEqual(a.body);
  });

  it('returns the same result when the same swipe is sent twice', async () => {
    const id = await createUser();
    await insertSwipe(id, ME, 'like');

    const first = await swipe(id, 'like');
    const second = await swipe(id, 'like');
    expect(second.body).toEqual(first.body);
    expect(await prismaClient.swipe.count({ where: { swiperId: ME } })).toBe(1);
    expect(await prismaClient.match.count()).toBe(1);
  });

  it('does not allow changing a swipe', async () => {
    const [id] = await createProfiles(1);
    await swipe(id, 'pass');

    const res = await swipe(id, 'like');
    expect(res.status).toBe(409);
  });

  it('rejects bad input', async () => {
    expect((await swipe(ME, 'like')).status).toBe(400);
    expect((await swipe('0198e3a4-0000-7000-8000-000000000000', 'like')).status).toBe(404);

    const [id] = await createProfiles(1);
    expect((await swipe(id, 'superlike')).status).toBe(400);
    expect((await swipe(undefined, 'like')).status).toBe(400);
    expect(await prismaClient.swipe.count()).toBe(0);
  });

  it('accepts an uppercase id', async () => {
    const id = await createUser();
    await insertSwipe(id, ME, 'like');
    expect((await swipe(id.toUpperCase(), 'like')).body.data.matched).toBe(true);
  });
});

describe('concurrent likes', () => {
  it('creates exactly one match when two people like each other at the same time', async () => {
    const pairs: [string, string][] = [];
    for (let i = 0; i < 10; i++) pairs.push([await createUser(), await createUser()]);

    const results = await Promise.all(
      pairs.flatMap(([a, b]) => [swipeAs(a, b, 'like'), swipeAs(b, a, 'like')]),
    );

    expect(results.filter((r) => r.matched)).toHaveLength(10);
    expect(await prismaClient.match.count()).toBe(10);
  });
});
