'use client';

import { Compass, House } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Home', icon: House, isActive: (path: string) => path === '/' },
  {
    href: '/discover',
    label: 'Discover',
    icon: Compass,
    isActive: (path: string) => path.startsWith('/discover'),
  },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="border-ink bg-paper border-t-2 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-2">
        {TABS.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors ${
                  active ? 'text-pink' : 'text-muted hover:text-ink'
                }`}
              >
                <Icon aria-hidden size={22} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
