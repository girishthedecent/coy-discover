'use client';

import { ArrowLeft, Heart } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Match } from '@/lib/types';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; matches: Match[] };

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function matchedAgo(iso: string, now = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

export function MatchesList() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const { matches } = await api.matches();
      setState({ status: 'ready', matches });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Failed to load' });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 px-3">
        <Link
          href="/discover"
          aria-label="Back to Discover"
          className="hover:bg-lavender flex size-10 items-center justify-center rounded-full"
        >
          <ArrowLeft aria-hidden size={22} />
        </Link>
        <h1 className="font-display text-2xl font-extrabold">Matches</h1>
        {state.status === 'ready' && state.matches.length > 0 && (
          <span className="border-ink bg-pink-soft mr-2 ml-auto rounded-full border-2 px-2.5 text-sm font-bold">
            {state.matches.length}
          </span>
        )}
      </header>

      <p className="text-muted px-5 pb-3 text-sm">
        Only people who liked you back show up here. One-sided likes stay secret, both ways.
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {state.status === 'loading' && (
          <ul aria-label="Loading matches" className="space-y-3">
            {[0, 1, 2].map((i) => (
              <li key={i} className="bg-lavender h-20 animate-pulse rounded-2xl" />
            ))}
          </ul>
        )}

        {state.status === 'error' && (
          <div className="border-ink bg-sun/40 rounded-2xl border-2 p-6 text-center">
            <p className="font-bold">Couldn&apos;t load your matches</p>
            <p className="text-muted mt-1 text-sm">{state.message}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="border-ink bg-paper shadow-hard-sm mt-4 rounded-full border-2 px-5 py-2 font-bold"
            >
              Try again
            </button>
          </div>
        )}

        {state.status === 'ready' && state.matches.length === 0 && (
          <div className="bg-lavender flex flex-col items-center rounded-[28px] px-8 py-12 text-center">
            <Heart aria-hidden size={40} className="text-pink" />
            <h2 className="font-display mt-3 text-xl font-extrabold">No matches yet</h2>
            <p className="text-muted mt-1 text-sm">
              When someone you like likes you back, they&apos;ll appear here.
            </p>
            <Link
              href="/discover"
              className="border-ink bg-pink text-paper shadow-hard-sm mt-6 rounded-full border-2 px-6 py-2.5 font-bold"
            >
              Keep swiping
            </Link>
          </div>
        )}

        {state.status === 'ready' && state.matches.length > 0 && (
          <ul className="space-y-3">
            {state.matches.map(({ id, matchedAt, profile }) => (
              <li
                key={id}
                className="border-ink bg-paper shadow-hard-sm flex items-center gap-4 rounded-2xl border-2 p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.photoUrl}
                  alt=""
                  className="border-ink bg-lavender size-16 shrink-0 rounded-full border-2 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display truncate text-lg font-extrabold">
                    {profile.name} <span className="text-muted font-semibold">{profile.age}</span>
                  </p>
                  <p className="text-muted truncate text-sm">
                    {[profile.city, profile.college].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-pink mt-0.5 text-xs font-semibold">
                    Matched {matchedAgo(matchedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
