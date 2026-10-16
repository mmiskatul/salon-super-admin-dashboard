'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  RotateCw,
  Search,
  Download,
  Calendar,
  Clock,
  Users,
  User,
  Smartphone,
  Globe,
  ShieldCheck,
  Activity,
  TrendingUp,
  Sparkles,
  LogIn,
  Crown,
  Store,
  Scissors,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowUpDown,
  Flame,
  Radio,
  X,
  ExternalLink,
  Laptop,
  CheckCircle2,
  Filter,
  Sun,
  Sunrise,
  Sunset,
  Moon,
} from 'lucide-react';
import { useApi } from '@/lib/useApi';
import {
  getLogins,
  LOGIN_METHOD_LABELS,
  LOGIN_ROLE_COLORS,
  LOGIN_ROLE_LABELS,
  PLATFORM_LABELS,
  type InsightDays,
  type LoginMethod,
  type LoginRole,
  type ActivePerson,
} from '@/lib/api/insights';
import { count, date, initials, since } from '@/lib/format';
import { Badge, Button, Canvas, Empty, Failed, Loading, PageHead, Panel, Stat } from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { Bars, Columns, DaysPicker, Donut, Heatmap, StackedColumns } from '@/components/insights/Bits';

const ROLES = Object.keys(LOGIN_ROLE_LABELS) as LoginRole[];
const ROLE_ONE: Record<string, string> = {
  CUSTOMER: 'Customer',
  BARBER: 'Barber',
  OWNER: 'Shop Owner',
  STAFF: 'Staff Barber',
  SUPER_ADMIN: 'Super Admin',
};

const METHOD_COLORS: Record<string, string> = {
  PASSWORD: '#635BFF',
  GOOGLE: '#16A34A',
};

const PLATFORM_COLORS: Record<string, string> = {
  ANDROID: '#16A34A',
  IOS: '#0F172A',
  WEB: '#0EA5E9',
  UNKNOWN: '#94A3B8',
};

/** Times on this page are Bangladesh time (BST / UTC+6). */
function bdTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Dhaka',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function bdDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return `${d.toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short' })}, ${bdTime(value)}`;
}

/** "12 Oct" from a YYYY-MM-DD day. */
function dayLabel(day: string): string {
  if (!day) return '—';
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
  });
}

function dayLong(day: string, today: string): string {
  if (!day) return '—';
  const label = new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  if (day === today) return `Today (${label})`;
  const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  return day === yesterday ? `Yesterday (${label})` : label;
}

function change(now: number, before: number): string {
  if (!before) return now ? 'none yesterday' : 'same as yesterday';
  const diff = now - before;
  if (!diff) return 'same as yesterday';
  return `${diff > 0 ? '+' : ''}${diff} vs yesterday (${before})`;
}

const hourLabel = (h: number) => (h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`);

/** Custom role badge */
function RoleBadge({ role }: { role?: string }) {
  const norm = (role || '').toUpperCase();
  switch (norm) {
    case 'SUPER_ADMIN':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#EDE9FE] px-2 py-0.5 text-[11px] font-extrabold text-[#6D28D9] border border-[#DDD6FE]">
          <Crown className="h-3 w-3" />
          Admin
        </span>
      );
    case 'OWNER':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#E0F2FE] px-2 py-0.5 text-[11px] font-extrabold text-[#0369A1] border border-[#BAE6FD]">
          <Store className="h-3 w-3" />
          Owner
        </span>
      );
    case 'STAFF':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-extrabold text-[#15803D] border border-[#BBF7D0]">
          <Scissors className="h-3 w-3" />
          Staff
        </span>
      );
    case 'BARBER':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-extrabold text-[#B45309] border border-[#FDE68A]">
          <Scissors className="h-3 w-3" />
          Barber
        </span>
      );
    case 'CUSTOMER':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#EEF2FF] px-2 py-0.5 text-[11px] font-extrabold text-[#4338CA] border border-[#E0E7FF]">
          <User className="h-3 w-3" />
          Customer
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-semibold text-[#64748B] border border-[#E2E8F0]">
          {role || 'Unknown'}
        </span>
      );
  }
}

/** Device platform icon */
function PlatformIcon({ platform }: { platform?: string | null }) {
  const p = (platform || '').toUpperCase();
  if (p === 'ANDROID') return <Smartphone className="h-3.5 w-3.5 text-[#16A34A]" />;
  if (p === 'IOS') return <Smartphone className="h-3.5 w-3.5 text-[#0F172A]" />;
  if (p === 'WEB') return <Globe className="h-3.5 w-3.5 text-[#0EA5E9]" />;
  return <Laptop className="h-3.5 w-3.5 text-[#94A3B8]" />;
}

interface AggregatedPoint {
  label: string;
  subLabel?: string;
  byRole: Record<string, number>;
  returning: number;
  newUsers: number;
  total: number;
  dateKey?: string;
}

function computeChartSeries(
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly',
  d: any
): AggregatedPoint[] {
  if (granularity === 'hourly') {
    // 24 hours of d.day
    if (d.day.byHour && d.day.byHour.length === 24) {
      return d.day.byHour.map((h: any) => ({
        label: h.label,
        byRole: h.byRole,
        returning: h.returning,
        newUsers: h.newUsers,
        total: h.active,
      }));
    }
    // Fallback if byHour is not yet available
    return Array.from({ length: 24 }, (_, h) => {
      const lbl = hourLabel(h);
      const val = d.day.signInHours?.[h] || 0;
      return {
        label: lbl,
        byRole: { CUSTOMER: val },
        returning: val,
        newUsers: 0,
        total: val,
      };
    });
  }

  if (granularity === 'weekly') {
    // Chunk d.series into 7-day week intervals
    const chunks: AggregatedPoint[] = [];
    const series = d.series;
    const chunkSize = 7;
    for (let i = 0; i < series.length; i += chunkSize) {
      const weekDays = series.slice(i, i + chunkSize);
      const first = weekDays[0];
      const last = weekDays[weekDays.length - 1];
      const weekNum = Math.floor(i / chunkSize) + 1;
      const label = `W${weekNum} (${dayLabel(first.day)}${first.day !== last.day ? `–${dayLabel(last.day)}` : ''})`;

      const byRole: Record<string, number> = {};
      let returning = 0;
      let newUsers = 0;
      let total = 0;

      for (const day of weekDays) {
        returning += day.returning;
        newUsers += day.newUsers;
        total += day.active;
        for (const [r, cnt] of Object.entries(day.byRole as Record<string, number>)) {
          byRole[r] = (byRole[r] || 0) + cnt;
        }
      }

      chunks.push({
        label,
        subLabel: `${dayLabel(first.day)} to ${dayLabel(last.day)}`,
        byRole,
        returning,
        newUsers,
        total,
        dateKey: last.day,
      });
    }
    return chunks;
  }

  if (granularity === 'monthly') {
    // Group d.series by month (YYYY-MM)
    const monthMap = new Map<string, { days: any[]; monthName: string }>();
    for (const day of d.series) {
      const ym = day.day.slice(0, 7); // "YYYY-MM"
      if (!monthMap.has(ym)) {
        const dObj = new Date(`${day.day}T00:00:00Z`);
        const monthName = dObj.toLocaleDateString('en-GB', {
          timeZone: 'UTC',
          month: 'short',
          year: d.series.length > 200 ? '2-digit' : undefined,
        });
        monthMap.set(ym, { days: [], monthName });
      }
      monthMap.get(ym)!.days.push(day);
    }

    const points: AggregatedPoint[] = [];
    for (const [ym, { days: monthDays, monthName }] of monthMap.entries()) {
      const byRole: Record<string, number> = {};
      let returning = 0;
      let newUsers = 0;
      let total = 0;

      for (const day of monthDays) {
        returning += day.returning;
        newUsers += day.newUsers;
        total += day.active;
        for (const [r, cnt] of Object.entries(day.byRole as Record<string, number>)) {
          byRole[r] = (byRole[r] || 0) + cnt;
        }
      }

      points.push({
        label: monthName,
        subLabel: ym,
        byRole,
        returning,
        newUsers,
        total,
        dateKey: monthDays[monthDays.length - 1].day,
      });
    }
    return points;
  }

  // Default: daily (d.series)
  return d.series.map((s: any) => ({
    label: dayLabel(s.day),
    byRole: s.byRole,
    returning: s.returning,
    newUsers: s.newUsers,
    total: s.active,
    dateKey: s.day,
  }));
}

/** 24-Hour Sign-in Traffic breakdown for the selected day */
function HourlyTraffic24h({
  hours,
  totalSignIns,
  activePeople,
  peakHour,
}: {
  hours: number[];
  totalSignIns: number;
  activePeople: number;
  peakHour: { hour: number; count: number; label: string } | null;
}) {
  const max = Math.max(1, ...hours);
  const total = hours.reduce((a, b) => a + b, 0);

  // Time periods calculation (BST)
  const night = hours.slice(0, 6).reduce((a, b) => a + b, 0); // 12am - 5:59am
  const morning = hours.slice(6, 12).reduce((a, b) => a + b, 0); // 6am - 11:59am
  const afternoon = hours.slice(12, 18).reduce((a, b) => a + b, 0); // 12pm - 5:59pm
  const evening = hours.slice(18, 24).reduce((a, b) => a + b, 0); // 6pm - 11:59pm

  return (
    <div className="space-y-4">
      {/* 24-hour visual bar chart */}
      <div className="relative pt-6">
        <div className="flex h-36 items-end gap-1 sm:gap-1.5" role="img" aria-label="24-hour sign-in traffic breakdown">
          {hours.map((val, h) => {
            const isPeak = peakHour && peakHour.hour === h && val > 0;
            const heightPct = Math.max(val > 0 ? 8 : 2, (val / max) * 100);
            const pctOfDay = total > 0 ? Math.round((val / total) * 100) : 0;
            const hourName = hourLabel(h);

            return (
              <div
                key={h}
                className="group relative flex flex-1 flex-col items-center justify-end h-full"
              >
                {/* Count badge on top for bars > 0 */}
                {val > 0 && (
                  <span className="mb-1 hidden text-[10px] font-extrabold text-[#1E293B] sm:block tabular-nums">
                    {val}
                  </span>
                )}

                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute bottom-full mb-2 hidden z-30 whitespace-nowrap rounded-xl bg-[#1E293B] p-2.5 text-center text-[11px] font-medium text-white shadow-2xl group-hover:block">
                  <p className="font-extrabold text-[#F8FAFC]">
                    {hourName} ({h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`} BST)
                  </p>
                  <p className="mt-0.5 text-[#CBD5E1]">
                    <b className="text-white">{val}</b> sign-in{val === 1 ? '' : 's'} {total > 0 ? `· ${pctOfDay}% of day` : ''}
                  </p>
                  {isPeak && <p className="mt-1 text-[#FBBF24] font-extrabold text-[10px]">🔥 Busiest Hour of the Day</p>}
                </div>

                {/* Bar */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-md transition-all group-hover:brightness-110 ${
                    isPeak
                      ? 'bg-gradient-to-t from-[#D97706] to-[#F59E0B] shadow-sm'
                      : val > 0
                      ? 'bg-gradient-to-t from-[#635BFF] to-[#818CF8]'
                      : 'bg-[#F1F5F9]'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* 24-hour X-axis labels */}
        <div className="mt-2.5 flex items-center justify-between border-t border-[#E2E8F0] pt-2 text-[9px] sm:text-[10px] font-bold text-[#64748B]">
          {hours.map((_, h) => {
            const isMajor = h % 3 === 0; // 12am, 3am, 6am, 9am, 12pm, 3pm, 6pm, 9pm
            return (
              <span
                key={h}
                className={`flex-1 text-center truncate ${
                  isMajor ? 'text-[#1E293B] font-extrabold' : 'hidden md:inline text-[#94A3B8]'
                }`}
                title={hourLabel(h)}
              >
                {hourLabel(h)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Time-of-day summary cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 border-t border-[#F1F5F9] pt-3 text-[12px]">
        <div className="rounded-xl bg-[#F8FAFC] p-3 border border-[#E2E8F0]/70">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B]">
            <Sunrise className="h-3.5 w-3.5 text-[#F59E0B]" />
            <span>Morning (6am–12pm)</span>
          </div>
          <p className="mt-1.5 text-[16px] font-extrabold text-[#1E293B] tabular-nums">
            {morning}{' '}
            <span className="text-[11px] font-semibold text-[#94A3B8]">
              ({total > 0 ? Math.round((morning / total) * 100) : 0}%)
            </span>
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3 border border-[#E2E8F0]/70">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B]">
            <Sun className="h-3.5 w-3.5 text-[#EAB308]" />
            <span>Afternoon (12pm–6pm)</span>
          </div>
          <p className="mt-1.5 text-[16px] font-extrabold text-[#1E293B] tabular-nums">
            {afternoon}{' '}
            <span className="text-[11px] font-semibold text-[#94A3B8]">
              ({total > 0 ? Math.round((afternoon / total) * 100) : 0}%)
            </span>
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3 border border-[#E2E8F0]/70">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B]">
            <Sunset className="h-3.5 w-3.5 text-[#F97316]" />
            <span>Evening (6pm–12am)</span>
          </div>
          <p className="mt-1.5 text-[16px] font-extrabold text-[#1E293B] tabular-nums">
            {evening}{' '}
            <span className="text-[11px] font-semibold text-[#94A3B8]">
              ({total > 0 ? Math.round((evening / total) * 100) : 0}%)
            </span>
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3 border border-[#E2E8F0]/70">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B]">
            <Moon className="h-3.5 w-3.5 text-[#6366F1]" />
            <span>Night (12am–6am)</span>
          </div>
          <p className="mt-1.5 text-[16px] font-extrabold text-[#1E293B] tabular-nums">
            {night}{' '}
            <span className="text-[11px] font-semibold text-[#94A3B8]">
              ({total > 0 ? Math.round((night / total) * 100) : 0}%)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginsPage() {
  const [days, setDays] = useState<InsightDays>(30);
  const [day, setDay] = useState<string>('');
  const [role, setRole] = useState<LoginRole | ''>('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Client-side quick filters on retrieved page data
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'SIGNED_IN' | 'APP_OPEN' | 'NEW'>('ALL');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'ANDROID' | 'IOS' | 'WEB'>('ALL');
  const [sortBy, setSortBy] = useState<'lastSeen' | 'firstSeen' | 'renewals' | 'name'>('lastSeen');

  // Chart time-scale granularity: auto (1d->hourly, 7d->daily, 30d->weekly, 90d/365d->monthly)
  const [chartGranularity, setChartGranularity] = useState<'auto' | 'hourly' | 'daily' | 'weekly' | 'monthly'>('auto');

  const effectiveGranularity = useMemo<'hourly' | 'daily' | 'weekly' | 'monthly'>(() => {
    if (chartGranularity !== 'auto') return chartGranularity;
    if (days === 1) return 'hourly';
    if (days === 7) return 'daily';
    if (days === 30) return 'weekly';
    return 'monthly'; // 90 or 365
  }, [chartGranularity, days]);

  // Inspection modal
  const [inspectingPerson, setInspectingPerson] = useState<ActivePerson | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live Auto-Refresh & Live Clock
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [liveBstTime, setLiveBstTime] = useState('');

  // Update live clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveBstTime(
        now.toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Main data fetch
  const data = useApi(
    () => getLogins({ days, day: day || undefined, role, q, page, pageSize }),
    [days, day, role, q, page, pageSize],
    'logins'
  );
  const d = data.data;

  // Dynamically computed aggregated series for the charts
  const chartPoints = useMemo<AggregatedPoint[]>(() => {
    if (!d) return [];
    return computeChartSeries(effectiveGranularity, d);
  }, [effectiveGranularity, d]);

  // Auto refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      data.refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, data]);

  // Pick date helper
  const pick = useCallback((next: string, scroll = true) => {
    setDay(next);
    setPage(1);
    if (scroll) {
      document.getElementById('who')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Stepper helpers: previous and next day
  const handlePrevDay = useCallback(() => {
    const currentDay = d?.day.day || d?.today;
    if (!currentDay) return;
    const prev = new Date(Date.parse(`${currentDay}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
    pick(prev, false);
  }, [d?.day.day, d?.today, pick]);

  const handleNextDay = useCallback(() => {
    const currentDay = d?.day.day || d?.today;
    if (!currentDay || !d?.today || currentDay >= d.today) return;
    const next = new Date(Date.parse(`${currentDay}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
    if (next <= d.today) {
      pick(next, false);
    }
  }, [d?.day.day, d?.today, pick]);

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Peak hour calculation for selected day
  const peakHourInfo = useMemo(() => {
    if (!d?.day.signInHours) return null;
    let maxHour = 0;
    let maxVal = 0;
    d.day.signInHours.forEach((val, hour) => {
      if (val > maxVal) {
        maxVal = val;
        maxHour = hour;
      }
    });
    return maxVal > 0 ? { hour: maxHour, count: maxVal, label: hourLabel(maxHour) } : null;
  }, [d?.day.signInHours]);

  // Client filtered and sorted people
  const processedPeople = useMemo(() => {
    if (!d?.day.people) return [];
    let list = [...d.day.people];

    // Activity filter
    if (activityFilter === 'SIGNED_IN') {
      list = list.filter((p) => p.signInTimes.length > 0);
    } else if (activityFilter === 'APP_OPEN') {
      list = list.filter((p) => p.signInTimes.length === 0);
    } else if (activityFilter === 'NEW') {
      list = list.filter((p) => p.isNew);
    }

    // Platform filter
    if (platformFilter !== 'ALL') {
      list = list.filter((p) => (p.platform || '').toUpperCase() === platformFilter);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'lastSeen') {
        return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
      }
      if (sortBy === 'firstSeen') {
        return new Date(a.firstSeenAt).getTime() - new Date(b.firstSeenAt).getTime();
      }
      if (sortBy === 'renewals') {
        return (b.renewals || 0) - (a.renewals || 0);
      }
      if (sortBy === 'name') {
        const nameA = (a.name || a.email || '').toLowerCase();
        const nameB = (b.name || b.email || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return list;
  }, [d?.day.people, activityFilter, platformFilter, sortBy]);

  // CSV Export for active people
  const exportDayPeopleCsv = () => {
    if (!d?.day.people || d.day.people.length === 0) return;
    const currentDay = d.day.day;
    const headers = [
      'User ID',
      'Name',
      'Email',
      'Phone',
      'Role',
      'First Seen (BST)',
      'Last Seen (BST)',
      'Sign Ins Today',
      'App Opens / Renewals',
      'Platform',
      'Is New Account',
      'Joined Date',
      'Sign In Times Details',
    ];

    const rows = processedPeople.map((p) => [
      `"${p.userId}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.email || '').replace(/"/g, '""')}"`,
      `"${(p.phone || '').replace(/"/g, '""')}"`,
      `"${p.role}"`,
      `"${bdTime(p.firstSeenAt)}"`,
      `"${bdTime(p.lastSeenAt)}"`,
      p.signIns,
      p.renewals,
      `"${p.platform || 'Unknown'}"`,
      p.isNew ? 'YES' : 'NO',
      `"${date(p.joinedAt)}"`,
      `"${p.signInTimes.map((s) => `${bdTime(s.at)} [${s.method}]`).join('; ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `salunbd_active_users_${currentDay}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export for historical day-by-day series
  const exportHistoricalSeriesCsv = () => {
    if (!d?.series || d.series.length === 0) return;
    const headers = [
      'Day',
      'Active Total',
      'Signed In',
      'New Accounts',
      'Returning',
      'Customers',
      'Barbers',
      'Shop Owners',
      'Staff Barbers',
      'Admins',
    ];

    const rows = d.series.map((s) => [
      s.day,
      s.active,
      s.signedIn,
      s.newUsers,
      s.returning,
      s.byRole['CUSTOMER'] || 0,
      s.byRole['BARBER'] || 0,
      s.byRole['OWNER'] || 0,
      s.byRole['STAFF'] || 0,
      s.byRole['SUPER_ADMIN'] || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `salunbd_daily_logins_history_${days}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedDayIsToday = d ? d.day.day === d.today : false;
  const isLatestDay = d ? d.day.day >= d.today : true;

  return (
    <>
      <PageHead
        eyebrow="Super Admin Telemetry"
        title="Daily Logins & Session Audits"
        lede="Real-time user engagement, session activity, and device tracking across SalunBD. Every person counts once per Bangladesh day when they sign in or open the app."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Bangladesh Time pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] font-bold text-[#475569] shadow-sm">
              <Clock className="h-3.5 w-3.5 text-[#635BFF]" />
              <span className="text-[#94A3B8]">BST (UTC+6):</span>
              <span className="tabular-nums font-mono text-[#1E293B]">{liveBstTime || '—'}</span>
            </div>

            {/* Auto-Refresh Toggle */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-bold transition-all ${
                autoRefresh
                  ? 'border-[#BBF7D0] bg-[#DCFCE7] text-[#16A34A] shadow-sm'
                  : 'border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#1E293B]'
              }`}
              title="Automatically refresh logins data every 30 seconds"
            >
              <Radio className={`h-3.5 w-3.5 ${autoRefresh ? 'animate-pulse text-[#16A34A]' : 'text-[#94A3B8]'}`} />
              <span>{autoRefresh ? 'Live Radar (30s)' : 'Auto-refresh Off'}</span>
            </button>

            {/* Timeframe picker */}
            <DaysPicker value={days} onChange={setDays} includeToday />

            {/* Manual Refresh */}
            <Button onClick={data.refresh} disabled={data.loading} className="shadow-sm">
              <RotateCw className={`h-4 w-4 ${data.loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {/* Historical Series Export */}
            {d && (
              <Button
                variant="outline"
                onClick={exportHistoricalSeriesCsv}
                title="Download CSV of daily login trends"
                className="hidden md:inline-flex"
              >
                <Download className="h-4 w-4 text-[#635BFF]" />
                Export Trends
              </Button>
            )}
          </div>
        }
      />

      <Canvas>
        {data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : !d ? (
          <Loading label="Gathering session audits and daily telemetry..." />
        ) : (
          <>
            {/* Recording notice if applicable */}
            {(!d.trackingSince || d.trackingSince > d.series[0]?.day) && (
              <div className="flex items-center gap-2.5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4 text-[13px] font-semibold text-[#92400E] shadow-sm">
                <Sparkles className="h-4 w-4 shrink-0 text-[#D97706]" />
                <p>
                  {d.trackingSince
                    ? `Telemetry recording began on ${dayLabel(d.trackingSince)}. Historical days prior to this date are empty, and rolling averages calculate from that starting point.`
                    : 'Real-time telemetry recording has initialized. Numbers update as users authenticate or awaken background sessions.'}
                </p>
              </div>
            )}

            {/* Top KPI Scorecards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="Active Today"
                value={count(d.summary.activeToday)}
                sub={change(d.summary.activeToday, d.summary.activeYesterday)}
                tone="live"
                icon={<Activity className="h-5 w-5 text-[#16A34A]" />}
                iconBg="bg-[#DCFCE7]"
              />

              <Stat
                label="Signed In Today"
                value={count(d.summary.signedInToday)}
                sub={change(d.summary.signedInToday, d.summary.signedInYesterday)}
                icon={<LogIn className="h-5 w-5 text-[#635BFF]" />}
                iconBg="bg-[#EEF2FF]"
              />

              <Stat
                label="Online Right Now"
                value={count(d.summary.onlineNow)}
                sub={
                  d.summary.onlineByRole.length
                    ? d.summary.onlineByRole.map((r) => `${r.count} ${(ROLE_ONE[r.key] ?? r.key).toLowerCase()}`).join(' · ')
                    : 'Active within the last 15 minutes'
                }
                tone="live"
                icon={<Radio className="h-5 w-5 text-[#10B981] animate-pulse" />}
                iconBg="bg-[#ECFDF5]"
              />

              <Stat
                label="New Signups Today"
                value={count(d.summary.newToday)}
                sub="Accounts registered & active today"
                icon={<Sparkles className="h-5 w-5 text-[#F59E0B]" />}
                iconBg="bg-[#FEF3C7]"
              />

              <Stat
                label={`Unique Users (${days}d)`}
                value={count(d.summary.uniqueActive)}
                sub="Each distinct person counted once"
                icon={<ShieldCheck className="h-5 w-5 text-[#475569]" />}
                iconBg="bg-[#F1F5F9]"
              />

              <Stat
                label="Daily Average"
                value={d.summary.averageActive ?? '—'}
                sub={`${d.summary.averageSignedIn ?? '—'} signed in per day`}
                icon={<TrendingUp className="h-5 w-5 text-[#0EA5E9]" />}
                iconBg="bg-[#E0F2FE]"
              />

              <Stat
                label="Busiest Peak Day"
                value={d.summary.peak ? count(d.summary.peak.active) : '—'}
                sub={d.summary.peak ? `${dayLabel(d.summary.peak.day)} (${d.summary.peak.active} active)` : 'No records yet'}
                icon={<Flame className="h-5 w-5 text-[#EF4444]" />}
                iconBg="bg-[#FEE2E2]"
              />

              <Stat
                label={`Total Sign-Ins (${days}d)`}
                value={count(d.summary.signIns)}
                sub="Email/password and Google OAuth"
                icon={<Users className="h-5 w-5 text-[#8B5CF6]" />}
                iconBg="bg-[#EDE9FE]"
              />
            </div>

            {/* Interactive Date Scrubber & Quick Control Bar */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Currently selected day title & badge */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#635BFF]">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-[16px] font-extrabold text-[#1E293B]">
                          {dayLong(d.day.day, d.today)}
                        </h2>
                        {selectedDayIsToday && <Badge tone="live">Live Today</Badge>}
                      </div>
                      <p className="text-[12px] font-medium text-[#64748B]">
                        <b className="text-[#1E293B]">{count(d.day.active)}</b> active people ·{' '}
                        <b className="text-[#1E293B]">{count(d.day.signInCount)}</b> explicit sign-in
                        {d.day.signInCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date Controls & Steppers */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Previous day */}
                  <Button
                    variant="outline"
                    onClick={handlePrevDay}
                    title="Jump to previous day"
                    className="px-2.5 py-1.5 text-[12px]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Prev Day</span>
                  </Button>

                  {/* Quick jumps */}
                  <button
                    type="button"
                    onClick={() => pick('')}
                    className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all ${
                      selectedDayIsToday
                        ? 'bg-[#635BFF] text-white shadow-sm'
                        : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                    }`}
                  >
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const y = new Date(Date.parse(`${d.today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
                      pick(y);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all ${
                      d.day.day === new Date(Date.parse(`${d.today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10)
                        ? 'bg-[#635BFF] text-white shadow-sm'
                        : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                    }`}
                  >
                    Yesterday
                  </button>

                  {d.summary.peak && (
                    <button
                      type="button"
                      onClick={() => pick(d.summary.peak!.day)}
                      className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all ${
                        d.day.day === d.summary.peak.day
                          ? 'bg-[#635BFF] text-white shadow-sm'
                          : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                      }`}
                      title="Jump to highest traffic peak day"
                    >
                      Peak ({dayLabel(d.summary.peak.day)})
                    </button>
                  )}

                  {/* Next day */}
                  <Button
                    variant="outline"
                    onClick={handleNextDay}
                    disabled={isLatestDay}
                    title="Jump to next day"
                    className="px-2.5 py-1.5 text-[12px] disabled:opacity-40"
                  >
                    <span className="hidden sm:inline">Next Day</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Native Date Picker */}
                  <label className="relative ml-1 inline-flex items-center">
                    <span className="sr-only">Choose date</span>
                    <input
                      type="date"
                      value={d.day.day}
                      max={d.today}
                      onChange={(e) => e.target.value && pick(e.target.value)}
                      className="cursor-pointer rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#1E293B] shadow-sm hover:border-[#CBD5E1] focus:border-[#635BFF] focus:outline-none"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Time-Scale Granularity Toolbar */}
            <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#635BFF]">
                  <Activity className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-[13px] font-extrabold text-[#1E293B]">
                    Time-Scale Aggregation Mode
                  </h3>
                  <p className="text-[11px] font-medium text-[#64748B]">
                    {effectiveGranularity === 'hourly'
                      ? `Displaying 24-hour distribution (12am–11pm BST) for ${dayLong(d.day.day, d.today)}`
                      : effectiveGranularity === 'weekly'
                      ? `Displaying week-by-week aggregated volume across past ${days} days`
                      : effectiveGranularity === 'monthly'
                      ? `Displaying calendar month-by-month trends across past ${days === 365 ? '1 Year (12 Months)' : `${days} Days`}`
                      : `Displaying date-by-date daily metrics across past ${days} days`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1 text-[11px] font-bold">
                <span className="px-2 text-[#94A3B8] uppercase">Scale:</span>
                {[
                  { key: 'auto', label: `Auto (${effectiveGranularity.toUpperCase()})` },
                  { key: 'hourly', label: 'Hours (24h)' },
                  { key: 'daily', label: 'Dates (7D)' },
                  { key: 'weekly', label: 'Weeks (30D)' },
                  { key: 'monthly', label: 'Months (Year)' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setChartGranularity(opt.key as any)}
                    className={`rounded-md px-2.5 py-1 transition-all ${
                      chartGranularity === opt.key
                        ? 'bg-[#635BFF] text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Charts: Role Distribution & New/Returning Flow */}
            <div className="grid gap-5 xl:grid-cols-2">
              <Panel
                title={
                  effectiveGranularity === 'hourly'
                    ? 'Active People per Hour (By Account Type)'
                    : effectiveGranularity === 'weekly'
                    ? 'Active People per Week (By Account Type)'
                    : effectiveGranularity === 'monthly'
                    ? 'Active People per Month (By Account Type)'
                    : 'Active People per Day (By Account Type)'
                }
                note={
                  effectiveGranularity === 'hourly'
                    ? `24 hours (BST · UTC+6) — ${dayLong(d.day.day, d.today)}`
                    : effectiveGranularity === 'weekly'
                    ? `Week-wise aggregation across past ${days} days`
                    : effectiveGranularity === 'monthly'
                    ? `Month-wise breakdown across ${days === 365 ? '1 Year' : `${days} Days`}`
                    : `Click any bar to inspect that date · Showing last ${days} days`
                }
              >
                <StackedColumns
                  points={chartPoints.map((s) => ({ label: s.label, values: s.byRole }))}
                  series={ROLES.map((r) => ({ key: r, label: LOGIN_ROLE_LABELS[r], color: LOGIN_ROLE_COLORS[r] }))}
                  activeLabel={effectiveGranularity === 'daily' ? dayLabel(d.day.day) : undefined}
                  onSelect={(_label, idx) => {
                    const selected = chartPoints[idx];
                    if (selected?.dateKey) pick(selected.dateKey);
                  }}
                />
              </Panel>

              <Panel
                title={
                  effectiveGranularity === 'hourly'
                    ? 'New vs Returning Users per Hour'
                    : effectiveGranularity === 'weekly'
                    ? 'New vs Returning Users (Week-wise)'
                    : effectiveGranularity === 'monthly'
                    ? 'New vs Returning Users (Month-wise)'
                    : 'New vs Returning User Acquisition'
                }
                note={
                  effectiveGranularity === 'hourly'
                    ? 'New = registered that hour · Returning = existing account'
                    : effectiveGranularity === 'weekly'
                    ? 'Weekly ratio of new account creation vs returning engagement'
                    : effectiveGranularity === 'monthly'
                    ? 'Monthly acquisition vs returning retention trend'
                    : 'New = created account that day · Click bar to inspect date'
                }
              >
                <StackedColumns
                  points={chartPoints.map((s) => ({
                    label: s.label,
                    values: { returning: s.returning, newUsers: s.newUsers },
                  }))}
                  series={[
                    { key: 'returning', label: 'Returning Users', color: '#635BFF' },
                    { key: 'newUsers', label: 'New Signups', color: '#F59E0B' },
                  ]}
                  activeLabel={effectiveGranularity === 'daily' ? dayLabel(d.day.day) : undefined}
                  onSelect={(_label, idx) => {
                    const selected = chartPoints[idx];
                    if (selected?.dateKey) pick(selected.dateKey);
                  }}
                />
              </Panel>
            </div>

            {/* Trio Breakdown: Auth Method, Platform Devices, and Account Roles */}
            <div className="grid gap-5 lg:grid-cols-3">
              <Panel
                title="Authentication Methods"
                note={`${days} days total (${count(d.summary.signIns)} sign-ins)`}
              >
                <Donut
                  size={140}
                  centre={count(d.summary.signIns)}
                  parts={d.methods.map((m) => ({
                    label: LOGIN_METHOD_LABELS[m.key as LoginMethod] ?? m.key,
                    value: m.count,
                    color: METHOD_COLORS[m.key] ?? '#CBD5E1',
                  }))}
                />
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#F1F5F9] pt-3 text-center">
                  {d.methods.map((m) => (
                    <div key={m.key} className="rounded-lg bg-[#F8FAFC] p-2">
                      <p className="text-[11px] font-bold text-[#64748B]">
                        {LOGIN_METHOD_LABELS[m.key as LoginMethod] ?? m.key}
                      </p>
                      <p className="mt-0.5 text-[14px] font-extrabold text-[#1E293B] tabular-nums">
                        {count(m.count)}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel
                title="Device & Platform Breakdown"
                note="Client environments detected across sign-ins"
              >
                <Donut
                  size={140}
                  parts={d.platforms.map((p) => ({
                    label: PLATFORM_LABELS[p.key] ?? p.key,
                    value: p.count,
                    color: PLATFORM_COLORS[p.key] ?? '#CBD5E1',
                  }))}
                />
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#F1F5F9] pt-3 text-center">
                  {d.platforms.map((p) => (
                    <div key={p.key} className="flex flex-col items-center justify-center rounded-lg bg-[#F8FAFC] p-2">
                      <div className="flex items-center gap-1">
                        <PlatformIcon platform={p.key} />
                        <span className="text-[11px] font-bold text-[#64748B]">{PLATFORM_LABELS[p.key] ?? p.key}</span>
                      </div>
                      <p className="mt-0.5 text-[14px] font-extrabold text-[#1E293B] tabular-nums">
                        {count(p.count)}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Sign-ins by Account Type" note="Distribution across roles">
                <Bars
                  rows={d.signInRoles.map((r) => ({
                    label: LOGIN_ROLE_LABELS[r.key as LoginRole] ?? r.key,
                    value: r.count,
                    color: LOGIN_ROLE_COLORS[r.key as LoginRole],
                  }))}
                  format={count}
                />
              </Panel>
            </div>

            {/* Peak Heatmap: 7 Days x 24 Hours */}
            <Panel
              title="When People Sign In (24/7 Peak Heatmap)"
              note={`Weekday by hour of day (Bangladesh Time BST / UTC+6) across the past ${days} days`}
              actions={
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#64748B]">
                  <span>Less busy</span>
                  <div className="flex items-center gap-0.5">
                    <span className="h-3 w-3 rounded-[2px] bg-[#F1F5F9]" />
                    <span className="h-3 w-3 rounded-[2px] bg-[rgba(99,91,255,0.25)]" />
                    <span className="h-3 w-3 rounded-[2px] bg-[rgba(99,91,255,0.55)]" />
                    <span className="h-3 w-3 rounded-[2px] bg-[rgba(99,91,255,0.85)]" />
                    <span className="h-3 w-3 rounded-[2px] bg-[#635BFF]" />
                  </div>
                  <span>Peak rush</span>
                </div>
              }
            >
              <Heatmap grid={d.weekHours} unit="sign-in" />
            </Panel>

            {/* Historical Day-by-Day Audit Table */}
            <Panel
              title="Day-by-Day Historical Logins Matrix"
              note="Select any date to view individual active sessions, device fingerprints, and authentication times"
              flush
              actions={
                <Button
                  variant="outline"
                  onClick={exportHistoricalSeriesCsv}
                  className="px-3 py-1.5 text-[12px]"
                >
                  <Download className="h-3.5 w-3.5 text-[#635BFF]" />
                  Export CSV
                </Button>
              }
            >
              <div className="max-h-[380px] overflow-y-auto">
                <Scroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Date</Th>
                        <Th align="right">Active People</Th>
                        <Th align="right">Signed In</Th>
                        <Th align="right">New Signups</Th>
                        <Th align="right">Returning</Th>
                        {ROLES.map((r) => (
                          <Th key={r} align="right">
                            {LOGIN_ROLE_LABELS[r]}
                          </Th>
                        ))}
                        <Th align="right">Action</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...d.series].reverse().map((s) => {
                        const isSelected = s.day === d.day.day;
                        return (
                          <Tr
                            key={s.day}
                            onClick={() => pick(s.day)}
                            className={`cursor-pointer transition-all ${
                              isSelected
                                ? '!bg-[#F5F3FF] font-medium border-l-4 border-l-[#635BFF] shadow-xs'
                                : 'hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <Td nowrap>
                              <div className="flex items-center gap-2">
                                <span className={isSelected ? 'font-extrabold text-[#635BFF]' : 'font-bold'}>
                                  {dayLabel(s.day)}
                                </span>
                                {s.day === d.today && <Badge tone="live">Today</Badge>}
                                {isSelected && (
                                  <span className="rounded-full bg-[#635BFF]/10 px-2 py-0.5 text-[10px] font-extrabold text-[#635BFF]">
                                    Inspecting
                                  </span>
                                )}
                              </div>
                            </Td>
                            <Td align="right">
                              <b className={isSelected ? 'text-[#635BFF]' : 'text-[#1E293B]'}>{count(s.active)}</b>
                            </Td>
                            <Td align="right">{count(s.signedIn)}</Td>
                            <Td align="right">
                              {s.newUsers > 0 ? (
                                <span className="font-bold text-[#F59E0B]">+{count(s.newUsers)}</span>
                              ) : (
                                <span className="text-[#94A3B8]">0</span>
                              )}
                            </Td>
                            <Td align="right">{count(s.returning)}</Td>
                            {ROLES.map((r) => (
                              <Td key={r} align="right" muted>
                                {s.byRole[r] ? count(s.byRole[r]) : '·'}
                              </Td>
                            ))}
                            <Td align="right">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-extrabold text-[#635BFF] border border-[#DDD6FE]">
                                  <Check className="h-3 w-3" />
                                  Inspecting
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    pick(s.day);
                                  }}
                                  disabled={!s.active}
                                  className="rounded-md border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#635BFF] transition-all hover:border-[#635BFF] hover:bg-[#EEF2FF] disabled:border-transparent disabled:bg-transparent disabled:text-[#CBD5E1]"
                                >
                                  Inspect Day
                                </button>
                              )}
                            </Td>
                          </Tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Scroll>
              </div>
            </Panel>

            {/* Connected Day Inspector: Hourly Traffic & Active People Directory */}
            <section id="who" className="space-y-5">
              {/* Active Day Inspector Sync Header */}
              <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#635BFF]/30 bg-gradient-to-r from-[#F5F3FF] via-[#EEF2FF] to-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#635BFF] text-white shadow-sm">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold text-[#635BFF] uppercase tracking-wider">
                        Date Inspector View
                      </span>
                      {selectedDayIsToday && <Badge tone="live">Today</Badge>}
                    </div>
                    <h3 className="text-[18px] font-extrabold text-[#1E293B]">
                      {dayLong(d.day.day, d.today)}
                    </h3>
                    <p className="text-[12px] font-medium text-[#64748B]">
                      Showing connected 24-hour traffic and active session directory for this date
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#1E293B] shadow-xs">
                    <span>
                      Active: <b className="text-[#635BFF]">{count(d.day.active)}</b>
                    </span>
                    <span className="text-[#CBD5E1]">|</span>
                    <span>
                      Sign-ins: <b className="text-[#10B981]">{count(d.day.signInCount)}</b>
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handlePrevDay}
                    title="Previous day"
                    className="px-2.5 py-1.5 text-[12px]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Prev Day</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleNextDay}
                    disabled={isLatestDay}
                    title="Next day"
                    className="px-2.5 py-1.5 text-[12px]"
                  >
                    <span className="hidden sm:inline">Next Day</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <label className="relative inline-flex items-center">
                    <span className="sr-only">Change Inspected Date</span>
                    <input
                      type="date"
                      value={d.day.day}
                      max={d.today}
                      onChange={(e) => e.target.value && pick(e.target.value)}
                      className="cursor-pointer rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#1E293B] shadow-xs hover:border-[#CBD5E1] focus:border-[#635BFF] focus:outline-none"
                    />
                  </label>
                </div>
              </div>

              {/* 24-Hour Sign-in Traffic Panel */}
              <Panel
                title={`24-Hour Sign-in Traffic — ${dayLong(d.day.day, d.today)}`}
                note={`Hourly distribution of sign-in events across all 24 hours (BST · UTC+6) on this selected date`}
                actions={
                  peakHourInfo && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-1.5 text-[12px] font-bold text-[#92400E]">
                      <Flame className="h-3.5 w-3.5 text-[#D97706]" />
                      <span>
                        Busiest Hour: {peakHourInfo.label} ({peakHourInfo.count} sign-ins)
                      </span>
                    </div>
                  )
                }
              >
                <HourlyTraffic24h
                  hours={d.day.signInHours}
                  totalSignIns={d.day.signInCount}
                  activePeople={d.day.active}
                  peakHour={peakHourInfo}
                />
              </Panel>

              {/* People Directory Panel */}
              <div id="people-directory">
                <Panel
                  title="Active Users & Session Directory"
                  note={`Inspect sessions recorded on ${dayLong(d.day.day, d.today)} (Newest seen first)`}
                  flush
                actions={
                  <div className="flex flex-wrap items-center gap-2">
                    {/* CSV Export for Day People */}
                    <Button
                      variant="outline"
                      onClick={exportDayPeopleCsv}
                      disabled={processedPeople.length === 0}
                      className="px-3 py-1.5 text-[12px]"
                      title="Export this day's active users to CSV"
                    >
                      <Download className="h-3.5 w-3.5 text-[#635BFF]" />
                      Export Active List
                    </Button>
                  </div>
                }
              >
                {/* Advanced Filtering Toolbar */}
                <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    {/* Search Input */}
                    <div className="relative w-full md:w-80">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
                        aria-hidden
                      />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, phone, or ID..."
                        className="w-full rounded-lg border border-[#E2E8F0] bg-white py-1.5 pl-9 pr-8 text-[12px] font-medium text-[#1E293B] shadow-sm placeholder:text-[#94A3B8] focus:border-[#635BFF] focus:outline-none"
                      />
                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1E293B]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Secondary Filters: Platform, Activity Type, Sorting, Page Size */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Activity Status */}
                      <select
                        aria-label="Activity Filter"
                        value={activityFilter}
                        onChange={(e) => setActivityFilter(e.target.value as any)}
                        className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#475569] shadow-sm hover:border-[#CBD5E1] focus:border-[#635BFF] focus:outline-none"
                      >
                        <option value="ALL">All Activity Types</option>
                        <option value="SIGNED_IN">Explicit Sign-in Today</option>
                        <option value="APP_OPEN">Session / App Open Only</option>
                        <option value="NEW">Brand New Account</option>
                      </select>

                      {/* Platform */}
                      <select
                        aria-label="Platform Filter"
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value as any)}
                        className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#475569] shadow-sm hover:border-[#CBD5E1] focus:border-[#635BFF] focus:outline-none"
                      >
                        <option value="ALL">All Platforms</option>
                        <option value="ANDROID">Android</option>
                        <option value="IOS">iPhone / iOS</option>
                        <option value="WEB">Web Browser</option>
                      </select>

                      {/* Sort By */}
                      <select
                        aria-label="Sort users"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#475569] shadow-sm hover:border-[#CBD5E1] focus:border-[#635BFF] focus:outline-none"
                      >
                        <option value="lastSeen">Sort: Last Seen (Newest)</option>
                        <option value="firstSeen">Sort: First Seen (Earliest)</option>
                        <option value="renewals">Sort: Most App Opens</option>
                        <option value="name">Sort: Name (A to Z)</option>
                      </select>

                      {/* Page Size */}
                      <select
                        aria-label="Page Size"
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(1);
                        }}
                        className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#475569] shadow-sm hover:border-[#CBD5E1] focus:border-[#635BFF] focus:outline-none"
                      >
                        <option value={15}>15 / page</option>
                        <option value={25}>25 / page</option>
                        <option value={50}>50 / page</option>
                        <option value={100}>100 / page</option>
                      </select>
                    </div>
                  </div>

                  {/* Role Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-[#94A3B8] uppercase mr-1">Role:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRole('');
                        setPage(1);
                      }}
                      className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                        role === ''
                          ? 'bg-[#1E293B] text-white shadow-sm'
                          : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]'
                      }`}
                    >
                      All Roles
                    </button>
                    {ROLES.map((r) => {
                      const isSelected = role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setRole(r);
                            setPage(1);
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                            isSelected
                              ? 'bg-[#635BFF] text-white shadow-sm'
                              : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]'
                          }`}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: LOGIN_ROLE_COLORS[r] }}
                            aria-hidden
                          />
                          {LOGIN_ROLE_LABELS[r]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Main People Directory Content */}
                {d.day.people.length === 0 ? (
                  <Empty
                    title={q || role ? 'No users match criteria' : 'Nobody was active on this day'}
                    hint={
                      q || role
                        ? 'Try clearing the search query or changing role filters.'
                        : 'Pick another day from the calendar or timeline above.'
                    }
                    action={
                      (q || role) && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearch('');
                            setRole('');
                            setActivityFilter('ALL');
                            setPlatformFilter('ALL');
                          }}
                        >
                          Clear All Filters
                        </Button>
                      )
                    }
                  />
                ) : processedPeople.length === 0 ? (
                  <Empty
                    title="No users match the secondary filters"
                    hint="Adjust your Activity Status or Platform filter above."
                    action={
                      <Button
                        variant="outline"
                        onClick={() => {
                          setActivityFilter('ALL');
                          setPlatformFilter('ALL');
                        }}
                      >
                        Reset Secondary Filters
                      </Button>
                    }
                  />
                ) : (
                  <>
                    <Scroll>
                      <Table>
                        <thead>
                          <tr>
                            <Th>Person / User</Th>
                            <Th>Account Role</Th>
                            <Th>Authentication Actions</Th>
                            <Th align="right">First Seen (BST)</Th>
                            <Th align="right">Last Seen (BST)</Th>
                            <Th align="right">App Opens / Renewals</Th>
                            <Th>Platform</Th>
                            <Th align="right">Registered</Th>
                            <Th align="right">Action</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {processedPeople.map((p) => {
                            const userInitial = initials(p.name || p.email || 'User');
                            return (
                              <Tr key={p.userId}>
                                <Td>
                                  <div className="flex items-center gap-3">
                                    {/* Avatar circle */}
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[12px] font-extrabold text-[#635BFF] border border-[#DDD6FE]">
                                      {userInitial}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <Link
                                          href={`/users/${p.userId}`}
                                          className="font-extrabold text-[#1E293B] hover:text-[#635BFF] hover:underline"
                                        >
                                          {p.name || p.email || p.userId.slice(0, 8)}
                                        </Link>
                                        {p.isNew && <Badge tone="warning">New Account</Badge>}
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                                        <span>{p.email || 'No email'}</span>
                                        {p.phone && <span>· {p.phone}</span>}
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(p.userId, p.userId)}
                                          title="Copy user ID"
                                          className="text-[#94A3B8] hover:text-[#1E293B]"
                                        >
                                          {copiedId === p.userId ? (
                                            <Check className="h-3 w-3 text-[#16A34A]" />
                                          ) : (
                                            <Copy className="h-3 w-3" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </Td>

                                <Td nowrap>
                                  <RoleBadge role={p.role} />
                                </Td>

                                <Td>
                                  {p.signInTimes.length === 0 ? (
                                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#94A3B8]">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
                                      Already signed in
                                    </span>
                                  ) : (
                                    <ul className="space-y-1">
                                      {p.signInTimes.map((s, idx) => (
                                        <li key={idx} className="flex items-center gap-1.5 whitespace-nowrap text-[12px]">
                                          <b className="font-mono text-[#1E293B]">{bdTime(s.at)}</b>
                                          <span className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-bold text-[#475569]">
                                            {LOGIN_METHOD_LABELS[s.method] ?? s.method}
                                          </span>
                                          {s.platform && (
                                            <span className="flex items-center gap-0.5 text-[11px] text-[#64748B]">
                                              <PlatformIcon platform={s.platform} />
                                              {PLATFORM_LABELS[s.platform] ?? s.platform}
                                            </span>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </Td>

                                <Td align="right" nowrap>
                                  <span className="font-mono font-semibold text-[#1E293B]">{bdTime(p.firstSeenAt)}</span>
                                </Td>

                                <Td align="right" nowrap>
                                  <div className="text-right">
                                    <span className="font-mono font-semibold text-[#1E293B]">{bdTime(p.lastSeenAt)}</span>
                                    <p className="text-[11px] text-[#94A3B8]">{since(p.lastSeenAt)}</p>
                                  </div>
                                </Td>

                                <Td align="right">
                                  <span className="inline-flex items-center rounded-md bg-[#F8FAFC] px-2 py-0.5 font-mono text-[12px] font-bold text-[#1E293B] border border-[#E2E8F0]">
                                    {count(p.renewals)}
                                  </span>
                                </Td>

                                <Td nowrap>
                                  <div className="flex items-center gap-1.5 font-medium text-[#475569]">
                                    <PlatformIcon platform={p.platform} />
                                    <span>{p.platform ? PLATFORM_LABELS[p.platform] ?? p.platform : '—'}</span>
                                  </div>
                                </Td>

                                <Td align="right" nowrap muted>
                                  {date(p.joinedAt)}
                                </Td>

                                <Td align="right" nowrap>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setInspectingPerson(p)}
                                      className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#635BFF] transition-all hover:border-[#635BFF] hover:bg-[#EEF2FF]"
                                    >
                                      Inspect
                                    </button>
                                    <Link
                                      href={`/users/${p.userId}`}
                                      className="rounded-lg p-1 text-[#94A3B8] transition-all hover:bg-[#F1F5F9] hover:text-[#1E293B]"
                                      title="Open full user profile"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </Link>
                                  </div>
                                </Td>
                              </Tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </Scroll>

                    {/* Pagination Bar */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#F1F5F9] px-5 py-4 text-[12px] font-semibold text-[#64748B]">
                      <div className="flex items-center gap-2">
                        <span>
                          Showing{' '}
                          <b className="text-[#1E293B]">
                            {d.day.total === 0 ? 0 : (page - 1) * pageSize + 1}–
                            {Math.min(d.day.total, (page - 1) * pageSize + processedPeople.length)}
                          </b>{' '}
                          of <b className="text-[#1E293B]">{count(d.day.total)}</b> active people
                        </span>
                        {processedPeople.length !== d.day.people.length && (
                          <span className="text-[#94A3B8]">
                            ({processedPeople.length} matched current client filters)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          disabled={page <= 1}
                          onClick={() => {
                            setPage((n) => Math.max(1, n - 1));
                            document.getElementById('people-directory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }}
                          className="px-3 py-1 text-[12px]"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="px-2 font-bold text-[#1E293B]">
                          Page {page} of {Math.max(1, Math.ceil(d.day.total / pageSize))}
                        </span>
                        <Button
                          variant="outline"
                          disabled={page * pageSize >= d.day.total}
                          onClick={() => {
                            setPage((n) => n + 1);
                            document.getElementById('people-directory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }}
                          className="px-3 py-1 text-[12px]"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </Panel>
              </div>
            </section>

            {/* Global Recent Sign-in Stream */}
            <Panel
              title="Live Sign-in Audit Stream"
              note="Most recent authentication events across all accounts in SalunBD (Newest first)"
              flush
            >
              {d.recent.length === 0 ? (
                <Empty title="No sign-in events recorded yet" />
              ) : (
                <Scroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Timestamp (BST)</Th>
                        <Th>Person / User</Th>
                        <Th>Account Role</Th>
                        <Th>Auth Method</Th>
                        <Th>Platform</Th>
                        <Th align="right">Action</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.recent.map((e, i) => (
                        <Tr key={`${e.userId}-${i}`}>
                          <Td nowrap>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-[#1E293B]">
                                {bdDateTime(e.at)}
                              </span>
                              <span className="text-[11px] text-[#94A3B8]">({since(e.at)})</span>
                            </div>
                          </Td>
                          <Td>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/users/${e.userId}`}
                                className="font-bold text-[#1E293B] hover:text-[#635BFF] hover:underline"
                              >
                                {e.name || e.email || e.userId.slice(0, 8)}
                              </Link>
                              {e.email && <span className="text-[12px] text-[#94A3B8]">{e.email}</span>}
                            </div>
                          </Td>
                          <Td nowrap>
                            <RoleBadge role={e.role} />
                          </Td>
                          <Td nowrap>
                            <span className="inline-flex items-center gap-1.5 rounded bg-[#F1F5F9] px-2 py-0.5 text-[12px] font-bold text-[#475569]">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: METHOD_COLORS[e.method] ?? '#94A3B8' }}
                              />
                              {LOGIN_METHOD_LABELS[e.method] ?? e.method}
                            </span>
                          </Td>
                          <Td nowrap>
                            <div className="flex items-center gap-1.5 font-medium text-[#64748B]">
                              <PlatformIcon platform={e.platform} />
                              <span>{e.platform ? PLATFORM_LABELS[e.platform] ?? e.platform : '—'}</span>
                            </div>
                          </Td>
                          <Td align="right">
                            <Link
                              href={`/users/${e.userId}`}
                              className="text-[12px] font-bold text-[#635BFF] hover:underline"
                            >
                              View User
                            </Link>
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </Scroll>
              )}
            </Panel>
          </>
        )}
      </Canvas>

      {/* Inspect Person Modal */}
      {inspectingPerson && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs font-manrope animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#E2E8F0] p-6 bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#635BFF] text-[16px] font-extrabold text-white shadow-sm">
                  {initials(inspectingPerson.name || inspectingPerson.email || 'User')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[17px] font-extrabold text-[#1E293B]">
                      {inspectingPerson.name || inspectingPerson.email || 'Unnamed User'}
                    </h3>
                    {inspectingPerson.isNew && <Badge tone="warning">New Account</Badge>}
                  </div>
                  <p className="text-[12px] font-medium text-[#64748B]">
                    {inspectingPerson.email || 'No email attached'} · {inspectingPerson.phone || 'No phone'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingPerson(null)}
                className="rounded-lg p-1.5 text-[#94A3B8] transition-all hover:bg-[#E2E8F0] hover:text-[#1E293B]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 p-6">
              {/* Profile metadata chips */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase">Account Role</p>
                  <div className="mt-1">
                    <RoleBadge role={inspectingPerson.role} />
                  </div>
                </div>

                <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase">Primary Device</p>
                  <div className="mt-1 flex items-center gap-1 text-[13px] font-bold text-[#1E293B]">
                    <PlatformIcon platform={inspectingPerson.platform} />
                    <span>{inspectingPerson.platform ? PLATFORM_LABELS[inspectingPerson.platform] ?? inspectingPerson.platform : 'Unknown'}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase">App Opens</p>
                  <p className="mt-1 text-[15px] font-extrabold text-[#1E293B] tabular-nums">
                    {count(inspectingPerson.renewals)}
                  </p>
                </div>

                <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase">Member Since</p>
                  <p className="mt-1 text-[13px] font-bold text-[#1E293B]">
                    {date(inspectingPerson.joinedAt)}
                  </p>
                </div>
              </div>

              {/* Day Session Activity Timestamps */}
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-extrabold text-[#1E293B]">
                    Session Activity on {d ? dayLong(d.day.day, d.today) : 'Selected Day'}
                  </h4>
                  <span className="text-[11px] font-bold text-[#64748B]">
                    Times are Bangladesh BST
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div className="rounded-lg bg-white p-3 border border-[#E2E8F0]">
                    <p className="text-[11px] font-bold text-[#94A3B8] uppercase">First Seen</p>
                    <p className="mt-1 font-mono text-[14px] font-extrabold text-[#1E293B]">
                      {bdTime(inspectingPerson.firstSeenAt)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-[#E2E8F0]">
                    <p className="text-[11px] font-bold text-[#94A3B8] uppercase">Last Seen</p>
                    <p className="mt-1 font-mono text-[14px] font-extrabold text-[#1E293B]">
                      {bdTime(inspectingPerson.lastSeenAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Explicit Sign-in Events */}
              <div>
                <h4 className="mb-2 text-[13px] font-extrabold text-[#1E293B]">
                  Authentication Events ({inspectingPerson.signInTimes.length})
                </h4>
                {inspectingPerson.signInTimes.length === 0 ? (
                  <p className="rounded-lg border border-[#E2E8F0] bg-white p-3 text-[12px] font-medium text-[#64748B]">
                    No explicit sign-ins on this date. The user resumed existing active sessions or opened the mobile app.
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-[#E2E8F0] bg-white divide-y divide-[#F1F5F9]">
                    {inspectingPerson.signInTimes.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 text-[12px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-[#1E293B]">{bdTime(s.at)}</span>
                          <span className="rounded bg-[#EEF2FF] px-2 py-0.5 text-[11px] font-extrabold text-[#635BFF]">
                            {LOGIN_METHOD_LABELS[s.method] ?? s.method}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
                          <PlatformIcon platform={s.platform} />
                          <span>{s.platform ? PLATFORM_LABELS[s.platform] ?? s.platform : 'Unknown'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4">
              <button
                type="button"
                onClick={() => copyToClipboard(inspectingPerson.userId, 'modal-id')}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#64748B] hover:text-[#1E293B]"
              >
                {copiedId === 'modal-id' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span className="text-[#16A34A]">User ID Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy User ID</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setInspectingPerson(null)}>
                  Close
                </Button>
                <Link
                  href={`/users/${inspectingPerson.userId}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#635BFF] px-4 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-[#524be0]"
                >
                  View Full Profile
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
