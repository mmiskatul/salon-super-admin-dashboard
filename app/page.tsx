'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  Megaphone,
  RotateCw,
  Calendar,
  Users,
  UserCheck,
  Scissors,
  Activity,
  Store,
  CalendarCheck,
  Banknote,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  MapPin,
  MessageSquare,
  Heart,
  Bell,
  Sparkles,
  BarChart3,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { getOverview, type InsightDays } from '@/lib/api/insights';
import { placeHref } from '@/lib/placeHref';
import { count, money } from '@/lib/format';
import { Button, Canvas, Failed, Loading, PageHead, Panel, Stat } from '@/components/ui/primitives';
import ClusterHealthWidget from '@/components/overview/ClusterHealthWidget';
import { DateWiseProgressFilter } from '@/components/overview/DateWiseProgressFilter';
import { DailyProgressTable } from '@/components/overview/DailyProgressTable';
import { Bars, Columns, Donut, OUTCOME_COLORS, percent, StackedColumns } from '@/components/insights/Bits';

function MiniList({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <ul className="space-y-1.5 text-[13px] font-manrope">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center justify-between gap-3 rounded-md bg-[#F8FAFC] px-3 py-2 transition-colors hover:bg-[#F1F5F9]">
          <span className="font-semibold text-[#64748B]">{r.label}</span>
          <b className="tabular-nums text-[#1E293B]">{r.value}</b>
        </li>
      ))}
    </ul>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5 pt-2">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635BFF]/10 text-[#635BFF]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-[#1E293B]">{title}</h2>
            {badge && (
              <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-bold text-[#635BFF] uppercase tracking-wide">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[12px] font-medium text-[#64748B]">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

/** The whole system on one page: people, places, bookings, money, engagement, date-wise progress and health. */
export default function OverviewPage() {
  const [days, setDays] = useState<InsightDays>(30);

  const todayIso = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  const data = useApi(() => getOverview(days, selectedDate), [days, selectedDate], 'overview-whole-system');
  const o = data.data;
  const shortDay = (d: string) => d.slice(5);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // If selected date is further back than current days range, automatically widen range
    const diffDays = Math.ceil((Date.now() - new Date(`${date}T00:00:00`).getTime()) / 86400000);
    if (diffDays > 90 && days !== 365) {
      setDays(365);
    } else if (diffDays > 30 && days < 90) {
      setDays(90);
    } else if (diffDays > 7 && days === 7) {
      setDays(30);
    }
  };

  const handleClearDate = () => {
    setSelectedDate(todayIso);
  };

  // Compute breakdown for the focused date in the "Today / Date" panel
  const focusedDateBreakdown = useMemo(() => {
    if (!o) return { total: 0, waiting: 0, inChair: 0, done: 0, cancelled: 0 };
    if (selectedDate === todayIso) {
      return o.today;
    }
    const dayB = o.bookings.byDay.find((b) => b.day === selectedDate);
    if (dayB) {
      return {
        total: dayB.completed + dayB.upcoming + dayB.cancelled + dayB.noShow,
        waiting: dayB.upcoming,
        inChair: 0,
        done: dayB.completed,
        cancelled: dayB.cancelled + dayB.noShow,
      };
    }
    return o.today;
  }, [o, selectedDate, todayIso]);

  const periodLabel = days === 1 ? 'today' : days === 7 ? '7 days' : days === 30 ? '30 days' : days === 365 ? '1 year' : `${days} days`;
  const periodShort = days === 1 ? 'Day' : days === 7 ? 'Week' : days === 30 ? 'Month' : days === 365 ? 'Year' : `${days}d`;

  return (
    <>
      <PageHead
        eyebrow="Command centre"
        title="Platform overview"
        lede="Everything on SalunBD in one place: every customer, shop owner and barber, what was booked and what happened to it, date-wise progress, the cash recorded, and what needs your attention."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/broadcasts">
              <Button variant="outline"><Megaphone className="h-4 w-4" /> Broadcast</Button>
            </Link>
            <Button onClick={data.refresh} disabled={data.loading}>
              <RotateCw className={`h-4 w-4 ${data.loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        }
      />
      <Canvas>
        {data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : !o ? (
          <Loading label="Reading the whole system" />
        ) : (
          <div className="space-y-6 font-manrope">
            {/* Top Date Filter & Progress Spotlight */}
            <DateWiseProgressFilter
              days={days}
              onDaysChange={setDays}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              overviewData={o}
              onClearDateFilter={handleClearDate}
            />

            {/* Needs Attention Warning Banner */}
            {(o.attention.openReports > 0 || o.attention.openTickets > 0 || o.attention.hiddenListings > 0) && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FDE68A] bg-gradient-to-r from-[#FFFBEB] via-white to-[#FEF3C7] p-4 text-[13px] shadow-2xs">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F59E0B]/20 text-[#B45309]">
                    <AlertTriangle className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#92400E]">Action items requiring super admin attention:</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                      {o.attention.openReports > 0 && (
                        <Link href="/reports" className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] px-2 py-0.5 font-bold text-[#92400E] transition-colors hover:bg-[#FDE68A]">
                          <span>{o.attention.openReports} open report{o.attention.openReports === 1 ? '' : 's'}</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      )}
                      {o.attention.openTickets > 0 && (
                        <Link href="/support" className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] px-2 py-0.5 font-bold text-[#92400E] transition-colors hover:bg-[#FDE68A]">
                          <span>{o.attention.openTickets} support ticket{o.attention.openTickets === 1 ? '' : 's'}</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      )}
                      {o.attention.hiddenListings > 0 && (
                        <Link href="/readiness" className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] px-2 py-0.5 font-bold text-[#92400E] transition-colors hover:bg-[#FDE68A]">
                          <span>{o.attention.hiddenListings} shop{o.attention.hiddenListings === 1 ? '' : 's'}/barbers hidden</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 1: Headline KPI Cards */}
            <div>
              <SectionHeading
                icon={TrendingUp}
                title="Platform Vital Signs"
                subtitle={`Network performance over ${periodLabel} · click any card to inspect details`}
                badge={`${periodShort} View`}
              />
              <div className="mt-3.5 grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/users" className="block focus-visible:outline-2 focus-visible:outline-[#635BFF]">
                  <Stat
                    label="All accounts"
                    value={count(o.people.total)}
                    sub={`in ${periodLabel}`}
                    change={`+${o.people.newInPeriod}`}
                    icon={<Users className="h-5 w-5 text-[#635BFF]" />}
                    iconBg="bg-[#EEF2FF]"
                    gradient="bg-gradient-to-b from-[#635BFF]/[6%] to-white"
                  />
                </Link>

                <Link href="/growth" className="block focus-visible:outline-2 focus-visible:outline-[#635BFF]">
                  <Stat
                    label="Customers"
                    value={count(o.people.customers)}
                    sub="registered customers"
                    change={`+${o.people.newCustomers} new`}
                    icon={<UserCheck className="h-5 w-5 text-[#0EA5E9]" />}
                    iconBg="bg-[#E0F2FE]"
                    gradient="bg-gradient-to-b from-[#0EA5E9]/[6%] to-white"
                  />
                </Link>

                <Link href="/barbers" className="block focus-visible:outline-2 focus-visible:outline-[#635BFF]">
                  <Stat
                    label="Partners"
                    value={count(o.people.owners + o.people.shopBarbers + o.people.independentBarbers)}
                    sub="owners & barbers"
                    change={`+${o.people.newPartners} new`}
                    icon={<Scissors className="h-5 w-5 text-[#F59E0B]" />}
                    iconBg="bg-[#FEF3C7]"
                    gradient="bg-gradient-to-b from-[#F59E0B]/[6%] to-white"
                  />
                </Link>

                <Link href="/growth" className="block focus-visible:outline-2 focus-visible:outline-[#635BFF]">
                  <Stat
                    label="Active this week"
                    value={count(o.active.week.total)}
                    sub={`${o.active.day.total} today`}
                    tone="live"
                    change="Online users"
                    icon={<Activity className="h-5 w-5 text-[#10B981]" />}
                    iconBg="bg-[#D1FAE5]"
                    gradient="bg-gradient-to-b from-[#10B981]/[6%] to-white"
                  />
                </Link>

                <Link href="/readiness" className="block focus-visible:outline-2 focus-visible:outline-[#635BFF]">
                  <Stat
                    label="Visible places"
                    value={`${o.places.shopsVisible + o.places.barbersVisible}`}
                    sub={`of ${o.places.shops + o.places.independentBarbers} total`}
                    change={`${percent(o.places.shops + o.places.independentBarbers > 0 ? Math.round(((o.places.shopsVisible + o.places.barbersVisible) / (o.places.shops + o.places.independentBarbers)) * 100) : 0)} live`}
                    icon={<Store className="h-5 w-5 text-[#8B5CF6]" />}
                    iconBg="bg-[#EDE9FE]"
                    gradient="bg-gradient-to-b from-[#8B5CF6]/[6%] to-white"
                  />
                </Link>

                <Link href="/bookings" className="block focus-visible:outline-2 focus-visible:outline-[#635BFF]">
                  <Stat
                    label={`Bookings, ${periodShort}`}
                    value={count(o.bookings.total)}
                    sub="scheduled visits"
                    change={`${percent(o.bookings.completionRate)} done`}
                    icon={<CalendarCheck className="h-5 w-5 text-[#06B6D4]" />}
                    iconBg="bg-[#CFFAFE]"
                    gradient="bg-gradient-to-b from-[#06B6D4]/[6%] to-white"
                  />
                </Link>

                <Link href="/money" className="block focus-visible:outline-2 focus-visible:outline-[#635BFF]">
                  <Stat
                    label={`Cash, ${periodShort}`}
                    value={money(o.money.cash)}
                    sub="recorded receipts"
                    tone="live"
                    change={`${o.money.payments} orders`}
                    icon={<Banknote className="h-5 w-5 text-[#16A34A]" />}
                    iconBg="bg-[#DCFCE7]"
                    gradient="bg-gradient-to-b from-[#16A34A]/[6%] to-white"
                  />
                </Link>

                <Link href="/safety" className="block focus-visible:outline-2 focus-visible:outline-[#635BFF]">
                  <Stat
                    label="Average Rating"
                    value={o.engagement.averageRating ? `${o.engagement.averageRating} ★` : '—'}
                    sub="network quality"
                    change={`${o.engagement.reviews} reviews`}
                    icon={<Star className="h-5 w-5 text-[#F59E0B]" />}
                    iconBg="bg-[#FEF3C7]"
                    gradient="bg-gradient-to-b from-[#F59E0B]/[6%] to-white"
                  />
                </Link>
              </div>
            </div>

            {/* SECTION 2: Appointments Pipeline for Focused Date */}
            <Panel
              title={selectedDate === todayIso ? 'Today’s Live Appointments Pipeline' : `Appointments Pipeline for ${selectedDate}`}
              note={
                selectedDate === todayIso
                  ? 'Real-time booking progress for today across every shop and independent barber'
                  : `Bookings recorded for ${selectedDate} across every shop and independent barber`
              }
              actions={
                <Link href={`/bookings`} className="inline-flex items-center gap-1 text-[12px] font-bold text-[#635BFF] hover:underline">
                  Open bookings ledger <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-center transition-all hover:border-[#CBD5E1]">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase">Total Booked</span>
                  <p className="mt-1 text-2xl font-extrabold text-[#1E293B] tabular-nums">{count(focusedDateBreakdown.total)}</p>
                  <span className="text-[11px] font-medium text-[#94A3B8]">
                    {selectedDate === todayIso ? 'For today' : selectedDate}
                  </span>
                </div>

                <div className="rounded-lg border border-[#BAE6FD] bg-[#F0F9FF] p-3 text-center transition-all hover:border-[#7DD3FC]">
                  <span className="text-[11px] font-bold text-[#0284C7] uppercase">Waiting / Upcoming</span>
                  <p className="mt-1 text-2xl font-extrabold text-[#0369A1] tabular-nums">{count(focusedDateBreakdown.waiting)}</p>
                  <span className="text-[11px] font-medium text-[#0284C7]">Pending service</span>
                </div>

                <div className="rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] p-3 text-center transition-all hover:border-[#C4B5FD]">
                  <span className="text-[11px] font-bold text-[#7C3AED] uppercase">In Chair</span>
                  <p className="mt-1 text-2xl font-extrabold text-[#6D28D9] tabular-nums">{count(focusedDateBreakdown.inChair)}</p>
                  <span className="text-[11px] font-medium text-[#7C3AED]">Now in progress</span>
                </div>

                <div className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-center transition-all hover:border-[#86EFAC]">
                  <span className="text-[11px] font-bold text-[#16A34A] uppercase">Completed</span>
                  <p className="mt-1 text-2xl font-extrabold text-[#15803D] tabular-nums">{count(focusedDateBreakdown.done)}</p>
                  <span className="text-[11px] font-medium text-[#16A34A]">Finished & paid</span>
                </div>

                <div className="rounded-lg border border-[#FECDD3] bg-[#FFF1F2] p-3 text-center transition-all hover:border-[#FDA4AF]">
                  <span className="text-[11px] font-bold text-[#E11D48] uppercase">Cancelled / No-show</span>
                  <p className="mt-1 text-2xl font-extrabold text-[#BE123C] tabular-nums">{count(focusedDateBreakdown.cancelled)}</p>
                  <span className="text-[11px] font-medium text-[#E11D48]">Not completed</span>
                </div>
              </div>
            </Panel>

            {/* SECTION 3: Comprehensive Date-Wise Progress Table */}
            <DailyProgressTable
              overview={o}
              selectedDate={selectedDate}
              onSelectDate={handleDateChange}
            />

            {/* SECTION 4: Bookings Volume & Outcomes */}
            <div>
              <SectionHeading
                icon={CalendarCheck}
                title="Booking Trends & Outcomes"
                subtitle="Daily booking volume, resolution distribution, and cancellation root causes"
                badge="Volume"
              />
              <div className="mt-3.5 grid gap-5 lg:grid-cols-3">
                <Panel
                  title="Bookings made per day"
                  note="Stacked by outcome · Click any day column to focus that date"
                  className="lg:col-span-2"
                  actions={<Link href="/bookings" className="text-[12px] font-bold text-[#635BFF] hover:underline">All bookings</Link>}
                >
                  <StackedColumns
                    points={o.bookings.byDay.map(({ day, ...values }) => ({ label: shortDay(day), values }))}
                    series={[
                      { key: 'completed', label: 'Completed', color: OUTCOME_COLORS.completed },
                      { key: 'upcoming', label: 'Open / upcoming', color: OUTCOME_COLORS.open },
                      { key: 'cancelled', label: 'Cancelled', color: OUTCOME_COLORS.cancelled },
                      { key: 'noShow', label: 'No-show', color: OUTCOME_COLORS.noShow },
                    ]}
                    activeLabel={shortDay(selectedDate)}
                    onSelect={(_, idx) => {
                      const target = o.bookings.byDay[idx];
                      if (target) handleDateChange(target.day);
                    }}
                  />
                </Panel>

                <Panel title="Outcomes" note={`${count(o.bookings.total)} bookings (${o.bookings.app} app · ${o.bookings.walkIns} walk-ins)`}>
                  <Donut
                    centre={count(o.bookings.total)}
                    parts={[
                      { label: 'Completed', value: o.bookings.completed, color: OUTCOME_COLORS.completed },
                      { label: 'Open / upcoming', value: o.bookings.open, color: OUTCOME_COLORS.open },
                      { label: 'Cancelled', value: o.bookings.cancelled, color: OUTCOME_COLORS.cancelled },
                      { label: 'No-show', value: o.bookings.noShow, color: OUTCOME_COLORS.noShow },
                    ]}
                  />
                </Panel>
              </div>
            </div>

            {/* SECTION 5: Financial Velocity & Cash Breakdown */}
            <div>
              <SectionHeading
                icon={Banknote}
                title="Revenue Velocity & Settlements"
                subtitle="Cash settlements recorded by shops and independent barbers"
                badge="Finance"
              />
              <div className="mt-3.5 grid gap-5 lg:grid-cols-3">
                <Panel
                  title="Cash per day"
                  note="Payments recorded at shop counters (SalunBD is cash-only) · Click any bar to focus date"
                  className="lg:col-span-2"
                  actions={<Link href="/money" className="text-[12px] font-bold text-[#635BFF] hover:underline">Full ledger</Link>}
                >
                  <Columns
                    points={o.money.byDay.map((d) => ({ label: shortDay(d.day), value: d.amount }))}
                    color="#16A34A"
                    format={money}
                    activeLabel={shortDay(selectedDate)}
                    onSelect={(_, idx) => {
                      const target = o.money.byDay[idx];
                      if (target) handleDateChange(target.day);
                    }}
                  />
                </Panel>

                <Panel title="Money at a glance" note="Settlements and platform liability">
                  <MiniList rows={[
                    { label: `Cash (${periodLabel})`, value: money(o.money.cash) },
                    { label: 'Average order ticket', value: money(o.money.averageTicket) },
                    { label: 'Cash, all time', value: money(o.money.allTime) },
                    { label: 'Coupon discounts given', value: money(o.money.couponDiscounts) },
                    { label: 'Gift card balances owed', value: money(o.money.giftCardsOwed) },
                  ]} />
                </Panel>
              </div>
            </div>

            {/* SECTION 6: User Ecosystem & Growth Dynamics */}
            <div>
              <SectionHeading
                icon={Users}
                title="User Ecosystem & Network Growth"
                subtitle="Account distribution across customer and partner demographics"
                badge="Community"
              />
              <div className="mt-3.5 grid gap-5 lg:grid-cols-3">
                <Panel title="Who is on SalunBD" note={`${count(o.people.total)} registered accounts`}>
                  <Donut
                    centre={count(o.people.total)}
                    parts={[
                      { label: 'Customers', value: o.people.customers, color: '#635BFF' },
                      { label: 'Shop owners', value: o.people.owners, color: '#0EA5E9' },
                      { label: 'Barbers in a shop', value: o.people.shopBarbers, color: '#16A34A' },
                      { label: 'Independent barbers', value: o.people.independentBarbers, color: '#F59E0B' },
                      { label: 'Admins', value: o.people.admins, color: '#94A3B8' },
                    ]}
                  />
                  <p className="mt-3 text-[12px] font-semibold text-[#64748B]">
                    {o.people.unverified} haven&apos;t verified their email · {o.people.banned} banned
                  </p>
                </Panel>

                <Panel title="New sign-ups per day" note={`Last ${periodLabel} · Click bar to focus date`} className="lg:col-span-2">
                  <StackedColumns
                    points={o.signups.map((s) => ({ label: shortDay(s.day), values: { customers: s.customers, partners: s.partners } }))}
                    series={[
                      { key: 'customers', label: 'Customers', color: '#635BFF' },
                      { key: 'partners', label: 'Partners (owners & barbers)', color: '#F59E0B' },
                    ]}
                    activeLabel={shortDay(selectedDate)}
                    onSelect={(_, idx) => {
                      const target = o.signups[idx];
                      if (target) handleDateChange(target.day);
                    }}
                  />
                </Panel>
              </div>

              <div className="mt-4 grid gap-5 lg:grid-cols-3">
                <Panel
                  title="People using the apps"
                  note="Signed in at least once in the period"
                  actions={<Link href="/logins" className="text-[12px] font-bold text-[#635BFF] hover:underline">Daily logins</Link>}
                >
                  <MiniList rows={[
                    { label: 'Today', value: `${o.active.day.total} (${o.active.day.customers} customers · ${o.active.day.partners} partners)` },
                    { label: 'Last 7 days', value: `${o.active.week.total} (${o.active.week.customers} · ${o.active.week.partners})` },
                    { label: 'Last 30 days', value: `${o.active.month.total} (${o.active.month.customers} · ${o.active.month.partners})` },
                  ]} />
                </Panel>

                <Panel title="Shops and barbers" note={`${o.places.newShops} new shops in ${periodLabel}`}>
                  <MiniList rows={[
                    { label: 'Shops', value: `${o.places.shops} (${o.places.shopsVisible} visible${o.places.shopsSuspended ? `, ${o.places.shopsSuspended} suspended` : ''})` },
                    { label: 'Independent barbers', value: `${o.places.independentBarbers} (${o.places.barbersVisible} visible)` },
                    { label: 'Active services', value: o.places.activeServices },
                    { label: 'Barbers working in shops', value: o.places.teamMembers },
                  ]} />
                </Panel>

                <Panel title="Where customers are" note="City of saved customer addresses">
                  <Bars rows={o.engagement.customersByCity.map((c) => ({ label: c.key, value: c.count }))} />
                </Panel>
              </div>
            </div>

            {/* SECTION 7: Marketplace Quality & Demographics */}
            <div>
              <SectionHeading
                icon={BarChart3}
                title="Marketplace Operations & Service Demand"
                subtitle="Cancellation attributions, top performing shops, services, and ratings"
                badge="Quality"
              />
              <div className="mt-3.5 grid gap-5 lg:grid-cols-3">
                <Panel title="Who cancelled" note={`${percent(o.bookings.cancelRate)} of bookings cancelled or no-show`}>
                  <Bars rows={[
                    { label: 'Customer', value: o.bookings.cancelledBy.customer, color: '#F59E0B', href: '/bookings?cancelledBy=CUSTOMER' },
                    { label: 'Shop / barber', value: o.bookings.cancelledBy.shop, color: '#FB7185', href: '/bookings?cancelledBy=SHOP' },
                    { label: 'System (not accepted / time passed)', value: o.bookings.cancelledBy.system, color: '#94A3B8', href: '/bookings?cancelledBy=SYSTEM' },
                    { label: 'SalunBD admin', value: o.bookings.cancelledBy.admin, color: '#635BFF', href: '/bookings?cancelledBy=ADMIN' },
                  ]} />
                </Panel>

                <Panel title="Busiest shops and barbers" note="Bookings made in the period">
                  <Bars rows={o.top.places.map((p) => ({ label: p.name, value: p.bookings, href: placeHref(p.key) }))} />
                </Panel>

                <Panel title="Most booked services" note="Popular services across platform">
                  <Bars rows={o.top.services.map((s) => ({ label: s.name, value: s.bookings, color: '#0EA5E9' }))} />
                </Panel>
              </div>

              <div className="mt-4 grid gap-5 lg:grid-cols-3">
                <Panel title="Ratings distribution" note={`${o.engagement.reviews} reviews · ${o.engagement.unansweredReviews} without a reply`}>
                  <Bars rows={o.engagement.ratingDistribution.map((r) => ({
                    label: `${r.stars} stars`,
                    value: r.count,
                    color: r.stars <= 2 ? '#EF4444' : r.stars === 3 ? '#F59E0B' : '#16A34A',
                  }))} />
                </Panel>

                <Panel title="App activity" note={`Last ${periodLabel}`}>
                  <MiniList rows={[
                    { label: 'Chat messages sent', value: count(o.engagement.chatMessages) },
                    { label: 'Notifications delivered', value: count(o.engagement.notificationsSent) },
                    { label: 'Favourites added', value: count(o.engagement.favoritesAdded) },
                    { label: 'Saved addresses', value: count(o.engagement.savedAddresses) },
                  ]} />
                </Panel>

                <Panel title="Most active customers" note="Bookings made in the period">
                  <Bars rows={o.top.customers.map((c) => ({
                    label: c.name ?? c.userId.slice(0, 8),
                    value: c.bookings,
                    href: `/users/${c.userId}`,
                    color: '#635BFF',
                  }))} />
                </Panel>
              </div>
            </div>

            {/* SECTION 8: Infrastructure & Telemetry Health */}
            <div>
              <SectionHeading
                icon={Layers}
                title="System Infrastructure & Telemetry"
                subtitle="Live readiness and latency probes against production API and storage"
                badge="Health"
              />
              <div className="mt-3.5">
                <ClusterHealthWidget />
              </div>
            </div>
          </div>
        )}
      </Canvas>
    </>
  );
}
