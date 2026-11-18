import type { Metadata } from 'next';
import { Discover } from '@/components/discover/Discover';

export const metadata: Metadata = { title: 'Discover - Coy' };

export default function DiscoverPage() {
  return <Discover />;
}
