import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/shell/AppShell';
import StoreProvider from '@/lib/redux/StoreProvider';
import QueryProvider from '@/lib/query/QueryProvider';

export const metadata: Metadata = {
  title: 'Platform Console — SalunBD',
  description:
    'Operator console for the SalunBD platform: every shop on the platform, what it has been set up with, and what it is doing.',
  icons: {
    icon: '/salun-icon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router root layout: this <head> is shared by every page */}
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Manrope:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="font-manrope bg-[#F3F4F7] text-[#1E293B] antialiased">
        <a
          href="#console"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#1E293B] focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <QueryProvider>
          <StoreProvider>
            <AppShell>{children}</AppShell>
          </StoreProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
