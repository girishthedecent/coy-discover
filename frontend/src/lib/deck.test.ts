import { describe, expect, it } from 'vitest';
import { deckReducer, initialDeck, needsRefill, type DeckState } from './deck';
import type { Profile } from './types';

const profile = (id: string): Profile => ({
  id,
  name: id,
  age: 22,
  bio: '',
  city: 'Pune',
  college: null,
  photoUrl: '',
  interests: [],
});

const loaded = (ids: string[], hasMore = false): DeckState =>
  deckReducer(initialDeck, { type: 'loaded', profiles: ids.map(profile), hasMore });

const ids = (state: DeckState) => state.cards.map((c) => c.id);

describe('deckReducer', () => {
  it('appends a page without duplicating cards already in the deck', () => {
    const state = deckReducer(loaded(['a', 'b']), {
      type: 'loaded',
      profiles: ['b', 'c'].map(profile),
      hasMore: true,
    });
    expect(ids(state)).toEqual(['a', 'b', 'c']);
    expect(state.hasMore).toBe(true);
  });

  it('never brings back a card swiped this session, even from a stale page', () => {
    let state = deckReducer(loaded(['a', 'b']), { type: 'swiped', id: 'a' });
    expect(ids(state)).toEqual(['b']);

    // stale page still has "a"
    state = deckReducer(state, {
      type: 'loaded',
      profiles: ['a', 'c'].map(profile),
      hasMore: false,
    });
    expect(ids(state)).toEqual(['b', 'c']);
  });

  it('puts a card back on top when its swipe fails', () => {
    let state = deckReducer(loaded(['a', 'b']), { type: 'swiped', id: 'a' });
    state = deckReducer(state, { type: 'restore', profile: profile('a') });
    expect(ids(state)).toEqual(['a', 'b']);
    expect(state.swiped.has('a')).toBe(false);
  });

  it('only shows the error screen when there are no cards to fall back on', () => {
    const empty = deckReducer(initialDeck, { type: 'failed', error: 'offline' });
    expect(empty.status).toBe('error');

    const withCards = deckReducer(loaded(['a']), { type: 'failed', error: 'offline' });
    expect(withCards.status).toBe('ready');
    expect(withCards.error).toBe('offline');
  });
});

describe('needsRefill', () => {
  it('asks for more when the deck runs low and the server has more', () => {
    expect(needsRefill(loaded(['a', 'b'], true), false)).toBe(true);
    expect(needsRefill(loaded(['a', 'b'], true), true)).toBe(false);
    expect(needsRefill(loaded(['a', 'b'], false), false)).toBe(false);
    expect(needsRefill(loaded(['a', 'b', 'c', 'd', 'e'], true), false)).toBe(false);
  });

  it('waits for a manual retry after a failed fetch', () => {
    const failed = deckReducer(loaded(['a'], true), { type: 'failed', error: 'offline' });
    expect(needsRefill(failed, false)).toBe(false);
    expect(needsRefill(deckReducer(failed, { type: 'loading' }), false)).toBe(true);
  });
});
