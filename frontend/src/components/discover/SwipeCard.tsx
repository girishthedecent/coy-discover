'use client';

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useEffect } from 'react';
import type { Profile, SwipeDirection } from '@/lib/types';
import { ProfileCard } from './ProfileCard';

const DISTANCE_THRESHOLD = 110;
const VELOCITY_THRESHOLD = 600;
const MAX_ROTATION = 16;

const rotationFor = (x: number) => Math.max(-1, Math.min(1, x / 300)) * MAX_ROTATION;

type Props = {
  profile: Profile;
  isTop: boolean;
  onSwipe: (profile: Profile, direction: SwipeDirection, fromX: number) => void;
};

export function SwipeCard({ profile, isTop, onSwipe }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, rotationFor);
  const likeOpacity = useTransform(x, [24, DISTANCE_THRESHOLD], [0, 1]);
  const passOpacity = useTransform(x, [-DISTANCE_THRESHOLD, -24], [1, 0]);

  return (
    <motion.div
      className="absolute inset-0 touch-pan-y"
      style={{ x, rotate, zIndex: isTop ? 2 : 1 }}
      initial={false}
      animate={isTop ? { scale: 1, y: 0 } : { scale: 0.94, y: 14 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      drag={isTop ? 'x' : false}
      dragMomentum={false}
      onDragEnd={(_, { offset, velocity }) => {
        if (offset.x > DISTANCE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) {
          onSwipe(profile, 'like', x.get());
        } else if (offset.x < -DISTANCE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) {
          onSwipe(profile, 'pass', x.get());
        } else {
          void animate(x, 0, { type: 'spring', stiffness: 500, damping: 32 });
        }
      }}
      whileDrag={{ cursor: 'grabbing' }}
      aria-hidden={!isTop}
    >
      <ProfileCard profile={profile} />
      <Stamp label="LIKE" className="text-pink top-8 left-6 -rotate-12" opacity={likeOpacity} />
      <Stamp label="NOPE" className="text-ink top-8 right-6 rotate-12" opacity={passOpacity} />
    </motion.div>
  );
}

type FlyingProps = {
  profile: Profile;
  direction: SwipeDirection;
  fromX: number;
  onDone: () => void;
};

// copy of a swiped card that animates off screen, so the next card is usable right away
export function FlyingCard({ profile, direction, fromX, onDone }: FlyingProps) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(fromX);
  const rotate = useTransform(x, rotationFor);

  useEffect(() => {
    if (reduceMotion) {
      onDone();
      return;
    }
    const distance = window.innerWidth * 1.2;
    const controls = animate(x, direction === 'like' ? distance : -distance, {
      duration: 0.3,
      ease: [0.32, 0, 0.67, 0],
    });
    void controls.then(onDone);
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ x, rotate, zIndex: 3 }}
    >
      <ProfileCard profile={profile} />
      {direction === 'like' ? (
        <Stamp label="LIKE" className="text-pink top-8 left-6 -rotate-12" />
      ) : (
        <Stamp label="NOPE" className="text-ink top-8 right-6 rotate-12" />
      )}
    </motion.div>
  );
}

function Stamp({
  label,
  className,
  opacity,
}: {
  label: string;
  className: string;
  opacity?: MotionValue<number>;
}) {
  return (
    <motion.span
      aria-hidden
      style={{ opacity }}
      className={`bg-paper/85 font-display pointer-events-none absolute rounded-xl border-4 border-current px-3 py-1 text-3xl font-extrabold tracking-wider ${className}`}
    >
      {label}
    </motion.span>
  );
}
