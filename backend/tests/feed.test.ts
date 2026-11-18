import { beforeEach, describe, expect, it } from 'vitest';
import { testApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';
import {
  createMe,
  createProfiles,
  insertSwipe,
  ME,
  PUBLIC_PROFILE_KEYS,
} from './helpers/fixtures.js';

beforeEach(async () => {
  await resetDb();
  await createMe();
});

async function feedIds() {
  const res = await testApp().get('/api/v1/feed?limit=50');
  expect(res.status).toBe(200);
  return res.body.data.profiles.map((p: { id: string }) => p.id);
}

describe('GET /api/v1/feed', () => {
  it('returns other profiles with only public fields', async () => {
    const ids = await createProfiles(3);

    const res = await testApp().get('/api/v1/feed');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.data.hasMore).toBe(false);

    const { profiles } = res.body.data;
    expect(profiles.map((p: { id: string }) => p.id).sort()).toEqual(ids.sort());
    for (const profile of profiles) {
      expect(Object.keys(profile).sort()).toEqual(PUBLIC_PROFILE_KEYS);
    }
  });

  it('does not return profiles I already swiped on', async () => {
    const [liked, passed, other] = await createProfiles(3);
    await testApp().post('/api/v1/swipe').send({ targetId: liked, direction: 'like' }).expect(200);
    await testApp().post('/api/v1/swipe').send({ targetId: passed, direction: 'pass' }).expect(200);

    expect(await feedIds()).toEqual([other]);
  });

  it('respects limit and sets hasMore', async () => {
    await createProfiles(5);

    const first = await testApp().get('/api/v1/feed?limit=3');
    expect(first.body.data.profiles).toHaveLength(3);
    expect(first.body.data.hasMore).toBe(true);

    const all = await testApp().get('/api/v1/feed?limit=5');
    expect(all.body.data.profiles).toHaveLength(5);
    expect(all.body.data.hasMore).toBe(false);
  });

  it('rejects an invalid limit', async () => {
    for (const limit of ['0', '51', 'abc']) {
      const res = await testApp().get(`/api/v1/feed?limit=${limit}`);
      expect(res.status).toBe(400);
    }
  });

  it('keeps the same order on reload', async () => {
    await createProfiles(8);
    expect(await feedIds()).toEqual(await feedIds());
  });

  it('returns 401 if the current user does not exist', async () => {
    await resetDb();
    const res = await testApp().get('/api/v1/feed');
    expect(res.status).toBe(401);
  });
});

describe('feed privacy', () => {
  it('is exactly the same whether or not others liked me', async () => {
    const ids = await createProfiles(12);
    const before = await testApp().get('/api/v1/feed?limit=50');

    for (const id of ids.slice(0, 6)) await insertSwipe(id, ME, 'like');
    for (const id of ids.slice(6, 9)) await insertSwipe(id, ME, 'pass');
    const after = await testApp().get('/api/v1/feed?limit=50');

    // same order and content, so likers can't be spotted
    expect(after.body).toEqual(before.body);
  });

  it('still shows people who passed on me', async () => {
    const [id] = await createProfiles(1);
    await insertSwipe(id!, ME, 'pass');
    expect(await feedIds()).toEqual([id]);
  });

  it('has nothing about likes or swipes in the response', async () => {
    const [id] = await createProfiles(1);
    await insertSwipe(id!, ME, 'like');

    const res = await testApp().get('/api/v1/feed');
    const text = JSON.stringify(res.body).toLowerCase();
    for (const word of ['like', 'swipe', 'direction', 'match']) {
      expect(text).not.toContain(word);
    }
  });
});
