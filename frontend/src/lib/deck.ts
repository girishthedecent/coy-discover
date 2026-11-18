import type { Profile } from './types';

export type DeckState = {
  status: 'loading' | 'ready' | 'error';
  cards: Profile[];
  // ids swiped this session, so a stale feed page can't bring them back
  swiped: Set<string>;
  hasMore: boolean;
  error?: string;
};

export type DeckAction =
  | { type: 'loading' }
  | { type: 'loaded'; profiles: Profile[]; hasMore: boolean }
  | { type: 'failed'; error: string }
  | { type: 'swiped'; id: string }
  | { type: 'restore'; profile: Profile }
  | { type: 'reset' };

export const initialDeck: DeckState = {
  status: 'loading',
  cards: [],
  swiped: new Set(),
  hasMore: true,
};

export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case 'loading':
      return { ...state, status: state.cards.length > 0 ? 'ready' : 'loading', error: undefined };

    case 'loaded': {
      const present = new Set(state.cards.map((c) => c.id));
      const fresh = action.profiles.filter((p) => !present.has(p.id) && !state.swiped.has(p.id));
      return {
        ...state,
        status: 'ready',
        cards: [...state.cards, ...fresh],
        hasMore: action.hasMore,
        error: undefined,
      };
    }

    case 'failed':
      return state.cards.length > 0
        ? { ...state, error: action.error }
        : { ...state, status: 'error', error: action.error };

    case 'swiped': {
      const swiped = new Set(state.swiped).add(action.id);
      return { ...state, cards: state.cards.filter((c) => c.id !== action.id), swiped };
    }

    case 'restore': {
      const swiped = new Set(state.swiped);
      swiped.delete(action.profile.id);
      const rest = state.cards.filter((c) => c.id !== action.profile.id);
      return { ...state, cards: [action.profile, ...rest], swiped };
    }

    case 'reset':
      return initialDeck;
  }
}

const REFILL_AT = 3;

// don't auto-retry after an error, wait for the retry button
export function needsRefill(state: DeckState, inFlight: boolean): boolean {
  return (
    !inFlight &&
    !state.error &&
    state.status !== 'error' &&
    state.hasMore &&
    state.cards.length <= REFILL_AT
  );
}
