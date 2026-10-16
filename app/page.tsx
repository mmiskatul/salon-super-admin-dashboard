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
        lede="Real-time network analytics across all customers, partner salons, appointments, daily progress, and revenue settlements."
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
            {/* Top Date Filter & Focused Date Status Ribbon */}
            <DateWiseProgressFilter
              days={days}
              onDaysChange={setDays}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              overviewData={o}
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

            {/* Core Platform KPIs (4 Hero Cards) */}
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

              {/* Active Users */}
              <Link href="/growth" className="block focus-visible:outline-2 focus-visible:outline-[#635BFF]">
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-4.5 shadow-xs transition-all hover:border-[#10B981]/40 hover:shadow-sm">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Active This Week</span>
                    <div className="h-8 w-8 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
                      <Activity className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl md:text-3xl font-extrabold text-[#1E293B] tabular-nums">
                    {count(o.active.week.total)}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[12px]">
                    <span className="inline-flex items-center gap-1 font-bold text-[#10B981]">
                      <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                      {o.active.day.total} online today
                    </span>
                    <span className="text-[#94A3B8]">· {o.active.month.total} monthly</span>
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

            {/* Micro-Metrics Bar */}
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
                <span className="text-[#64748B] font-semibold">Coupons Given:</span>
                <b className="text-[#1E293B] tabular-nums">{money(o.money.couponDiscounts)}</b>
              </div>
              <div className="flex items-center justify-between px-2 sm:border-l sm:border-[#E2E8F0]">
                <span className="text-[#64748B] font-semibold">All-Time Cash:</span>
                <b className="text-[#15803D] tabular-nums">{money(o.money.allTime)}</b>
              </div>
            </div>

            {/* Visual Analytics Row 1: Bookings Trajectory & Outcomes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Panel
                title="Bookings Made Per Day"
                note={`Daily appointment volume by status · Click any bar to focus date`}
                className="lg:col-span-2"
                actions={
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-[#16A34A]"><span className="h-2 w-2 rounded-full bg-[#16A34A]" /> Completed</span>
                    <span className="flex items-center gap-1 text-[#635BFF]"><span className="h-2 w-2 rounded-full bg-[#635BFF]" /> Open</span>
                    <span className="flex items-center gap-1 text-[#F59E0B]"><span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Cancelled</span>
                  </div>
                }
              >
                <BookingsTrendChart
                  data={o.bookings.byDay}
                  selectedDate={selectedDate}
                  onSelectDate={handleDateChange}
                />
              </Panel>

              <Panel
                title="Appointment Outcomes"
                note={`${count(o.bookings.total)} bookings across network`}
              >
                <DonutBreakdownChart
                  centreLabel="Bookings"
                  total={o.bookings.total}
                  parts={[
                    { name: 'Completed', value: o.bookings.completed, color: '#16A34A' },
                    { name: 'Open / Upcoming', value: o.bookings.open, color: '#635BFF' },
                    { name: 'Cancelled', value: o.bookings.cancelled, color: '#F59E0B' },
                    { name: 'No-Show', value: o.bookings.noShow, color: '#EF4444' },
                  ]}
                />
              </Panel>
            </div>

            {/* Visual Analytics Row 2: Revenue Velocity & Financial Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Panel
                title="Cash Collected Per Day"
                note={`Settled payments recorded at shop counters · Click any date to focus`}
                className="lg:col-span-2"
                actions={
                  <Link href="/money" className="text-[12px] font-bold text-[#16A34A] hover:underline">
                    View Ledger <ArrowUpRight className="inline h-3 w-3" />
                  </Link>
                }
              >
                <RevenueTrendChart
                  data={o.money.byDay}
                  selectedDate={selectedDate}
                  onSelectDate={handleDateChange}
                />
              </Panel>

              <Panel title="Financial Pulse" note="Settlements and platform velocity">
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

            {/* Visual Analytics Row 3: User Ecosystem & Signups Trajectory */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Panel
                title="Account Composition"
                note={`${count(o.people.total)} registered users`}
              >
                <DonutBreakdownChart
                  centreLabel="Accounts"
                  total={o.people.total}
                  parts={[
                    { name: 'Customers', value: o.people.customers, color: '#635BFF' },
                    { name: 'Shop Owners', value: o.people.owners, color: '#0EA5E9' },
                    { name: 'Barbers in Shop', value: o.people.shopBarbers, color: '#16A34A' },
                    { name: 'Independent Barbers', value: o.people.independentBarbers, color: '#F59E0B' },
                    { name: 'Admins', value: o.people.admins, color: '#94A3B8' },
                  ]}
                />
              </Panel>

              <Panel
                title="New Sign-ups Per Day"
                note={`Customer vs Partner registrations over ${periodLabel}`}
                className="lg:col-span-2"
                actions={
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-[#635BFF]"><span className="h-2 w-2 rounded-full bg-[#635BFF]" /> Customers</span>
                    <span className="flex items-center gap-1 text-[#F59E0B]"><span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Partners</span>
                  </div>
                }
              >
                <SignupsTrendChart
                  data={o.signups}
                  selectedDate={selectedDate}
                  onSelectDate={handleDateChange}
                />
              </Panel>
            </div>

            {/* Visual Analytics Row 4: Operational Quality & Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Cancellation Root Causes */}
              <Panel
                title="Cancellation Attribution"
                note={`${percent(o.bookings.cancelRate)} cancellation rate`}
                actions={
                  <Link href="/bookings" className="text-[11px] font-bold text-[#635BFF] hover:underline">
                    Bookings <ArrowUpRight className="inline h-3 w-3" />
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

              {/* Busiest Salons & Barbers */}
              <Panel
                title="Top Performing Places"
                note="Appointments in this period"
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

              {/* Geographic Demand */}
              <Panel
                title="Geographic Customer Demand"
                note="Saved customer addresses by city"
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
