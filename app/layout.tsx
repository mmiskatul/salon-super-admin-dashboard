import type { Metadata } from 'next';
import { Bricolage_Grotesque, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/shell/AppShell';

/**
 * Three faces, each with a job.
 *
 * Bricolage carries headings and the big figures — a grotesque with enough character to give the
 * console a voice without a display serif's formality. Inter Tight is the reading face, chosen
 * narrow because these screens are dense tables. JetBrains Mono is not decorative: every
 * identifier, count, timestamp and money figure is set in it so uuids can be read character by
 * character and numeric columns line up down the page.
 */
const display = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
});

const body = Inter_Tight({
  variable: '--font-inter-tight',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

const data = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Platform console — SalunBD',
  description:
    'Operator console for the SalunBD platform: every shop on the platform, what it has been set up with, and what it is doing.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable} ${data.variable}`}>
      <body suppressHydrationWarning>
        <a
          href="#console"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
