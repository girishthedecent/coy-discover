export type Profile = {
  id: string;
  name: string;
  age: number;
  bio: string;
  city: string;
  college: string | null;
  photoUrl: string;
  interests: string[];
};

export type Match = {
  id: string;
  matchedAt: string;
  profile: Profile;
};

export type Feed = { profiles: Profile[]; hasMore: boolean };

export type SwipeDirection = 'like' | 'pass';

export type SwipeResult = { matched: false } | { matched: true; match: Match };
