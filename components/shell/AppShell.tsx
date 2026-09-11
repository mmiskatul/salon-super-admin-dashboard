'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession, type Session } from '@/lib/api-client';
import Rail from './Rail';

/**
 * The console frame, and the gate in front of it.
 *
 * The session check lives here rather than in each page so there is exactly one place that can
 * decide whether a screen renders. Two states are deliberately distinct: `checking` renders
 * nothing at all (a flash of the roster before a redirect is worse than a blank moment), while a
 * confirmed missing session redirects rather than showing an error, because there is nothing the
 * operator could do with an error at that point except go and sign in.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);

  const isSignIn = pathname === '/sign-in';

  useEffect(() => {
    if (isSignIn) {
      // The session lives in localStorage, which cannot be read during render without a
      // hydration mismatch, so reading it in an effect and recording the result is the only
      // correct order here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecked(true);
      return;
    }
    const current = getSession();
    if (!current) {
      router.replace('/sign-in');
      return;
    }
    setSession(current);
    setChecked(true);
  }, [isSignIn, pathname, router]);

  // Sign-in renders full-bleed, with none of the console chrome around it.
  if (isSignIn) return <>{children}</>;

  if (!checked || !session) return null;

  return (
    <div className="min-h-screen lg:flex">
      <Rail session={session} />
      <main id="console" className="min-w-0 flex-1 pb-16">
        {children}
      </main>
    </div>
  );
}
