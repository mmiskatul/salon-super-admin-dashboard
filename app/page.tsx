'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  Megaphone,
  RotateCw,
  Users,
  Store,
  CalendarCheck,
  Banknote,
  Star,
  Activity,
  CreditCard,
  Tag,
  ShieldCheck,
  MapPin,
  TrendingUp,
  BarChart3,
  Layers,
  MessageSquare,
  Bell,
  Heart,
  Scissors,
  Award,
  Smartphone,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { getOverview, type InsightDays } from '@/lib/api/insights';
import { placeHref } from '@/lib/placeHref';
import { count, money } from '@/lib/format';
import { Button, Canvas, Failed, Loading, PageHead, Panel } from '@/components/ui/primitives';
import ClusterHealthWidget from '@/components/overview/ClusterHealthWidget';
import { DateWiseProgressFilter } from '@/components/overview/DateWiseProgressFilter';
import { DailyProgressTable } from '@/components/overview/DailyProgressTable';
import {
  BookingsTrendChart,
  RevenueTrendChart,
  DonutBreakdownChart,
  SignupsTrendChart,
  RankingHorizontalChart,
} from '@/components/overview/OverviewRecharts';
import { percent } from '@/components/insights/Bits';

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

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // Auto-widen range if selected date is further back than current period
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

  const periodLabel = days === 1 ? 'today' : days === 7 ? '7 days' : days === 30 ? '30 days' : days === 365 ? '1 year' : `${days} days`;
  const periodShort = days === 1 ? 'Day' : days === 7 ? 'Week' : days === 30 ? 'Month' : days === 365 ? 'Year' : `${days}d`;

  return (
    <>
      <PageHead
        eyebrow="Command centre"
        title="Platform overview"
        lede="Real-time 360° multi-tenant analytics across accounts, salon supply, booking channels, revenue velocity, and customer engagement."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/broadcasts">
              <Button variant="outline">
                <Megaphone className="h-4 w-4" /> Broadcast
              </Button>
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
          <Loading label="Reading the whole platform..." />
        ) : (
          <div className="space-y-6 font-manrope">
            {/* Top Date Filter Toolbar */}
            <DateWiseProgressFilter
              days={days}
              onDaysChange={setDays}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              onClearDateFilter={handleClearDate}
            />

            {/* Action Required Banner (Only when items need attention) */}
            {(o.attention.openReports > 0 || o.attention.openTickets > 0 || o.attention.hiddenListings > 0) && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3.5 text-[13px] shadow-xs">
                <div className="flex flex-wrap items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-[#B45309] shrink-0" aria-hidden />
                  <span className="font-bold text-[#92400E]">Action items:</span>
                  <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    {o.attention.openReports > 0 && (
                      <Link href="/reports" className="inline-flex items-center gap-1 rounded-md bg-white border border-[#FDE68A] px-2 py-0.5 font-bold text-[#92400E] hover:underline">
                        <span>{o.attention.openReports} open report{o.attention.openReports === 1 ? '' : 's'}</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    )}
                    {o.attention.openTickets > 0 && (
                      <Link href="/support" className="inline-flex items-center gap-1 rounded-md bg-white border border-[#FDE68A] px-2 py-0.5 font-bold text-[#92400E] hover:underline">
                        <span>{o.attention.openTickets} support ticket{o.attention.openTickets === 1 ? '' : 's'}</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    )}
                    {o.attention.hiddenListings > 0 && (
                      <Link href="/readiness" className="inline-flex items-center gap-1 rounded-md bg-white border border-[#FDE68A] px-2 py-0.5 font-bold text-[#92400E] hover:underline">
                        <span>{o.attention.hiddenListings} shop{o.attention.hiddenListings === 1 ? '' : 's'}/barbers hidden</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Platform Vital Signs Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 pt-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635BFF]/10 text-[#635BFF]">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[#1E293B]">Platform Vital Signs</h2>
                  <p className="text-[11px] font-medium text-[#64748B]">
                    Key performance indicators dynamically filtered for {periodLabel}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[10px] font-bold text-[#635BFF] uppercase tracking-wider">
                {periodShort} View Active
              </span>
            </div>

            {/* Core Platform KPIs (4 Hero Cards - Filter-wise) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Bookings */}
              <Link href="/bookings" className="block focus-visible:outline-2 focus-visible:outline-[#635BFF]">
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-4.5 shadow-xs transition-all hover:border-[#635BFF]/40 hover:shadow-sm">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Bookings ({periodShort})</span>
                    <div className="h-8 w-8 rounded-lg bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center">
                      <CalendarCheck className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl md:text-3xl font-extrabold text-[#1E293B] tabular-nums">
                    {count(o.bookings.total)}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[12px]">
                    <span className="inline-block rounded-md bg-[#DCFCE7] px-1.5 py-0.5 text-[11px] font-bold text-[#15803D]">
                      {percent(o.bookings.completionRate)} completed
                    </span>
                    <span className="text-[#94A3B8]">· {o.bookings.app} app / {o.bookings.walkIns} walk-in</span>
                  </div>
                </div>
              </Link>

              {/* Cash Recorded */}
              <Link href="/money" className="block focus-visible:outline-2 focus-visible:outline-[#635BFF]">
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-4.5 shadow-xs transition-all hover:border-[#16A34A]/40 hover:shadow-sm">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Cash Recorded ({periodShort})</span>
                    <div className="h-8 w-8 rounded-lg bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center">
                      <Banknote className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl md:text-3xl font-extrabold text-[#15803D] tabular-nums">
                    {money(o.money.cash)}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[12px]">
                    <span className="inline-block rounded-md bg-[#DCFCE7] px-1.5 py-0.5 text-[11px] font-bold text-[#15803D]">
                      {o.money.payments} payments
                    </span>
                    <span className="text-[#94A3B8]">· {money(o.money.averageTicket)} avg ticket</span>
                  </div>
                </div>
              </Link>

              {/* Active Users - Dynamic according to filter */}
              <Link href="/growth" className="block focus-visible:outline-2 focus-visible:outline-[#635BFF]">
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-4.5 shadow-xs transition-all hover:border-[#10B981]/40 hover:shadow-sm">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {days === 1
                        ? 'Active Today'
                        : days === 7
                        ? 'Active This Week'
                        : days === 30 || days === 90
                        ? 'Active This Month'
                        : 'Active Users (Annual)'}
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
                      <Activity className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl md:text-3xl font-extrabold text-[#1E293B] tabular-nums">
                    {count(
                      days === 1
                        ? o.active.day.total
                        : days === 7
                        ? o.active.week.total
                        : o.active.month.total,
                    )}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[12px]">
                    <span className="inline-flex items-center gap-1 font-bold text-[#10B981]">
                      <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                      {days === 1
                        ? `${o.active.day.customers} cust · ${o.active.day.partners} part`
                        : days === 7
                        ? `${o.active.day.total} online today`
                        : `${o.active.week.total} active this week`}
                    </span>
                    <span className="text-[#94A3B8]">
                      · {days === 1 ? 'Live today' : days === 7 ? `${o.active.week.customers} customers` : `${o.active.month.customers} customers`}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Salons & Barbers */}
              <Link href="/readiness" className="block focus-visible:outline-2 focus-visible:outline-[#635BFF]">
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-4.5 shadow-xs transition-all hover:border-[#8B5CF6]/40 hover:shadow-sm">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Verified Places</span>
                    <div className="h-8 w-8 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center">
                      <Store className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl md:text-3xl font-extrabold text-[#1E293B] tabular-nums">
                    {o.places.shopsVisible + o.places.barbersVisible}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[12px]">
                    <span className="inline-block rounded-md bg-[#EDE9FE] px-1.5 py-0.5 text-[11px] font-bold text-[#6D28D9]">
                      {o.places.shops} shops
                    </span>
                    <span className="text-[#94A3B8]">· {o.places.independentBarbers} independent</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Micro-Metrics Bar: Whole Platform Footprint */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-[#E2E8F0] bg-[#FAFBFD] p-3 text-[12px]">
              <div className="flex items-center justify-between px-2">
                <span className="text-[#64748B] font-semibold">Total Accounts:</span>
                <b className="text-[#1E293B] tabular-nums">{count(o.people.total)} (+{o.people.newInPeriod} new)</b>
              </div>
              <div className="flex items-center justify-between px-2 sm:border-l sm:border-[#E2E8F0]">
                <span className="text-[#64748B] font-semibold">Rating Quality:</span>
                <b className="text-[#1E293B] tabular-nums">{o.engagement.averageRating ? `${o.engagement.averageRating} ★` : '—'} ({o.engagement.reviews} rev)</b>
              </div>
              <div className="flex items-center justify-between px-2 sm:border-l sm:border-[#E2E8F0]">
                <span className="text-[#64748B] font-semibold">Catalog Services:</span>
                <b className="text-[#1E293B] tabular-nums">{count(o.places.activeServices)} across {o.places.shops} shops</b>
              </div>
              <div className="flex items-center justify-between px-2 sm:border-l sm:border-[#E2E8F0]">
                <span className="text-[#64748B] font-semibold">All-Time Cash:</span>
                <b className="text-[#15803D] tabular-nums">{money(o.money.allTime)}</b>
              </div>
            </div>

            {/* Visual Analytics Row 1: Bookings Trajectory & Outcomes */}
            {(() => {
              const timelineUnit = o.timeline?.unit ?? (days === 1 ? 'hour' : days === 7 ? 'day' : days <= 90 ? 'week' : 'month');
              const bookingsData = o.timeline?.bookings ?? o.bookings.timeline ?? o.bookings.byDay;
              const moneyData = o.timeline?.money ?? o.money.timeline ?? o.money.byDay;

              const bookingsTitle =
                timelineUnit === 'hour'
                  ? `Bookings on ${selectedDate} (Hourly View)`
                  : timelineUnit === 'day'
                  ? `Bookings Made Per Day (Weekly View)`
                  : timelineUnit === 'week'
                  ? `Bookings Made Per Week (Monthly View)`
                  : `Bookings Made Per Month (Annual View)`;

              const bookingsNote =
                timelineUnit === 'hour'
                  ? `Hourly appointment distribution for ${selectedDate} (${count(o.bookings.total)} total) · ${percent(o.bookings.completionRate)} completed`
                  : timelineUnit === 'day'
                  ? `Daily appointment volume for ${periodLabel} (${count(o.bookings.total)} total) · Click bar to focus date`
                  : timelineUnit === 'week'
                  ? `Weekly appointment trajectory across ${periodLabel} (${count(o.bookings.total)} total)`
                  : `Monthly appointment trajectory over the past year (${count(o.bookings.total)} total)`;

              const cashTitle =
                timelineUnit === 'hour'
                  ? `Cash Collected on ${selectedDate} (Hourly View)`
                  : timelineUnit === 'day'
                  ? `Cash Collected Per Day (Weekly View)`
                  : timelineUnit === 'week'
                  ? `Cash Collected Per Week (Monthly View)`
                  : `Cash Collected Per Month (Annual View)`;

              const cashNote =
                timelineUnit === 'hour'
                  ? `Hourly counter receipts recorded for ${selectedDate} (${money(o.money.cash)} total · ${count(o.money.payments)} payments)`
                  : timelineUnit === 'day'
                  ? `Daily settled payments recorded for ${periodLabel} (${money(o.money.cash)} total · Click date to focus)`
                  : timelineUnit === 'week'
                  ? `Weekly revenue velocity across ${periodLabel} (${money(o.money.cash)} total)`
                  : `Monthly settled revenue trajectory over the past year (${money(o.money.cash)} total)`;

              const granularityBadge =
                timelineUnit === 'hour'
                  ? 'Hourly View'
                  : timelineUnit === 'day'
                  ? 'Daily View'
                  : timelineUnit === 'week'
                  ? 'Weekly View'
                  : 'Monthly View';

              return (
                <>
                  {/* Bookings Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <Panel
                      title={bookingsTitle}
                      note={bookingsNote}
                      className="lg:col-span-2"
                      actions={
                        <div className="flex items-center gap-2.5 text-[11px] font-bold">
                          <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-bold text-[#4338CA]">
                            {granularityBadge}
                          </span>
                          <span className="flex items-center gap-1 text-[#16A34A]"><span className="h-2 w-2 rounded-full bg-[#16A34A]" /> Completed</span>
                          <span className="flex items-center gap-1 text-[#635BFF]"><span className="h-2 w-2 rounded-full bg-[#635BFF]" /> Open</span>
                          <span className="flex items-center gap-1 text-[#F59E0B]"><span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Cancelled</span>
                        </div>
                      }
                    >
                      <BookingsTrendChart
                        data={bookingsData}
                        selectedDate={selectedDate}
                        onSelectDate={handleDateChange}
                        days={days}
                        unit={timelineUnit}
                      />
                    </Panel>

                    {/* Booking Channels & Fulfillment */}
                    <Panel
                      title={`Booking Channels (${periodShort} View)`}
                      note={`${count(o.bookings.total)} total bookings across app & salon walk-ins`}
                    >
                      <div className="space-y-4">
                        <DonutBreakdownChart
                          centreLabel="Bookings"
                          total={o.bookings.total}
                          parts={[
                            { name: 'Mobile In-App', value: o.bookings.app, color: '#635BFF' },
                            { name: 'Counter Walk-Ins', value: o.bookings.walkIns, color: '#0EA5E9' },
                          ]}
                        />

                        {/* Status Pills */}
                        <div className="grid grid-cols-3 gap-2 border-t border-[#F1F5F9] pt-3 text-center">
                          <div className="rounded-lg bg-[#DCFCE7]/60 p-2">
                            <span className="block text-[10px] font-bold text-[#15803D] uppercase">Completed</span>
                            <span className="text-base font-extrabold text-[#15803D] tabular-nums">{count(o.bookings.completed)}</span>
                          </div>
                          <div className="rounded-lg bg-[#EEF2FF] p-2">
                            <span className="block text-[10px] font-bold text-[#4338CA] uppercase">In Chair/Open</span>
                            <span className="text-base font-extrabold text-[#4338CA] tabular-nums">{count(o.bookings.open)}</span>
                          </div>
                          <div className="rounded-lg bg-[#FFE4E6] p-2">
                            <span className="block text-[10px] font-bold text-[#BE123C] uppercase">Cancelled</span>
                            <span className="text-base font-extrabold text-[#BE123C] tabular-nums">{count(o.bookings.cancelled + o.bookings.noShow)}</span>
                          </div>
                        </div>
                      </div>
                    </Panel>
                  </div>

                  {/* Revenue Velocity & Financial Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <Panel
                      title={cashTitle}
                      note={cashNote}
                      className="lg:col-span-2"
                      actions={
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold text-[#15803D]">
                            {granularityBadge}
                          </span>
                          <Link href="/money" className="text-[12px] font-bold text-[#16A34A] hover:underline">
                            View Ledger <ArrowUpRight className="inline h-3 w-3" />
                          </Link>
                        </div>
                      }
                    >
                      <RevenueTrendChart
                        data={moneyData}
                        selectedDate={selectedDate}
                        onSelectDate={handleDateChange}
                        days={days}
                        unit={timelineUnit}
                      />
                    </Panel>

                    <Panel title={`Financial Pulse (${periodShort} View)`} note={`Settlements and platform velocity in ${periodLabel}`}>
                      <div className="space-y-3 font-manrope">
                        <div className="rounded-lg bg-[#F8FAFC] p-3 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-[#64748B] uppercase">Total Cash ({periodShort})</span>
                            <p className="text-xl font-extrabold text-[#15803D] tabular-nums">{money(o.money.cash)}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-bold text-[#64748B] uppercase">Transactions</span>
                            <p className="text-lg font-bold text-[#1E293B] tabular-nums">{count(o.money.payments)}</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-[12px]">
                          <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                            <span className="text-[#64748B]">Average Order Ticket:</span>
                            <b className="text-[#1E293B] tabular-nums">{money(o.money.averageTicket)}</b>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                            <span className="text-[#64748B]">Coupon Discounts Given:</span>
                            <b className="text-[#1E293B] tabular-nums">{money(o.money.couponDiscounts)}</b>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                            <span className="text-[#64748B]">Gift Card Balances Owed:</span>
                            <b className="text-[#1E293B] tabular-nums">{money(o.money.giftCardsOwed)}</b>
                          </div>
                          <div className="flex items-center justify-between py-1">
                            <span className="text-[#64748B]">All-Time Network Cash:</span>
                            <b className="text-[#15803D] tabular-nums">{money(o.money.allTime)}</b>
                          </div>
                        </div>
                      </div>
                    </Panel>
                  </div>
                </>
              );
            })()}

            {/* Visual Analytics Row 3: User Ecosystem, Accounts Breakdown & Signups */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Account Composition (Role Breakdown Donut Requested) */}
              <Panel
                title="Account Breakdown"
                note={`${count(o.people.total)} registered accounts across all roles`}
                actions={
                  <Link href="/users" className="text-[11px] font-bold text-[#635BFF] hover:underline">
                    Users Directory <ArrowUpRight className="inline h-3 w-3" />
                  </Link>
                }
              >
                <div className="space-y-3.5">
                  <DonutBreakdownChart
                    centreLabel="Accounts"
                    total={o.people.total}
                    parts={[
                      { name: 'Customers', value: o.people.customers, color: '#635BFF' },
                      { name: 'Shop Owners', value: o.people.owners, color: '#0EA5E9' },
                      { name: 'Shop Barbers', value: o.people.shopBarbers, color: '#16A34A' },
                      { name: 'Independent Barbers', value: o.people.independentBarbers, color: '#F59E0B' },
                      { name: 'Admins', value: o.people.admins, color: '#94A3B8' },
                    ]}
                  />

                  {/* Account Quality & Status Tags */}
                  <div className="grid grid-cols-3 gap-2 border-t border-[#F1F5F9] pt-3 text-center text-[11px]">
                    <div className="rounded-lg bg-[#FAFBFD] p-2 border border-[#F1F5F9]">
                      <span className="block text-[10px] font-bold text-[#64748B] uppercase">New ({periodShort})</span>
                      <span className="text-sm font-extrabold text-[#635BFF] tabular-nums">+{count(o.people.newInPeriod)}</span>
                    </div>
                    <div className="rounded-lg bg-[#FAFBFD] p-2 border border-[#F1F5F9]">
                      <span className="block text-[10px] font-bold text-[#64748B] uppercase">Unverified</span>
                      <span className="text-sm font-extrabold text-[#F59E0B] tabular-nums">{count(o.people.unverified)}</span>
                    </div>
                    <div className="rounded-lg bg-[#FAFBFD] p-2 border border-[#F1F5F9]">
                      <span className="block text-[10px] font-bold text-[#64748B] uppercase">Banned</span>
                      <span className="text-sm font-extrabold text-[#EF4444] tabular-nums">{count(o.people.banned)}</span>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* New Signups Trajectory (Filter-wise) */}
              {(() => {
                const timelineUnit = o.timeline?.unit ?? (days === 1 ? 'hour' : days === 7 ? 'day' : days <= 90 ? 'week' : 'month');
                const signupsData = o.timeline?.signups ?? o.signups;

                const signupsTitle =
                  timelineUnit === 'hour'
                    ? `New Sign-ups on ${selectedDate} (Hourly View)`
                    : timelineUnit === 'day'
                    ? `New Sign-ups Per Day (Weekly View)`
                    : timelineUnit === 'week'
                    ? `New Sign-ups Per Week (Monthly View)`
                    : `New Sign-ups Per Month (Annual View)`;

                const signupsNote =
                  timelineUnit === 'hour'
                    ? `Customer vs Partner registrations throughout ${selectedDate} (${o.people.newInPeriod} new total)`
                    : timelineUnit === 'day'
                    ? `Customer vs Partner registrations over ${periodLabel} (${o.people.newInPeriod} new total) · Click bar to focus date`
                    : timelineUnit === 'week'
                    ? `Weekly new user acquisition across ${periodLabel} (${o.people.newInPeriod} new total)`
                    : `Monthly new user acquisition over the past year (${o.people.newInPeriod} new total)`;

                const granularityBadge =
                  timelineUnit === 'hour'
                    ? 'Hourly View'
                    : timelineUnit === 'day'
                    ? 'Daily View'
                    : timelineUnit === 'week'
                    ? 'Weekly View'
                    : 'Monthly View';

                return (
                  <Panel
                    title={signupsTitle}
                    note={signupsNote}
                    className="lg:col-span-2"
                    actions={
                      <div className="flex items-center gap-3 text-[11px] font-bold">
                        <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-bold text-[#4338CA]">
                          {granularityBadge}
                        </span>
                        <span className="flex items-center gap-1 text-[#635BFF]">
                          <span className="h-2 w-2 rounded-full bg-[#635BFF]" /> Customers
                        </span>
                        <span className="flex items-center gap-1 text-[#F59E0B]">
                          <span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Partners
                        </span>
                      </div>
                    }
                  >
                    <SignupsTrendChart
                      data={signupsData}
                      selectedDate={selectedDate}
                      onSelectDate={handleDateChange}
                      days={days}
                      unit={timelineUnit}
                    />
                  </Panel>
                );
              })()}
            </div>

            {/* Visual Analytics Row 4: Salon Network Health & Customer Satisfaction */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Salon Network & Marketplace Supply Health */}
              <Panel
                title="Salon Network & Supply Health"
                note={`${o.places.shops + o.places.independentBarbers} total partner businesses active in network`}
                actions={
                  <Link href="/readiness" className="text-[11px] font-bold text-[#635BFF] hover:underline">
                    Readiness Pipeline <ArrowUpRight className="inline h-3 w-3" />
                  </Link>
                }
              >
                <div className="space-y-4 font-manrope">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Listed Shops */}
                    <div className="rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-3.5">
                      <div className="flex items-center justify-between text-[#15803D]">
                        <span className="text-[11px] font-bold uppercase">Public Salons</span>
                        <Store className="h-4 w-4" />
                      </div>
                      <p className="mt-2 text-2xl font-extrabold text-[#15803D] tabular-nums">
                        {count(o.places.shopsVisible)}
                      </p>
                      <span className="text-[11px] font-semibold text-[#16A34A]">
                        of {o.places.shops} registered
                      </span>
                    </div>

                    {/* Barber Force */}
                    <div className="rounded-xl border border-[#EDE9FE] bg-[#FAF5FF] p-3.5">
                      <div className="flex items-center justify-between text-[#6D28D9]">
                        <span className="text-[11px] font-bold uppercase">Barbers Onboard</span>
                        <Scissors className="h-4 w-4" />
                      </div>
                      <p className="mt-2 text-2xl font-extrabold text-[#6D28D9] tabular-nums">
                        {count(o.places.teamMembers + o.places.independentBarbers)}
                      </p>
                      <span className="text-[11px] font-semibold text-[#7C3AED]">
                        {o.places.teamMembers} in shops · {o.places.independentBarbers} freelance
                      </span>
                    </div>

                    {/* Catalog Services */}
                    <div className="rounded-xl border border-[#E0F2FE] bg-[#F0F9FF] p-3.5 col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between text-[#0369A1]">
                        <span className="text-[11px] font-bold uppercase">Active Catalog</span>
                        <Tag className="h-4 w-4" />
                      </div>
                      <p className="mt-2 text-2xl font-extrabold text-[#0369A1] tabular-nums">
                        {count(o.places.activeServices)}
                      </p>
                      <span className="text-[11px] font-semibold text-[#0284C7]">
                        bookable services
                      </span>
                    </div>
                  </div>

                  {/* Supply Status Breakdown */}
                  <div className="rounded-xl bg-[#FAFBFD] border border-[#F1F5F9] p-3.5 space-y-2 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                        Publicly Listed Salons
                      </span>
                      <span className="font-bold text-[#1E293B] tabular-nums">{o.places.shopsVisible}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4 text-[#0EA5E9]" />
                        Listed Freelance Barbers
                      </span>
                      <span className="font-bold text-[#1E293B] tabular-nums">{o.places.barbersVisible}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] flex items-center gap-1.5">
                        <XCircle className="h-4 w-4 text-[#EF4444]" />
                        Suspended / Inactive Shops
                      </span>
                      <span className="font-bold text-[#EF4444] tabular-nums">{o.places.shopsSuspended}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-2">
                      <span className="text-[#64748B] flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-[#635BFF]" />
                        New Salons Joined ({periodShort})
                      </span>
                      <span className="font-bold text-[#635BFF] tabular-nums">+{o.places.newShops}</span>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Customer Satisfaction & Real-time Engagement */}
              <Panel
                title="Customer Satisfaction & Engagement"
                note={`${o.engagement.reviews} verified reviews recorded · ${o.engagement.chatMessages} chats`}
                actions={
                  <Link href="/reviews" className="text-[11px] font-bold text-[#635BFF] hover:underline">
                    All Reviews <ArrowUpRight className="inline h-3 w-3" />
                  </Link>
                }
              >
                <div className="space-y-4 font-manrope">
                  {/* Top Rating Summary Row */}
                  <div className="flex items-center justify-between rounded-xl bg-[#FAFBFD] border border-[#F1F5F9] p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#D97706]">
                        <Star className="h-6 w-6 fill-[#D97706]" />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-extrabold text-[#1E293B] tabular-nums">
                            {o.engagement.averageRating ? o.engagement.averageRating.toFixed(1) : '—'}
                          </span>
                          <span className="text-sm font-bold text-[#64748B]">/ 5.0</span>
                        </div>
                        <p className="text-[11px] font-medium text-[#64748B]">
                          Based on {count(o.engagement.reviews)} customer ratings
                        </p>
                      </div>
                    </div>

                    {o.engagement.unansweredReviews > 0 ? (
                      <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-[11px] font-bold text-[#B45309]">
                        {o.engagement.unansweredReviews} unreplied
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-[11px] font-bold text-[#15803D]">
                        All replied
                      </span>
                    )}
                  </div>

                  {/* 5-Star Distribution Bars */}
                  <div className="space-y-1.5">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const match = o.engagement.ratingDistribution.find((r) => r.stars === stars);
                      const starCount = match?.count ?? 0;
                      const pct = o.engagement.reviews > 0 ? Math.round((starCount / o.engagement.reviews) * 100) : 0;
                      return (
                        <div key={stars} className="flex items-center gap-2 text-[12px]">
                          <span className="w-8 font-bold text-[#64748B] flex items-center gap-0.5">
                            {stars} <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                          </span>
                          <div className="h-2 flex-1 rounded-full bg-[#F1F5F9] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: stars >= 4 ? '#16A34A' : stars === 3 ? '#F59E0B' : '#EF4444',
                              }}
                            />
                          </div>
                          <span className="w-10 text-right font-bold text-[#1E293B] tabular-nums">
                            {starCount}
                          </span>
                          <span className="w-9 text-right text-[11px] text-[#94A3B8] tabular-nums">
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Real-time Interaction Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 border-t border-[#F1F5F9] pt-3 text-center text-[11px]">
                    <div className="rounded-lg bg-[#FAFBFD] p-2">
                      <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#64748B] uppercase">
                        <MessageSquare className="h-3 w-3 text-[#635BFF]" /> Chats
                      </span>
                      <span className="text-sm font-extrabold text-[#1E293B] tabular-nums">{count(o.engagement.chatMessages)}</span>
                    </div>
                    <div className="rounded-lg bg-[#FAFBFD] p-2">
                      <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#64748B] uppercase">
                        <Bell className="h-3 w-3 text-[#0EA5E9]" /> Push Sent
                      </span>
                      <span className="text-sm font-extrabold text-[#1E293B] tabular-nums">{count(o.engagement.notificationsSent)}</span>
                    </div>
                    <div className="rounded-lg bg-[#FAFBFD] p-2">
                      <span className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#64748B] uppercase">
                        <Heart className="h-3 w-3 text-[#EC4899]" /> Favorites
                      </span>
                      <span className="text-sm font-extrabold text-[#1E293B] tabular-nums">{count(o.engagement.favoritesAdded)}</span>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Visual Analytics Row 5: Platform Leaderboards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Busiest Salons & Barbers */}
              <Panel
                title="Top Performing Places"
                note="Appointments booked in this period"
              >
                <RankingHorizontalChart
                  items={o.top.places.map((p) => ({
                    name: p.name,
                    value: p.bookings,
                    href: placeHref(p.key),
                  }))}
                  color="#635BFF"
                />
              </Panel>

              {/* Top Booked Services */}
              <Panel
                title="Top Booked Services"
                note="Most popular treatments in this period"
              >
                <RankingHorizontalChart
                  items={o.top.services.map((s) => ({
                    name: s.name,
                    value: s.bookings,
                  }))}
                  color="#16A34A"
                />
              </Panel>

              {/* Top VIP Customers */}
              <Panel
                title="Top Repeat Customers"
                note="Most frequent visitors across network"
              >
                <RankingHorizontalChart
                  items={o.top.customers.map((c) => ({
                    name: c.name || `User #${c.userId.slice(-6)}`,
                    value: c.bookings,
                    href: `/customers/${encodeURIComponent(c.userId)}`,
                  }))}
                  color="#0EA5E9"
                />
              </Panel>
            </div>

            {/* Visual Analytics Row 6: Operational Quality & Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Cancellation Root Causes */}
              <Panel
                title="Cancellation Attribution"
                note={`${percent(o.bookings.cancelRate)} cancellation rate across network`}
                actions={
                  <Link href="/bookings" className="text-[11px] font-bold text-[#635BFF] hover:underline">
                    View in Bookings <ArrowUpRight className="inline h-3 w-3" />
                  </Link>
                }
              >
                <RankingHorizontalChart
                  items={[
                    { name: 'Customer Initiated', value: o.bookings.cancelledBy.customer, href: '/bookings?cancelledBy=CUSTOMER' },
                    { name: 'Shop / Barber Initiated', value: o.bookings.cancelledBy.shop, href: '/bookings?cancelledBy=SHOP' },
                    { name: 'System (Time Passed / Unaccepted)', value: o.bookings.cancelledBy.system, href: '/bookings?cancelledBy=SYSTEM' },
                    { name: 'Admin Initiated', value: o.bookings.cancelledBy.admin, href: '/bookings?cancelledBy=ADMIN' },
                  ]}
                  color="#EF4444"
                />
              </Panel>

              {/* Geographic Demand */}
              <Panel
                title="Geographic Customer Demand"
                note="Saved customer addresses by city"
                actions={
                  <Link href="/map" className="text-[11px] font-bold text-[#0EA5E9] hover:underline">
                    Live Map View <ArrowUpRight className="inline h-3 w-3" />
                  </Link>
                }
              >
                <RankingHorizontalChart
                  items={o.engagement.customersByCity.map((c) => ({
                    name: c.key,
                    value: c.count,
                  }))}
                  color="#0EA5E9"
                />
              </Panel>
            </div>

            {/* Date-Wise Progress Breakdown Table */}
            <DailyProgressTable
              overview={o}
              selectedDate={selectedDate}
              onSelectDate={handleDateChange}
            />

            {/* Backend Infrastructure Telemetry */}
            <ClusterHealthWidget />
          </div>
        )}
      </Canvas>
    </>
  );
}
