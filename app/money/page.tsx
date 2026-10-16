'use client';

import React, { Suspense, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  Calendar,
  CheckCircle2,
  CreditCard,
  RotateCw,
  Scissors,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Wallet,
  Clock,
  Layers,
} from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { getOverview, getMoney, type InsightDays, type InsightPeriod } from '@/lib/api/insights';
import { placeHref } from '@/lib/placeHref';
import { count, money } from '@/lib/format';
import { Button, Canvas, Failed, Loading, PageHead, Panel } from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { DateWiseProgressFilter } from '@/components/overview/DateWiseProgressFilter';
import { RevenueTrendChart } from '@/components/overview/OverviewRecharts';

function MoneyLedgerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial filter from URL params (e.g., from Overview chart: /money?days=30&date=2026-10-16)
  const daysParam = searchParams.get('days');
  const dateParam = searchParams.get('date');

  const todayIso = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, []);

  const initialDays: InsightDays = useMemo(() => {
    if (daysParam === '1') return 1;
    if (daysParam === '7') return 7;
    if (daysParam === '30') return 30;
    if (daysParam === '90') return 90;
    if (daysParam === '365') return 365;
    return 30; // Default to Monthly / Weekly buckets
  }, [daysParam]);

  const initialDate = useMemo(() => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return dateParam;
    }
    return todayIso;
  }, [dateParam, todayIso]);

  const [days, setDays] = useState<InsightDays>(initialDays);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);

  // Sync state if URL searchParams change
  useEffect(() => {
    if (daysParam) {
      const parsedDays = Number(daysParam) as InsightDays;
      if ([1, 7, 30, 90, 365].includes(parsedDays)) {
        setDays(parsedDays);
      }
    }
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      setSelectedDate(dateParam);
    }
  }, [daysParam, dateParam]);

  // Update URL search parameters when filters change
  const handleDaysChange = (newDays: InsightDays) => {
    setDays(newDays);
    const params = new URLSearchParams(window.location.search);
    params.set('days', String(newDays));
    params.set('date', selectedDate);
    router.replace(`/money?${params.toString()}`);
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const params = new URLSearchParams(window.location.search);
    params.set('days', String(days));
    params.set('date', newDate);
    router.replace(`/money?${params.toString()}`);
  };

  const handleClearDate = () => {
    handleDateChange(todayIso);
  };

  // Fetch overview for timeline buckets and period money metrics
  const overviewApi = useApi(
    () => getOverview(days, selectedDate),
    [days, selectedDate],
    'money-overview',
  );

  // Fetch money insights for per-place and breakdown analytics
  const moneyApi = useApi(() => getMoney(days), [days], 'money-insights');

  const o = overviewApi.data;
  const m = moneyApi.data;

  const timelineUnit =
    o?.timeline?.unit ??
    (days === 1 ? 'hour' : days === 7 ? 'day' : days <= 90 ? 'week' : 'month');
  const moneyData = o?.timeline?.money ?? o?.money.timeline ?? o?.money.byDay ?? [];

  const periodLabel =
    days === 1
      ? 'today'
      : days === 7
      ? '7 days'
      : days === 30
      ? '30 days'
      : days === 365
      ? '1 year'
      : `${days} days`;

  const periodTitle =
    timelineUnit === 'hour'
      ? `Cash Collected on ${selectedDate} (Hourly Settlement Ledger)`
      : timelineUnit === 'day'
      ? `Cash Collected Per Day (Weekly Settlement Ledger)`
      : timelineUnit === 'week'
      ? `Cash Collected Per Week (Monthly Settlement Ledger)`
      : `Cash Collected Per Month (Annual Settlement Ledger)`;

  const granularityBadge =
    timelineUnit === 'hour'
      ? '24h Hourly View'
      : timelineUnit === 'day'
      ? '7-Day Daily View'
      : timelineUnit === 'week'
      ? 'Weekly Chunks View'
      : '12-Month Annual View';

  const totalPeriodCash = o?.money.cash ?? m?.cash.total ?? 0;
  const totalPeriodPayments = o?.money.payments ?? m?.cash.payments ?? 0;
  const avgTicket = o?.money.averageTicket ?? (totalPeriodPayments > 0 ? totalPeriodCash / totalPeriodPayments : 0);

  return (
    <>
      <PageHead
        eyebrow="Financial Treasury & Settlements"
        title="Cash Settlement Ledger"
        lede={`Audit settled counter receipts, payment volumes, coupon absorption, and gift card liabilities dynamically filtered for ${periodLabel}.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" /> Overview Dashboard
              </Button>
            </Link>
            <Button
              onClick={() => {
                overviewApi.refresh();
                moneyApi.refresh();
              }}
              disabled={overviewApi.loading || moneyApi.loading}
            >
              <RotateCw
                className={`h-4 w-4 ${overviewApi.loading || moneyApi.loading ? 'animate-spin' : ''}`}
              />{' '}
              Refresh
            </Button>
          </div>
        }
      />

      <Canvas>
        {overviewApi.error || moneyApi.error ? (
          <Failed
            message={overviewApi.error || moneyApi.error || 'Failed to load ledger data.'}
            onRetry={() => {
              overviewApi.refresh();
              moneyApi.refresh();
            }}
          />
        ) : !o || !m ? (
          <Loading label="Computing settlement ledger and cash receipts..." />
        ) : (
          <div className="space-y-6 font-manrope">
            {/* Top Date Filter & Timeframe Switcher */}
            <DateWiseProgressFilter
              days={days}
              onDaysChange={handleDaysChange}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              onClearDateFilter={handleClearDate}
            />

            {/* Financial Vital Signs Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Cash Recorded */}
              <div className="rounded-xl border border-[#DCFCE7] bg-white p-4.5 shadow-xs">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#15803D]">
                    Cash Recorded ({days === 1 ? 'Day' : days === 7 ? 'Week' : days === 30 ? 'Month' : 'Year'})
                  </span>
                  <div className="h-8 w-8 rounded-lg bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center">
                    <Banknote className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-2xl md:text-3xl font-extrabold text-[#15803D] tabular-nums">
                  {money(totalPeriodCash)}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[12px]">
                  <span className="inline-block rounded-md bg-[#DCFCE7] px-1.5 py-0.5 text-[11px] font-bold text-[#15803D]">
                    {count(totalPeriodPayments)} settlements
                  </span>
                  <span className="text-[#64748B]">· {granularityBadge}</span>
                </div>
              </div>

              {/* Average Order Ticket */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4.5 shadow-xs">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Average Order Ticket
                  </span>
                  <div className="h-8 w-8 rounded-lg bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-2xl md:text-3xl font-extrabold text-[#1E293B] tabular-nums">
                  {money(avgTicket)}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[12px]">
                  <span className="text-[#64748B]">Avg counter receipt per customer visit</span>
                </div>
              </div>

              {/* Coupon Discounts Given */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4.5 shadow-xs">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Coupons Absorbed
                  </span>
                  <div className="h-8 w-8 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center">
                    <Tag className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-2xl md:text-3xl font-extrabold text-[#B45309] tabular-nums">
                  {money(o.money.couponDiscounts)}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[12px]">
                  <span className="text-[#64748B]">
                    {m.coupons.bookingsWithCoupon} appointments discounted
                  </span>
                </div>
              </div>

              {/* All-Time Network Cash */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4.5 shadow-xs">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    All-Time Network Cash
                  </span>
                  <div className="h-8 w-8 rounded-lg bg-[#0EA5E9]/10 text-[#0EA5E9] flex items-center justify-center">
                    <Wallet className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-2xl md:text-3xl font-extrabold text-[#0369A1] tabular-nums">
                  {money(o.money.allTime)}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[12px]">
                  <span className="text-[#64748B]">
                    ৳{count(m.giftCards.outstanding)} gift cards owed
                  </span>
                </div>
              </div>
            </div>

            {/* Main Interactive Revenue Velocity Chart */}
            <Panel
              title={periodTitle}
              note={`Dynamic trajectory across ${periodLabel} · Selected date: ${selectedDate}`}
              actions={
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-bold text-[#15803D]">
                    {granularityBadge}
                  </span>
                  <span className="text-[12px] font-bold text-[#15803D] tabular-nums">
                    Total: {money(totalPeriodCash)}
                  </span>
                </div>
              }
            >
              <div className="space-y-4">
                <RevenueTrendChart
                  data={moneyData}
                  selectedDate={selectedDate}
                  onSelectDate={handleDateChange}
                  days={days}
                  unit={timelineUnit}
                />

                <div className="rounded-xl bg-[#FAFBFD] border border-[#F1F5F9] p-3 text-[12px] text-[#64748B] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#16A34A]" />
                    <span>
                      {timelineUnit === 'hour'
                        ? 'Showing 24 hourly settlements for the focused date. Click any hour to inspect.'
                        : timelineUnit === 'day'
                        ? 'Showing 7 calendar day bars. Click any day bar to zoom into its 24-hour ledger.'
                        : timelineUnit === 'week'
                        ? 'Showing 4-5 weekly settlement aggregations across the past 30 days.'
                        : 'Showing 12 monthly revenue totals across the past 365 days.'}
                    </span>
                  </div>
                  <span className="font-bold text-[#1E293B]">
                    {moneyData.length} timeline buckets active
                  </span>
                </div>
              </div>
            </Panel>

            {/* Granular Bucket-by-Bucket Ledger Breakdown Table */}
            <Panel
              title={`${timelineUnit.toUpperCase()} Settlement Breakdown Table`}
              note={`Detailed breakdown of cash intake and transaction volume per ${timelineUnit}`}
            >
              {!moneyData.length ? (
                <p className="py-8 text-center text-[12px] text-[#94A3B8]">
                  No financial activity recorded in this period.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#F1F5F9]">
                  <Scroll>
                    <Table>
                      <thead>
                        <Tr className="border-b border-[#E2E8F0] bg-[#FAFBFD] text-[11px] font-bold uppercase text-[#64748B]">
                          <Th className="py-3 pl-4">Time Bucket / Period</Th>
                          <Th className="py-3 text-right">Cash Intake</Th>
                          <Th className="py-3 text-right">Transactions</Th>
                          <Th className="py-3 text-right">Avg Ticket</Th>
                          <Th className="py-3 text-right pr-4">Share of Period</Th>
                        </Tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9] text-[13px]">
                        {moneyData.map((bucket: any, idx: number) => {
                          const bucketLabel = bucket.fullLabel || bucket.label || bucket.day || bucket.key || `Bucket #${idx + 1}`;
                          const bucketAmount = Number(bucket.amount) || 0;
                          const bucketPayments = Number(bucket.payments) || 0;
                          const bucketAvg = bucketPayments > 0 ? bucketAmount / bucketPayments : 0;
                          const pctShare = totalPeriodCash > 0 ? Math.round((bucketAmount / totalPeriodCash) * 100) : 0;

                          const isSelected = (bucket.day && bucket.day === selectedDate) || (bucket.key && bucket.key === selectedDate);

                          return (
                            <Tr
                              key={`${idx}-${bucketLabel}`}
                              className={`transition-colors hover:bg-[#F8FAFC] ${
                                isSelected ? 'bg-[#DCFCE7]/30 font-bold' : ''
                              }`}
                            >
                              <Td className="py-2.5 pl-4 font-bold text-[#1E293B]">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F1F5F9] text-[11px] font-extrabold text-[#64748B]">
                                    #{idx + 1}
                                  </span>
                                  <span>{bucketLabel}</span>
                                  {isSelected && (
                                    <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-extrabold text-[#15803D]">
                                      Selected
                                    </span>
                                  )}
                                </div>
                              </Td>
                              <Td className="py-2.5 text-right font-extrabold text-[#15803D] tabular-nums">
                                {money(bucketAmount)}
                              </Td>
                              <Td className="py-2.5 text-right font-bold text-[#1E293B] tabular-nums">
                                {count(bucketPayments)}
                              </Td>
                              <Td className="py-2.5 text-right font-semibold text-[#64748B] tabular-nums">
                                {money(bucketAvg)}
                              </Td>
                              <Td className="py-2.5 text-right pr-4">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="font-bold text-[#1E293B] tabular-nums">
                                    {pctShare}%
                                  </span>
                                  <div className="h-1.5 w-16 rounded-full bg-[#E2E8F0] overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-[#16A34A]"
                                      style={{ width: `${Math.max(4, pctShare)}%` }}
                                    />
                                  </div>
                                </div>
                              </Td>
                            </Tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </Scroll>
                </div>
              )}
            </Panel>

            {/* Entity Settlements: Cash by Salon Shop & Individual Barber */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Cash by Salon Shop / Barber */}
              <Panel
                title="Cash Collected by Salon / Barber"
                note={`Top revenue generating partners in ${periodLabel}`}
                className="lg:col-span-2"
                actions={
                  <Link href="/readiness" className="text-[11px] font-bold text-[#635BFF] hover:underline">
                    Partner Readiness <ArrowUpRight className="inline h-3 w-3" />
                  </Link>
                }
              >
                {!m.cash.byPlace.length ? (
                  <p className="py-8 text-center text-[12px] text-[#94A3B8]">
                    No partner settlements recorded yet.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-[#F1F5F9]">
                    <Scroll>
                      <Table>
                        <thead>
                          <Tr className="border-b border-[#E2E8F0] bg-[#FAFBFD] text-[11px] font-bold uppercase text-[#64748B]">
                            <Th className="py-2.5 pl-4">Partner Name</Th>
                            <Th className="py-2.5 text-right">Cash Settled</Th>
                            <Th className="py-2.5 text-right">Transactions</Th>
                            <Th className="py-2.5 text-right">Avg Ticket</Th>
                            <Th className="py-2.5 text-right pr-4">Action</Th>
                          </Tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9] text-[13px]">
                          {m.cash.byPlace.map((p, idx) => {
                            const isShop = !p.key.startsWith('barber:');
                            const href = placeHref(p.key);
                            const avgPlaceTicket = p.count > 0 ? p.amount / p.count : 0;
                            return (
                              <Tr key={p.key} className="hover:bg-[#F8FAFC]">
                                <Td className="py-2.5 pl-4 font-bold text-[#1E293B]">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#F1F5F9] text-[10px] font-bold text-[#64748B]">
                                      #{idx + 1}
                                    </span>
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-[#E2E8F0] text-[#635BFF]">
                                      {isShop ? <Store className="h-3 w-3" /> : <Scissors className="h-3 w-3" />}
                                    </div>
                                    <span className="truncate max-w-[200px]">{p.name}</span>
                                  </div>
                                </Td>
                                <Td className="py-2.5 text-right font-extrabold text-[#15803D] tabular-nums">
                                  {money(p.amount)}
                                </Td>
                                <Td className="py-2.5 text-right font-bold text-[#1E293B] tabular-nums">
                                  {count(p.count)}
                                </Td>
                                <Td className="py-2.5 text-right font-semibold text-[#64748B] tabular-nums">
                                  {money(avgPlaceTicket)}
                                </Td>
                                <Td className="py-2.5 text-right pr-4">
                                  <Link
                                    href={href}
                                    className="inline-flex items-center gap-1 rounded-md bg-white border border-[#E2E8F0] px-2 py-0.5 text-[11px] font-bold text-[#635BFF] hover:bg-[#635BFF] hover:text-white transition-all"
                                  >
                                    <span>Inspect</span>
                                    <ArrowUpRight className="h-3 w-3" />
                                  </Link>
                                </Td>
                              </Tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </Scroll>
                  </div>
                )}
              </Panel>

              {/* Payment Methods & Promotional Liabilities */}
              <div className="space-y-5">
                {/* Payment Methods */}
                <Panel title="Payment Methods" note="Settlement channels distribution">
                  <div className="space-y-2">
                    {m.cash.byMethod.map((method) => {
                      const pct = totalPeriodPayments > 0 ? Math.round((method.count / totalPeriodPayments) * 100) : 0;
                      return (
                        <div key={method.key} className="rounded-lg bg-[#FAFBFD] p-2.5 border border-[#F1F5F9]">
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="font-bold text-[#1E293B]">{method.key}</span>
                            <span className="font-extrabold text-[#15803D] tabular-nums">
                              {count(method.count)} ({pct}%)
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                            <div className="h-full rounded-full bg-[#16A34A]" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>

                {/* Gift Cards & Loyalty */}
                <Panel title="Outstanding Liabilities" note="Customer credit owed across salons">
                  <div className="space-y-2.5 text-[12px]">
                    <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                      <span className="text-[#64748B]">Gift Card Balances Owed:</span>
                      <b className="text-[#1E293B] tabular-nums">{money(m.giftCards.outstanding)}</b>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                      <span className="text-[#64748B]">Active Live Cards:</span>
                      <b className="text-[#1E293B] tabular-nums">{count(m.giftCards.liveCards)}</b>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#F1F5F9]">
                      <span className="text-[#64748B]">Digital Wallet Balance:</span>
                      <b className="text-[#1E293B] tabular-nums">{money(m.wallets.totalBalance)}</b>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#64748B]">Loyalty Points Outstanding:</span>
                      <b className="text-[#635BFF] tabular-nums">{count(m.loyalty.pointsOutstanding)} pts</b>
                    </div>
                  </div>
                </Panel>
              </div>
            </div>
          </div>
        )}
      </Canvas>
    </>
  );
}

export default function MoneyPage() {
  return (
    <Suspense fallback={<Loading label="Loading financial settlement ledger..." />}>
      <MoneyLedgerContent />
    </Suspense>
  );
}
