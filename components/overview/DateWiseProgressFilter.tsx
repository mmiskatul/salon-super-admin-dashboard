'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Wallet,
  Users,
} from 'lucide-react';
import type { InsightDays, InsightPeriod, Overview } from '@/lib/api/insights';
import { money, count } from '@/lib/format';

interface DateWiseProgressFilterProps {
  days: InsightDays;
  onDaysChange: (d: InsightDays) => void;
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  overviewData?: Overview | null;
  onClearDateFilter?: () => void;
}

const PERIODS: { key: InsightPeriod; days: InsightDays; label: string; desc: string }[] = [
  { key: 'Day', days: 1, label: 'Day', desc: '1-day single view' },
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

  const isToday = selectedDate === todayIso;
  const isYesterday = selectedDate === yesterdayIso;

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
      weekday: 'short',
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
      isTargetToday,
    };
  }, [overviewData, selectedDate, todayIso]);

  return (
    <div className="space-y-3 font-manrope">
      {/* 1. Sleek Command Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 shadow-xs">
        {/* Left: Timeframe Switcher & Quick Jumps */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Control */}
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
                      ? 'bg-[#635BFF] text-white shadow-2xs'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                  title={p.desc}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-[#E2E8F0] hidden sm:block" />

          {/* Quick Presets */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onDateChange(todayIso)}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                isToday
                  ? 'bg-[#DCFCE7] text-[#15803D]'
                  : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
              }`}
              title="Focus on Today"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => onDateChange(yesterdayIso)}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                isYesterday
                  ? 'bg-[#E0E7FF] text-[#4338CA]'
                  : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
              }`}
              title="Focus on Yesterday"
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Right: Date Picker with Precision Stepper */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => stepDate(-1)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-white hover:text-[#1E293B]"
              title="Previous day"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center px-2">
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
              title="Next day"
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
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#64748B] transition-all hover:border-[#CBD5E1] hover:text-[#1E293B]"
              title="Snap back to today"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Today</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Precision Date Focus Ribbon */}
      {selectedDate && dateStats && (
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xs">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] px-4 py-2.5 bg-[#FAFBFD]">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#635BFF]" />
              <h3 className="text-[13px] font-extrabold text-[#1E293B]">
                Focus Date: {formattedDateLabel}
              </h3>
              {isToday ? (
                <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-extrabold text-[#15803D] uppercase">
                  Live Today
                </span>
              ) : isYesterday ? (
                <span className="rounded-full bg-[#E0E7FF] px-2 py-0.5 text-[10px] font-extrabold text-[#4338CA] uppercase">
                  Yesterday
                </span>
              ) : (
                <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-bold text-[#64748B]">
                  {selectedDate}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] font-bold text-[#635BFF]">
              <Link href="/bookings" className="inline-flex items-center gap-0.5 hover:underline">
                <span>View in Bookings</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
              <span className="text-[#CBD5E1]">·</span>
              <Link href="/money" className="inline-flex items-center gap-0.5 text-[#16A34A] hover:underline">
                <span>View Cash Ledger</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* 6 Metric Cells Strip */}
          <div className="grid grid-cols-2 divide-y divide-[#F1F5F9] sm:grid-cols-3 sm:divide-y-0 sm:divide-x lg:grid-cols-6">
            {/* Bookings */}
            <div className="p-3.5">
              <span className="text-[11px] font-bold text-[#64748B] uppercase">Bookings</span>
              <p className="mt-1 text-[22px] font-extrabold tracking-tight text-[#1E293B] tabular-nums leading-none">
                {count(dateStats.totalBookings)}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#64748B]">
                {dateStats.completionRate !== null ? `${dateStats.completionRate}% complete` : 'Scheduled'}
              </p>
            </div>

            {/* Completed */}
            <div className="p-3.5">
              <span className="text-[11px] font-bold text-[#16A34A] uppercase">Completed</span>
              <p className="mt-1 text-[22px] font-extrabold tracking-tight text-[#15803D] tabular-nums leading-none">
                {count(dateStats.completed)}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#16A34A]">Paid & finished</p>
            </div>

            {/* In Chair / Waiting */}
            <div className="p-3.5">
              <span className="text-[11px] font-bold text-[#0284C7] uppercase">In Chair / Wait</span>
              <p className="mt-1 text-[22px] font-extrabold tracking-tight text-[#0369A1] tabular-nums leading-none">
                {count(dateStats.upcoming)}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#0284C7]">Open visits</p>
            </div>

            {/* Cancelled */}
            <div className="p-3.5">
              <span className="text-[11px] font-bold text-[#E11D48] uppercase">Cancelled</span>
              <p className="mt-1 text-[22px] font-extrabold tracking-tight text-[#BE123C] tabular-nums leading-none">
                {count(dateStats.cancelled + dateStats.noShow)}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#E11D48]">
                {dateStats.cancelRate !== null ? `${dateStats.cancelRate}% rate` : 'Called off'}
              </p>
            </div>

            {/* Cash Recorded */}
            <div className="p-3.5">
              <span className="text-[11px] font-bold text-[#16A34A] uppercase">Cash Recorded</span>
              <p className="mt-1 text-[22px] font-extrabold tracking-tight text-[#15803D] tabular-nums leading-none">
                {money(dateStats.cashAmount)}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#16A34A]">Settled at counter</p>
            </div>

            {/* Signups */}
            <div className="p-3.5">
              <span className="text-[11px] font-bold text-[#7C3AED] uppercase">New Signups</span>
              <p className="mt-1 text-[22px] font-extrabold tracking-tight text-[#6D28D9] tabular-nums leading-none">
                +{count(dateStats.totalSignups)}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#7C3AED]">
                {dateStats.customersSignup} cust · {dateStats.partnersSignup} part
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
