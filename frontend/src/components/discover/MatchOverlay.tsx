'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { Match } from '@/lib/types';

const FLOATING_HEARTS = ['💘', '💗', '✨', '💖', '💕', '✨', '💗'];

export function MatchOverlay({ match, onClose }: { match: Match; onClose: () => void }) {
  const keepSwiping = useRef<HTMLButtonElement>(null);
  const { profile } = match;

  useEffect(() => {
    keepSwiping.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      className="bg-pink text-paper absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {FLOATING_HEARTS.map((heart, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute text-3xl"
          style={{ left: `${8 + i * 13}%` }}
          initial={{ y: '60vh', opacity: 0 }}
          animate={{ y: '-60vh', opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.6, delay: i * 0.15, ease: 'easeOut' }}
        >
          {heart}
        </motion.span>
      ))}

      <motion.div
        className="flex items-center"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
      >
        <span className="border-ink bg-sun font-display text-ink shadow-hard z-10 flex size-24 items-center justify-center rounded-full border-[3px] text-2xl font-extrabold">
          You
        </span>
        <span className="border-ink bg-paper shadow-hard-sm z-20 -mx-3 flex size-12 items-center justify-center rounded-full border-[3px] text-2xl">
          💘
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.photoUrl}
          alt=""
          className="border-ink bg-lavender shadow-hard z-10 size-24 rounded-full border-[3px] object-cover"
        />
      </motion.div>

      <motion.h2
        id="match-title"
        className="font-display mt-8 text-5xl font-extrabold tracking-tight"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        It&apos;s a match!
      </motion.h2>
      <p className="mt-3 text-lg">You and {profile.name} liked each other.</p>

      <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/discover/matches"
          className="border-ink bg-paper text-ink shadow-hard active:shadow-hard-sm rounded-full border-2 py-3.5 font-bold transition-transform active:translate-x-0.5 active:translate-y-0.5"
        >
          See your matches
        </Link>
        <button
          ref={keepSwiping}
          type="button"
          onClick={onClose}
          className="border-paper text-paper rounded-full border-2 py-3.5 font-bold"
        >
          Keep swiping
        </button>
      </div>
    </motion.div>
  );
}
