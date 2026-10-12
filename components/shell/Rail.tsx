'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Award,
  BadgeEuro,
  Briefcase,
  CalendarCheck,
  CalendarRange,
  ClipboardCheck,
  Flag,
  Gauge,
  History,
  LifeBuoy,
  LogOut,
  MapPinned,
  type LucideIcon,
  Megaphone,
  Menu,
  Scale,
  Scissors,
  Server,
  ShieldAlert,
  Sprout,
  Store,
  Tag,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { logout, type Session } from '@/lib/api-client';
import { useApi } from '@/lib/useApi';
import { getNavCounts, type NavCounts } from '@/lib/api/insights';
import { SalunIcon } from '@/components/brand/SalunLogo';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** One line on what the page is for (shown on hover). */
  hint: string;
  /** A live count from /admin/insights/nav-counts, shown as a badge when above zero. */
  badge?: keyof NavCounts;
}

/**
 * Grouped by the question the operator is asking, not by which service answers it: how is the
 * platform doing, who is on it, which shops are live, what is being booked, where the money is,
 * what needs moderating, and the admin back office.
 */
const GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Command centre',
    items: [
      { href: '/', label: 'Overview', icon: Gauge, hint: 'The whole system on one page' },
      { href: '/system', label: 'System health', icon: Server, hint: 'Database, Redis, speed, errors and background jobs' },
    ],
  },
  {
    heading: 'People',
    items: [
      { href: '/users', label: 'All accounts', icon: Users, hint: 'Every customer, shop owner, barber and admin' },
      { href: '/growth', label: 'Customers & growth', icon: Sprout, hint: 'Sign-ups, active users, push reach and referrals' },
      { href: '/owners', label: 'Shop owners', icon: Briefcase, hint: 'Each owner and their shop dashboard' },
      { href: '/barbers', label: 'Barbers & stylists', icon: Scissors, hint: 'Shop barbers and independent barbers' },
    ],
  },
  {
    heading: 'Shops',
    items: [
      { href: '/shops', label: 'Shops', icon: Store, hint: 'Every shop: details, team, bookings and insights' },
      { href: '/readiness', label: 'Shop readiness', icon: ClipboardCheck, hint: 'Who is hidden from customers and what they are missing', badge: 'hiddenListings' },
      { href: '/map', label: 'Supply & demand map', icon: MapPinned, hint: 'Where shops are and where customers are' },
    ],
  },
  {
    heading: 'Bookings',
    items: [
      { href: '/bookings', label: 'Bookings', icon: CalendarRange, hint: 'Every booking, charts, and who cancelled when and why', badge: 'bookingsWaiting' },
      { href: '/booking-quality', label: 'Booking quality', icon: CalendarCheck, hint: 'Acceptance speed, punctuality, strikes and busy hours' },
    ],
  },
  {
    heading: 'Money',
    items: [
      { href: '/money', label: 'Money overview', icon: Wallet, hint: 'Cash per day and shop, coupons, gift cards and balances' },
      { href: '/payments', label: 'Payments', icon: BadgeEuro, hint: 'Every payment recorded by the shops' },
      { href: '/coupons', label: 'Coupons & offers', icon: Tag, hint: 'Platform and shop coupons' },
      { href: '/loyalty', label: 'Loyalty & rewards', icon: Award, hint: 'Points rules and reward tiers' },
    ],
  },
  {
    heading: 'Trust & support',
    items: [
      { href: '/safety', label: 'Trust & safety', icon: ShieldAlert, hint: 'Repeat offenders, blocks, bans, low ratings and chat speed' },
      { href: '/reports', label: 'Reports', icon: Flag, hint: 'Reported reviews, messages, photos and accounts', badge: 'openReports' },
      { href: '/support', label: 'Support', icon: LifeBuoy, hint: 'Support tickets from the apps', badge: 'openTickets' },
      { href: '/broadcasts', label: 'Broadcasts', icon: Megaphone, hint: 'Send a notification to everyone or a group' },
    ],
  },
  {
    heading: 'Admin',
    items: [
      { href: '/legal', label: 'Legal pages', icon: Scale, hint: 'Privacy policy, terms and account deletion pages' },
      { href: '/audit-log', label: 'Audit log', icon: History, hint: 'Everything admins have done' },
      { href: '/metrics', label: 'Custom metrics', icon: TrendingUp, hint: 'Record and chart your own numbers' },
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
  const counts = useApi(getNavCounts, [], 'nav-counts');
  const { refresh: refreshCounts } = counts;
  // Badges stay current while the console is open.
  useEffect(() => {
    const t = setInterval(() => void refreshCounts(), 60_000);
    return () => clearInterval(t);
  }, [refreshCounts]);

  async function signOut() {
    await logout();
    router.replace('/sign-in');
  }

  const nav = (
    <nav className="flex h-full flex-col font-manrope bg-white">
      <div className="p-5 sticky top-0 bg-white z-10 flex justify-between items-center border-b border-[#E2E8F0]">
        <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 shrink-0 group-hover:scale-105 transition-transform duration-200">
            <SalunIcon size={32} />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight font-manrope text-[#1E293B]">
              Salun<span className="text-[#635BFF]">BD</span>
            </span>
            <span className="block text-[10px] font-bold tracking-wider uppercase text-[#635BFF] -mt-0.5">
              Super Admin
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 custom-scrollbar">
        {GROUPS.map((group) => (
          <div key={group.heading}>
            <p className="px-3 text-xs font-bold text-[#94A3B8] mb-2 uppercase tracking-wider font-manrope">
              {group.heading}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.hint}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                        active
                          ? 'bg-[#635BFF] text-white shadow-md shadow-[#635BFF]/20 font-bold'
                          : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[#94A3B8]'}`} />
                      <span className="truncate">{item.label}</span>
                      {item.badge && (counts.data?.[item.badge] ?? 0) > 0 && (
                        <span
                          className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${active ? 'bg-white text-[#635BFF]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}
                          aria-label={`${counts.data?.[item.badge]} need attention`}>
                          {counts.data?.[item.badge]}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#EEF2FF] text-[#635BFF] flex items-center justify-center font-bold text-sm border border-[#CBD5E1] shrink-0">
            {session.user.name ? session.user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-[#1E293B] truncate" title={session.user.name || 'Super Admin'}>
              {session.user.name || 'Super Admin'}
            </p>
            <p className="text-[11px] text-[#64748B] truncate" title={session.user.email}>
              {session.user.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-[12px] font-bold text-[#EF4444] bg-white border border-[#FECACA] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E2E8F0] bg-white px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <SalunIcon size={26} />
          <span className="font-extrabold text-[17px] tracking-tight font-manrope text-[#1E293B]">
            Salun<span className="text-[#635BFF]">BD</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC]"
          aria-label="Open navigation"
        >
          <Menu size={16} />
          Menu
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[#1E293B]/50 backdrop-blur-xs"
          />
          <div className="absolute inset-y-0 left-0 w-[260px] border-r border-[#E2E8F0] bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute top-5 right-4 text-[#94A3B8] hover:text-[#1E293B]"
            >
              <X size={18} />
            </button>
            {nav}
          </div>
        </div>
      )}

      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-[#E2E8F0] bg-white lg:block">
        {nav}
      </aside>
    </>
  );
}
