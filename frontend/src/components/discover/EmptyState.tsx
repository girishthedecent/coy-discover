import { RotateCcw } from 'lucide-react';
import Link from 'next/link';

export function EmptyState({
  onStartOver,
  resetting,
}: {
  onStartOver: () => void;
  resetting: boolean;
}) {
  return (
    <div className="border-ink/40 bg-lavender flex h-full flex-col items-center justify-center rounded-[28px] border-2 border-dashed px-8 text-center">
      <span aria-hidden className="text-6xl">
        🌙
      </span>
      <h2 className="font-display mt-4 text-2xl font-extrabold">You&apos;re all caught up</h2>
      <p className="text-muted mt-2">
        You&apos;ve seen everyone for now. New people show up here as they join.
      </p>
      <div className="mt-8 flex w-full max-w-60 flex-col gap-3">
        <Link
          href="/discover/matches"
          className="border-ink bg-pink text-paper shadow-hard active:shadow-hard-sm rounded-full border-2 py-3 font-bold transition-transform active:translate-x-0.5 active:translate-y-0.5"
        >
          See your matches
        </Link>
        <button
          type="button"
          onClick={onStartOver}
          disabled={resetting}
          className="text-muted inline-flex items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold underline-offset-4 hover:underline disabled:opacity-50"
        >
          <RotateCcw aria-hidden size={14} />
          {resetting ? 'Starting over...' : 'Start over (demo)'}
        </button>
      </div>
    </div>
  );
}
