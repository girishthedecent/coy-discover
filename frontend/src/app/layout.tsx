import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import { TabBar } from '@/components/TabBar';
import './globals.css';

const display = Bricolage_Grotesque({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600', '800'],
});

const body = DM_Sans({
  variable: '--font-body',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Coy - Discover',
  description: 'Discover tab for Coy',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="h-full">
        <div className="bg-paper sm:border-ink mx-auto flex h-dvh max-w-md flex-col sm:border-x-2">
          <main className="relative flex min-h-0 flex-1 flex-col">{children}</main>
          <TabBar />
        </div>
      </body>
    </html>
  );
}
