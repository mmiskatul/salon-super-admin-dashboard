'use client';

import React, { useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { InsightDays, InsightPeriod } from '@/lib/api/insights';

interface DateWiseProgressFilterProps {
  days: InsightDays;
  onDaysChange: (d: InsightDays) => void;
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  onClearDateFilter?: () => void;
}

const PERIODS: { key: InsightPeriod; days: InsightDays; label: string; desc: string; detail: string }[] = [
  { key: 'Day', days: 1, label: 'Day', desc: '1-day single view', detail: '24h Hourly View' },
  { key: 'Weekly', days: 7, label: 'Weekly', desc: '7 days timeline', detail: '7-Day Daily Trend' },
  { key: 'Monthly', days: 30, label: 'Monthly', desc: '30 days timeline', detail: 'Weekly Rollups' },
  { key: 'Yearly', days: 365, label: 'Yearly', desc: '365 days timeline', detail: '12-Month Annual' },
];

export function DateWiseProgressFilter({
  days,
  onDaysChange,
  selectedDate,
  onDateChange,
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

  const activePeriodDetail = useMemo(() => {
    const match = PERIODS.find((p) => p.key === activePeriod);
    return match?.detail ?? 'Timeline View';
  }, [activePeriod]);

  // Step backward or forward 1 day
  const stepDate = (deltaDays: number) => {
    const base = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
    base.setDate(base.getDate() + deltaDays);
    const pad = (n: number) => String(n).padStart(2, '0');
    const newDateStr = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
    onDateChange(newDateStr);
  };

  return (
    <div className="font-manrope">
      {/* Sleek Command Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 shadow-xs">
        {/* Left: Timeframe Switcher & Mode Indicator */}
        <div className="flex flex-wrap items-center gap-2.5">
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

          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-bold text-[#4338CA]">
            <Sparkles className="h-3 w-3 text-[#635BFF]" />
            {activePeriodDetail}
          </span>

          <div className="h-4 w-px bg-[#E2E8F0] hidden md:block" />

          {/* Quick Presets */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                onDateChange(todayIso);
                if (days !== 1 && days !== 7) onDaysChange(1);
              }}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                isToday
                  ? 'bg-[#DCFCE7] text-[#15803D]'
                  : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
              }`}
              title="Jump to Today"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => {
                onDateChange(yesterdayIso);
                if (days !== 1 && days !== 7) onDaysChange(1);
              }}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                isYesterday
                  ? 'bg-[#E0E7FF] text-[#4338CA]'
                  : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
              }`}
              title="Jump to Yesterday"
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
              <Calendar className="mr-1.5 h-3.5 w-3.5 text-[#64748B]" />
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
              title="Reset to today"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
