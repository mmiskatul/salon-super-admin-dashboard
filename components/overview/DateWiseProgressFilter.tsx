'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Users,
  Wallet,
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
} from 'lucide-react';
import type { InsightDays, InsightPeriod, Overview } from '@/lib/api/insights';
import { money, count } from '@/lib/format';
import { percent } from '@/components/insights/Bits';

interface DateWiseProgressFilterProps {
  days: InsightDays;
  onDaysChange: (d: InsightDays) => void;
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  overviewData?: Overview | null;
  onClearDateFilter?: () => void;
}

const PERIODS: { key: InsightPeriod; days: InsightDays; label: string; desc: string }[] = [
  { key: 'Day', days: 1, label: 'Day', desc: 'Single day progress' },
  { key: 'Weekly', days: 7, label: 'Weekly', desc: '7 days timeline' },
  { key: 'Monthly', days: 30, label: 'Monthly', desc: '30 days timeline' },
  { key: 'Yearly', days: 365, label: 'Yearly', desc: '365 days timeline' },
];

export function DateWiseProgressFilter({
  days,
  onDaysChange,
  selectedDate,
  onDateChange,
  overviewData,
  onClearDateFilter,
}: DateWiseProgressFilterProps) {
  // Today in local YYYY-MM-DD
  const todayIso = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, []);

  // Yesterday in YYYY-MM-DD
  const yesterdayIso = useMemo(() => {
    const y = new Date(Date.now() - 86400000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())}`;
  }, []);

  // 7 days ago ISO
  const sevenDaysAgoIso = useMemo(() => {
    const d = new Date(Date.now() - 7 * 86400000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const isToday = selectedDate === todayIso;
  const isYesterday = selectedDate === yesterdayIso;
  const is7dAgo = selectedDate === sevenDaysAgoIso;

  // Active period name
  const activePeriod = useMemo(() => {
    if (days === 1) return 'Day';
    if (days === 7) return 'Weekly';
    if (days === 30 || days === 90) return 'Monthly';
    if (days === 365) return 'Yearly';
    return 'Monthly';
  }, [days]);

  // Step backward or forward 1 day
  const stepDate = (deltaDays: number) => {
    const base = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
    base.setDate(base.getDate() + deltaDays);
    const pad = (n: number) => String(n).padStart(2, '0');
    const newDateStr = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
    onDateChange(newDateStr);
  };

  const formattedDateLabel = useMemo(() => {
    if (!selectedDate) return 'No date selected';
    const d = new Date(`${selectedDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return selectedDate;
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDate]);

  // Compute progress specific to selectedDate from overviewData
  const dateStats = useMemo(() => {
    if (!overviewData || !selectedDate) return null;

    const backendStats =
      overviewData.dateStats && overviewData.dateStats.date === selectedDate
        ? overviewData.dateStats
        : null;

    const bDay = overviewData.bookings.byDay.find((d) => d.day === selectedDate);
    const cDay = overviewData.money.byDay.find((d) => d.day === selectedDate);
    const sDay = overviewData.signups.find((d) => d.day === selectedDate);

    // If it's today, we also have live today stats
    const isTargetToday = selectedDate === todayIso;

    const totalBookings =
      backendStats?.created.total ??
      (bDay
        ? bDay.completed + bDay.upcoming + bDay.cancelled + bDay.noShow
        : isTargetToday
        ? overviewData.today.total
        : 0);

    const completed =
      backendStats?.created.completed ??
      (bDay ? bDay.completed : isTargetToday ? overviewData.today.done : 0);
    const upcoming =
      backendStats?.created.upcoming ??
      (bDay ? bDay.upcoming : isTargetToday ? overviewData.today.waiting + overviewData.today.inChair : 0);
    const cancelled =
      backendStats?.created.cancelled ??
      (bDay ? bDay.cancelled : isTargetToday ? overviewData.today.cancelled : 0);
    const noShow = backendStats?.created.noShow ?? (bDay ? bDay.noShow : 0);

    const cashAmount = backendStats?.cashAmount ?? (cDay?.amount ?? 0);
    const customersSignup = backendStats?.signups.customers ?? (sDay?.customers ?? 0);
    const partnersSignup = backendStats?.signups.partners ?? (sDay?.partners ?? 0);
    const totalSignups = customersSignup + partnersSignup;

    const completionRate = totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : null;
    const cancelRate = totalBookings > 0 ? Math.round(((cancelled + noShow) / totalBookings) * 100) : null;

    // Relative share of overall period
    const bookingShare =
      overviewData.bookings.total > 0
        ? Math.round((totalBookings / overviewData.bookings.total) * 100)
        : 0;
    const cashShare =
      overviewData.money.cash > 0
        ? Math.round((cashAmount / overviewData.money.cash) * 100)
        : 0;

    return {
      totalBookings,
      completed,
      upcoming,
      cancelled,
      noShow,
      cashAmount,
      customersSignup,
      partnersSignup,
      totalSignups,
      completionRate,
      cancelRate,
      bookingShare,
      cashShare,
      isTargetToday,
    };
  }, [overviewData, selectedDate, todayIso]);

  return (
    <div className="space-y-3 font-manrope">
      {/* Top Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-xs">
        {/* Left: Day / Weekly / Monthly / Yearly Period Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#64748B]">
            <Calendar className="h-4 w-4 text-[#635BFF]" />
            <span className="hidden sm:inline">Timeframe:</span>
          </div>

          {/* Toggle Group */}
          <div
            className="inline-flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5"
            role="tablist"
            aria-label="Period Filter"
          >
            {PERIODS.map((p) => {
              const isActive = activePeriod === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onDaysChange(p.days)}
                  className={`cursor-pointer rounded-md px-3 py-1.5 text-[12px] font-bold transition-all ${
                    isActive
                      ? 'bg-[#635BFF] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                  title={p.desc}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1">
            <span className="hidden text-[11px] font-medium text-[#94A3B8] sm:inline">·</span>
            <button
              type="button"
              onClick={() => onDateChange(todayIso)}
              className={`cursor-pointer rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${
                isToday
                  ? 'bg-[#DCFCE7] text-[#15803D]'
                  : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
              }`}
              title="Jump to today"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => onDateChange(yesterdayIso)}
              className={`cursor-pointer rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${
                isYesterday
                  ? 'bg-[#E0E7FF] text-[#4338CA]'
                  : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
              }`}
              title="Jump to yesterday"
            >
              Yesterday
            </button>

            <button
              type="button"
              onClick={() => onDateChange(sevenDaysAgoIso)}
              className={`hidden cursor-pointer rounded-md px-2 py-1 text-[11px] font-bold transition-colors sm:inline-block ${
                is7dAgo
                  ? 'bg-[#FEF3C7] text-[#92400E]'
                  : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
              }`}
              title="Jump to 7 days ago"
            >
              7d Ago
            </button>
          </div>
        </div>

        {/* Right: Interactive Date Stepper & Picker */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => stepDate(-1)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-white hover:text-[#1E293B]"
              title="Step backward 1 day"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) onDateChange(e.target.value);
                }}
                className="cursor-pointer border-none bg-transparent text-[12px] font-bold text-[#1E293B] outline-none"
                aria-label="Filter by specific date"
              />
            </div>

            <button
              type="button"
              onClick={() => stepDate(1)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-white hover:text-[#1E293B]"
              title="Step forward 1 day"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {selectedDate && !isToday && (
            <button
              type="button"
              onClick={() => {
                if (onClearDateFilter) {
                  onClearDateFilter();
                } else {
                  onDateChange(todayIso);
                }
              }}
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#64748B] transition-all hover:border-[#CBD5E1] hover:text-[#1E293B]"
              title="Snap back to today"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Progress Spotlight Banner */}
      {selectedDate && dateStats && (
        <div className="overflow-hidden rounded-xl border border-[#C7D2FE] bg-gradient-to-r from-[#EEF2FF] via-[#F8FAFC] to-[#F0FDF4] p-4.5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E0E7FF] pb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#635BFF] text-white shadow-sm">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[16px] font-extrabold text-[#1E293B]">
                    Date Progress: {formattedDateLabel}
                  </h3>
                  <span className="rounded-full bg-[#635BFF]/10 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-[#635BFF] uppercase">
                    {activePeriod} Period
                  </span>
                  {isToday ? (
                    <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-[#15803D] uppercase">
                      Live Today
                    </span>
                  ) : isYesterday ? (
                    <span className="rounded-full bg-[#E0E7FF] px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-[#4338CA] uppercase">
                      Yesterday
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#64748B]">
                      {selectedDate}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] font-medium text-[#64748B]">
                  Exact bookings, cash recorded, and signups for this date across all salons and barbers
                  {overviewData && (
                    <span className="hidden sm:inline">
                      {' '}· Period covers {overviewData.days} days ({overviewData.bookings.total} total bookings)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/bookings`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#635BFF]/30 bg-white px-3 py-1.5 text-[12px] font-bold text-[#635BFF] transition-all hover:bg-[#635BFF] hover:text-white"
              >
                <span>Manage Bookings</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href={`/money`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#16A34A]/30 bg-white px-3 py-1.5 text-[12px] font-bold text-[#16A34A] transition-all hover:bg-[#16A34A] hover:text-white"
              >
                <span>View Cash Ledger</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics Grid for Selected Date */}
          <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {/* Bookings on this date */}
            <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-2xs backdrop-blur-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#64748B]">
                <span className="flex items-center gap-1">
                  <CalendarCheck className="h-3.5 w-3.5 text-[#635BFF]" />
                  Bookings
                </span>
                {dateStats.bookingShare > 0 && (
                  <span className="text-[10px] font-semibold text-[#635BFF]">
                    {dateStats.bookingShare}% share
                  </span>
                )}
              </div>
              <p className="mt-1 text-[20px] font-extrabold tracking-tight text-[#1E293B]">
                {count(dateStats.totalBookings)}
              </p>
              <p className="text-[11px] font-medium text-[#64748B]">
                {dateStats.completionRate !== null
                  ? `${dateStats.completionRate}% completion`
                  : 'Total scheduled'}
              </p>
            </div>

            {/* Completed */}
            <div className="rounded-xl border border-[#BBF7D0]/60 bg-[#F0FDF4]/90 p-3 shadow-2xs">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#16A34A]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Completed</span>
              </div>
              <p className="mt-1 text-[20px] font-extrabold tracking-tight text-[#15803D]">
                {count(dateStats.completed)}
              </p>
              <p className="text-[11px] font-medium text-[#16A34A]">Finished & paid</p>
            </div>

            {/* In chair / Open */}
            <div className="rounded-xl border border-[#BAE6FD]/60 bg-[#F0F9FF]/90 p-3 shadow-2xs">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#0284C7]">
                <Clock className="h-3.5 w-3.5" />
                <span>Open / Chair</span>
              </div>
              <p className="mt-1 text-[20px] font-extrabold tracking-tight text-[#0369A1]">
                {count(dateStats.upcoming)}
              </p>
              <p className="text-[11px] font-medium text-[#0284C7]">Waiting / in chair</p>
            </div>

            {/* Cancelled / No-show */}
            <div className="rounded-xl border border-[#FECDD3]/60 bg-[#FFF1F2]/90 p-3 shadow-2xs">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#E11D48]">
                <XCircle className="h-3.5 w-3.5" />
                <span>Cancelled</span>
              </div>
              <p className="mt-1 text-[20px] font-extrabold tracking-tight text-[#BE123C]">
                {count(dateStats.cancelled + dateStats.noShow)}
              </p>
              <p className="text-[11px] font-medium text-[#E11D48]">
                {dateStats.cancelRate !== null ? `${dateStats.cancelRate}% rate` : 'Called off'}
              </p>
            </div>

            {/* Cash on this date */}
            <div className="rounded-xl border border-[#BBF7D0]/70 bg-[#F0FDF4]/90 p-3 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#16A34A]">
                <span className="flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" />
                  Cash Recorded
                </span>
                {dateStats.cashShare > 0 && (
                  <span className="text-[10px] font-semibold text-[#15803D]">
                    {dateStats.cashShare}% share
                  </span>
                )}
              </div>
              <p className="mt-1 text-[20px] font-extrabold tracking-tight text-[#15803D]">
                {money(dateStats.cashAmount)}
              </p>
              <p className="text-[11px] font-medium text-[#16A34A]">Paid at counter</p>
            </div>

            {/* Signups on this date */}
            <div className="rounded-xl border border-[#DDD6FE]/70 bg-[#F5F3FF]/90 p-3 shadow-2xs">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#7C3AED]">
                <Users className="h-3.5 w-3.5" />
                <span>New Signups</span>
              </div>
              <p className="mt-1 text-[20px] font-extrabold tracking-tight text-[#6D28D9]">
                +{count(dateStats.totalSignups)}
              </p>
              <p className="text-[11px] font-medium text-[#7C3AED]">
                {dateStats.customersSignup} cust · {dateStats.partnersSignup} part
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
