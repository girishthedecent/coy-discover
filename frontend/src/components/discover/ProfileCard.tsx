import { GraduationCap, MapPin } from 'lucide-react';
import type { Profile } from '@/lib/types';

export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <article className="border-ink bg-paper shadow-hard flex h-full flex-col overflow-hidden rounded-[28px] border-2 select-none">
      <div className="bg-lavender relative min-h-0 flex-1 overflow-hidden">
        {/* blurred copy behind so the image never looks cropped */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.photoUrl}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full scale-150 object-cover blur-2xl"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.photoUrl}
          alt={`Photo of ${profile.name}`}
          draggable={false}
          className="pointer-events-none relative h-full w-full object-contain"
        />
      </div>

      <div className="border-ink shrink-0 space-y-2 border-t-2 px-5 pt-4 pb-5">
        <h2 className="font-display text-[28px] leading-none font-extrabold">
          {profile.name}
          <span className="text-muted ml-2 font-semibold">{profile.age}</span>
        </h2>

        <p className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden size={14} />
            {profile.city}
          </span>
          {profile.college && (
            <span className="inline-flex items-center gap-1">
              <GraduationCap aria-hidden size={15} />
              {profile.college}
            </span>
          )}
        </p>

        <p className="line-clamp-3 text-[15px] leading-snug">{profile.bio}</p>

        <ul aria-label="Interests" className="flex flex-wrap gap-1.5 pt-1">
          {profile.interests.map((interest) => (
            <li
              key={interest}
              className="border-ink bg-pink-soft rounded-full border-[1.5px] px-2.5 py-0.5 text-xs font-semibold"
            >
              {interest}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
