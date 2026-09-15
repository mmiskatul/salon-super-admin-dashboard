'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession, getSession, type Session } from '@/lib/api-client';
import Header from './Header';
import Rail from './Rail';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);

  const isSignIn = pathname === '/sign-in';

  useEffect(() => {
    if (isSignIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecked(true);
      return;
    }
    const current = getSession();
    if (!current || current.user.role !== 'SUPER_ADMIN') {
      if (current) clearSession();
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
    <div className="flex h-[100dvh] bg-[#F3F4F7] font-manrope overflow-hidden">
      <Rail session={session} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header session={session} />
        <main id="console" className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
