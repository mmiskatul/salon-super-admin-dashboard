'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BadgeEuro,
  CalendarRange,
  CreditCard,
  Gauge,
  LifeBuoy,
  LogOut,
  type LucideIcon,
  Megaphone,
  Menu,
  Network,
  Scissors,
  Store,
  Tag,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { logout, type Session } from '@/lib/api-client';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Grouped by the question the operator is asking, not by which service answers it. Someone
 * chasing a payment does not know or care that transactions live in service-payment while the
 * appointment they belong to lives in service-booking.
 */
const GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Platform',
    items: [
      { href: '/', label: 'Overview', icon: Gauge },
      { href: '/shops', label: 'Shops', icon: Store },
      { href: '/barbers', label: 'Independent barbers', icon: Scissors },
      { href: '/users', label: 'Users & accounts', icon: Users },
    ],
  },
  {
    heading: 'Activity',
    items: [
      { href: '/bookings', label: 'Bookings', icon: CalendarRange },
      { href: '/payments', label: 'Payments', icon: BadgeEuro },
      { href: '/coupons', label: 'Coupons & offers', icon: Tag },
      { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { href: '/metrics', label: 'Metrics', icon: TrendingUp },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { href: '/broadcasts', label: 'Broadcasts', icon: Megaphone },
      { href: '/support', label: 'Support', icon: LifeBuoy },
      { href: '/system', label: 'API coverage', icon: Network },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Rail({ session }: { session: Session }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await logout();
    router.replace('/sign-in');
  }

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="px-5 pt-6 pb-7">
        <Link href="/" className="block" onClick={() => setOpen(false)}>
          <span className="font-display text-[19px] leading-none font-extrabold tracking-[-0.02em] text-white">
            SalunBD
          </span>
          <span className="eyebrow mt-2 block !text-white/40">Platform console</span>
        </Link>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto px-3">
        {GROUPS.map((group) => (
          <div key={group.heading}>
            <p className="eyebrow px-2 pb-2 !text-white/30">{group.heading}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-2.5 rounded-[3px] px-2 py-[7px] text-[13px] transition-colors ${
                        active
                          ? 'bg-white/[0.11] font-semibold text-white'
                          : 'font-normal text-white/55 hover:bg-white/[0.05] hover:text-white/90'
                      }`}
                    >
                      {/* The active marker is a rule, not a pill: it lines up with the hairlines
                          that separate every panel in the canvas, so the rail reads as part of
                          the same grid rather than as a floating widget. */}
                      <span
                        aria-hidden
                        className={`h-3.5 w-px ${active ? 'bg-white' : 'bg-transparent'}`}
                      />
                      <Icon size={14} strokeWidth={active ? 2.2 : 1.7} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-white/10 px-5 py-4">
        <p className="tabular truncate text-[11px] text-white/45" title={session.user.email}>
          {session.user.email}
        </p>
        <p className="eyebrow mt-1 !text-white/30">Super admin</p>
        <button
          type="button"
          onClick={signOut}
          className="mt-3 flex items-center gap-1.5 text-[12px] text-white/55 transition-colors hover:text-white"
        >
          <LogOut size={12} strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-rule bg-surface px-4 py-3 lg:hidden">
        <Link href="/" className="font-display text-[16px] font-extrabold tracking-[-0.02em]">
          SalunBD
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-[12px] text-ink-2"
          aria-label="Open navigation"
        >
          <Menu size={16} strokeWidth={1.8} />
          Menu
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/50"
          />
          <div className="absolute inset-y-0 left-0 w-[248px] bg-ink">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute top-5 right-4 text-white/50 hover:text-white"
            >
              <X size={16} />
            </button>
            {nav}
          </div>
        </div>
      )}

      <aside className="sticky top-0 hidden h-screen w-[224px] shrink-0 bg-ink lg:block">{nav}</aside>
    </>
  );
}
