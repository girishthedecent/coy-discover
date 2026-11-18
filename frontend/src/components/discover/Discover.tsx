'use client';

import { Heart, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { deckReducer, initialDeck, needsRefill } from '@/lib/deck';
import type { Match, Profile, SwipeDirection } from '@/lib/types';
import { EmptyState } from './EmptyState';
import { MatchOverlay } from './MatchOverlay';
import { FlyingCard, SwipeCard } from './SwipeCard';

const PAGE_SIZE = 10;
const MAX_PAGE = 50;

type Feedback = { key: number; text: string; tone: 'like' | 'pass' | 'error' };
type Flying = { key: number; profile: Profile; direction: SwipeDirection; fromX: number };

const messageOf = (err: unknown) =>
  err instanceof Error ? err.message : 'Something went wrong. Please try again.';

export function Discover() {
  const [deck, dispatch] = useReducer(deckReducer, initialDeck);
  const [fetching, setFetching] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [resetting, setResetting] = useState(false);
  const [flying, setFlying] = useState<Flying[]>([]);

  // refs so fast key presses don't swipe the same card twice
  const swipedIds = useRef(new Set<string>());
  const pendingSwipes = useRef(new Set<Promise<unknown>>());
  const loadingFeed = useRef(false);
  const flyingKey = useRef(0);

  // queue in case two swipes match at almost the same time
  const match = matches[0] ?? null;
  const closeMatch = useCallback(() => setMatches((list) => list.slice(1)), []);

  const loadMore = useCallback(async (have: number) => {
    if (loadingFeed.current) return;
    loadingFeed.current = true;
    setFetching(true);
    dispatch({ type: 'loading' });
    try {
      // unsaved swipes still come back from the server, so ask for a few more
      const limit = Math.min(have + pendingSwipes.current.size + PAGE_SIZE, MAX_PAGE);
      const feed = await api.feed(limit);
      dispatch({ type: 'loaded', profiles: feed.profiles, hasMore: feed.hasMore });
    } catch (err) {
      dispatch({ type: 'failed', error: messageOf(err) });
    } finally {
      loadingFeed.current = false;
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (needsRefill(deck, loadingFeed.current)) void loadMore(deck.cards.length);
  }, [deck, loadMore]);

  const showFeedback = useCallback((text: string, tone: Feedback['tone']) => {
    setFeedback({ key: Date.now(), text, tone });
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), feedback.tone === 'error' ? 3000 : 1300);
    return () => clearTimeout(timer);
  }, [feedback]);

  const commitSwipe = useCallback(
    async (profile: Profile, direction: SwipeDirection, fromX = 0) => {
      if (swipedIds.current.has(profile.id)) return;
      swipedIds.current.add(profile.id);
      dispatch({ type: 'swiped', id: profile.id });
      setFlying((cards) => [...cards, { key: ++flyingKey.current, profile, direction, fromX }]);
      showFeedback(
        direction === 'like' ? `You liked ${profile.name}` : `Passed on ${profile.name}`,
        direction,
      );
      const request = api.swipe(profile.id, direction);
      pendingSwipes.current.add(request);
      try {
        const result = await request;
        if (result.matched) setMatches((list) => [...list, result.match]);
      } catch (err) {
        // already swiped / deleted, nothing to undo
        if (err instanceof ApiError && (err.status === 409 || err.status === 404)) return;
        swipedIds.current.delete(profile.id);
        dispatch({ type: 'restore', profile });
        showFeedback(`Couldn't save that swipe. ${messageOf(err)}`, 'error');
      } finally {
        pendingSwipes.current.delete(request);
      }
    },
    [showFeedback],
  );

  const swipeTop = useCallback(
    (direction: SwipeDirection) => {
      if (match) return;
      const top = deck.cards.find((card) => !swipedIds.current.has(card.id));
      if (top) void commitSwipe(top, direction);
    },
    [deck.cards, match, commitSwipe],
  );

  // arrow keys on desktop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') swipeTop('like');
      else if (e.key === 'ArrowLeft') swipeTop('pass');
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [swipeTop]);

  async function startOver() {
    setResetting(true);
    try {
      // let pending swipes finish first
      await Promise.allSettled(pendingSwipes.current);
      await api.resetDemo();
      swipedIds.current.clear();
      dispatch({ type: 'reset' });
    } catch (err) {
      const text =
        err instanceof ApiError && err.status === 404
          ? 'Starting over is turned off on this server.'
          : messageOf(err);
      showFeedback(text, 'error');
    } finally {
      setResetting(false);
    }
  }

  const visible = deck.cards.slice(0, 2);
  const empty = deck.status === 'ready' && deck.cards.length === 0;
  const done = empty && !deck.hasMore && !fetching && !deck.error;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between px-5">
        <h1 className="font-display text-2xl font-extrabold">
          coy<span className="text-pink">.</span>{' '}
          <span className="text-muted font-semibold">discover</span>
        </h1>
        <Link
          href="/discover/matches"
          className="border-ink bg-pink-soft shadow-hard-sm inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-bold"
        >
          <Heart aria-hidden size={16} className="fill-pink text-pink" />
          Matches
        </Link>
      </header>

      <div className="relative min-h-0 flex-1 px-4 pt-1">
        <div className="relative h-full">
          {deck.status === 'loading' && <CardSkeleton />}

          {deck.status === 'error' && (
            <ErrorCard message={deck.error} onRetry={() => void loadMore(0)} />
          )}

          {deck.status === 'ready' &&
            empty &&
            !done &&
            (deck.error ? (
              <ErrorCard message={deck.error} onRetry={() => void loadMore(0)} />
            ) : (
              <CardSkeleton />
            ))}

          {done && <EmptyState onStartOver={() => void startOver()} resetting={resetting} />}

          {[...visible].reverse().map((profile) => {
            const isTop = profile.id === visible[0]?.id;
            return (
              <SwipeCard key={profile.id} profile={profile} isTop={isTop} onSwipe={commitSwipe} />
            );
          })}

          {flying.map((card) => (
            <FlyingCard
              key={card.key}
              profile={card.profile}
              direction={card.direction}
              fromX={card.fromX}
              onDone={() => setFlying((cards) => cards.filter((c) => c.key !== card.key))}
            />
          ))}
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.p
              key={feedback.key}
              role="status"
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              className={`border-ink shadow-hard-sm pointer-events-none absolute inset-x-0 top-3 z-20 mx-auto w-fit max-w-[85%] rounded-full border-2 px-4 py-1.5 text-center text-sm font-bold ${
                feedback.tone === 'like'
                  ? 'bg-pink text-paper'
                  : feedback.tone === 'pass'
                    ? 'bg-paper text-ink'
                    : 'bg-sun text-ink'
              }`}
            >
              {feedback.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex h-28 shrink-0 flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-8">
          <ActionButton
            label="Pass"
            onClick={() => swipeTop('pass')}
            disabled={deck.cards.length === 0}
            className="bg-paper text-ink"
          >
            <X aria-hidden size={30} strokeWidth={3} />
          </ActionButton>
          <ActionButton
            label="Like"
            onClick={() => swipeTop('like')}
            disabled={deck.cards.length === 0}
            className="bg-pink text-paper"
          >
            <Heart aria-hidden size={28} strokeWidth={2.5} className="fill-paper" />
          </ActionButton>
        </div>
        <p className="text-muted hidden text-xs sm:block">Drag the card or use the arrow keys</p>
      </div>

      <AnimatePresence>
        {match && <MatchOverlay key={match.id} match={match} onClose={closeMatch} />}
      </AnimatePresence>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.06 }}
      className={`border-ink shadow-hard flex size-16 items-center justify-center rounded-full border-2 transition-opacity disabled:opacity-40 ${className}`}
    >
      {children}
    </motion.button>
  );
}

function CardSkeleton() {
  return (
    <div
      aria-label="Loading profiles"
      className="border-ink/20 flex h-full animate-pulse flex-col overflow-hidden rounded-[28px] border-2"
    >
      <div className="bg-lavender flex-1" />
      <div className="space-y-3 p-5">
        <div className="bg-lavender h-7 w-1/2 rounded-lg" />
        <div className="bg-lavender h-4 w-2/3 rounded-lg" />
        <div className="bg-lavender h-4 w-full rounded-lg" />
      </div>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="border-ink bg-sun/40 flex h-full flex-col items-center justify-center rounded-[28px] border-2 px-8 text-center">
      <h2 className="font-display text-xl font-extrabold">Couldn&apos;t load profiles</h2>
      <p className="text-muted mt-2 text-sm">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="border-ink bg-paper shadow-hard-sm mt-6 rounded-full border-2 px-6 py-2.5 font-bold"
      >
        Try again
      </button>
    </div>
  );
}
