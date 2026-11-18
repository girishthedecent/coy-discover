import type { Metadata } from 'next';
import { MatchesList } from '@/components/matches/MatchesList';

export const metadata: Metadata = { title: 'Matches - Coy' };

export default function MatchesPage() {
  return <MatchesList />;
}
