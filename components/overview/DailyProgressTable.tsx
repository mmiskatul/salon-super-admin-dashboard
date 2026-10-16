'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Sparkles,
  Trophy,
  Wallet,
  XCircle,
  Users,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  ExternalLink,
  CalendarCheck,
  Check,
  Eye,
  Activity,
  Layers,
} from 'lucide-react';
import type { Overview } from '@/lib/api/insights';
import { count, money } from '@/lib/format';
import { percent } from '@/components/insights/Bits';
import { Panel } from '@/components/ui/primitives';

interface DailyProgressTableProps {
  overview: Overview;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

interface ProgressRow {
  key: string; // YYYY-MM-DD or HH:00
  label: string; // Formatted full date or hour label
  subLabel: string; // Weekday or helper
  isToday: boolean;
  isYesterday: boolean;
  isSelected: boolean;
  totalBookings: number;
  completed: number;
  upcoming: number;
  cancelled: number;
  noShow: number;
  completionRate: number | null;
  cancelRate: number | null;
  cashAmount: number;
  customers: number;
  partners: number;
  totalSignups: number;
  performanceVsAvg: number | null; // % difference vs average cash
}

type SortField = 'date' | 'bookings' | 'completion' | 'cash' | 'signups';
type SortDirection = 'asc' | 'desc';
type QuickFilter = 'all' | 'hasBookings' | 'hasCash' | 'hasSignups' | 'highCompletion';

export function DailyProgressTable({
  overview,
  selectedDate,
  onSelectDate,
}: DailyProgressTableProps) {
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pageSize, setPageSize] = useState<number | 'all'>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);

  // Local today and yesterday ISO
  const { todayIso, yesterdayIso } = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    const tIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const yDate = new Date(Date.now() - 86400000);
    const yIso = `${yDate.getFullYear()}-${pad(yDate.getMonth() + 1)}-${pad(yDate.getDate())}`;
    return { todayIso: tIso, yesterdayIso: yIso };
  }, []);

  const isHourlyMode = overview.days === 1 && overview.timeline?.unit === 'hour';

  // Build combined progress rows (Hourly when days === 1, Daily when days > 1)
  const rawRows = useMemo(() => {
    if (isHourlyMode && overview.timeline) {
      const bMap = new Map(overview.timeline.bookings.map((b) => [b.key, b]));
      const cMap = new Map(overview.timeline.money.map((c) => [c.key, c]));

      return overview.timeline.bookings.map((b): ProgressRow => {
        const cashObj = cMap.get(b.key);
        const cashAmount = cashObj?.amount ?? 0;
        const total = b.completed + b.upcoming + b.cancelled + b.noShow;
        const completionRate = total > 0 ? Math.round((b.completed / total) * 100) : null;
        const cancelRate = total > 0 ? Math.round(((b.cancelled + b.noShow) / total) * 100) : null;

        return {
          key: b.key,
          label: b.label,
          subLabel: b.shortLabel,
          isToday: selectedDate === todayIso,
          isYesterday: selectedDate === yesterdayIso,
          isSelected: false,
          totalBookings: total,
          completed: b.completed,
          upcoming: b.upcoming,
          cancelled: b.cancelled,
          noShow: b.noShow,
          completionRate,
          cancelRate,
          cashAmount,
          customers: 0,
          partners: 0,
          totalSignups: 0,
          performanceVsAvg: null,
        };
      });
    }

    // Daily mode
    const bookingMap = new Map(overview.bookings.byDay.map((b) => [b.day, b]));
    const cashMap = new Map(overview.money.byDay.map((c) => [c.day, c.amount]));
    const signupMap = new Map(overview.signups.map((s) => [s.day, s]));

    const allDaysSet = new Set<string>();
    overview.bookings.byDay.forEach((b) => allDaysSet.add(b.day));
    overview.money.byDay.forEach((c) => allDaysSet.add(c.day));
    overview.signups.forEach((s) => allDaysSet.add(s.day));
    allDaysSet.add(todayIso);

    const sortedDays = Array.from(allDaysSet).sort((a, b) => b.localeCompare(a));

    // Calculate daily average cash for performance tagging
    let totalCashSum = 0;
    sortedDays.forEach((d) => {
      totalCashSum += cashMap.get(d) ?? 0;
    });
    const avgDailyCash = sortedDays.length > 0 ? totalCashSum / sortedDays.length : 0;

    return sortedDays.map((day): ProgressRow => {
      const dateObj = new Date(`${day}T00:00:00`);
      const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const isToday = day === todayIso;
      const isYesterday = day === yesterdayIso;
      const isSelected = day === selectedDate;

      const b = bookingMap.get(day);
      const totalBookings = b
        ? b.completed + b.upcoming + b.cancelled + b.noShow
        : isToday
        ? overview.today.total
        : 0;

      const completed = b ? b.completed : isToday ? overview.today.done : 0;
      const upcoming = b ? b.upcoming : isToday ? overview.today.waiting + overview.today.inChair : 0;
      const cancelled = b ? b.cancelled : isToday ? overview.today.cancelled : 0;
      const noShow = b ? b.noShow : 0;

      const completionRate = totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : null;
      const cancelRate = totalBookings > 0 ? Math.round(((cancelled + noShow) / totalBookings) * 100) : null;

      const cashAmount = cashMap.get(day) ?? 0;

      const s = signupMap.get(day);
      const customers = s?.customers ?? 0;
      const partners = s?.partners ?? 0;
      const totalSignups = customers + partners;

      const performanceVsAvg =
        cashAmount > 0 && avgDailyCash > 0
          ? Math.round(((cashAmount - avgDailyCash) / avgDailyCash) * 100)
          : null;

      return {
        key: day,
        label: formattedDate,
        subLabel: weekday,
        isToday,
        isYesterday,
        isSelected,
        totalBookings,
        completed,
        upcoming,
        cancelled,
        noShow,
        completionRate,
        cancelRate,
        cashAmount,
        customers,
        partners,
        totalSignups,
        performanceVsAvg,
      };
    });
  }, [overview, selectedDate, todayIso, yesterdayIso, isHourlyMode]);

  // Peak records
  const peakBookingsKey = useMemo(() => {
    let peak = { key: '', val: 0 };
    for (const r of rawRows) {
      if (r.totalBookings > peak.val) peak = { key: r.key, val: r.totalBookings };
    }
    return peak.val > 0 ? peak.key : null;
  }, [rawRows]);

  const peakCashKey = useMemo(() => {
    let peak = { key: '', val: 0 };
    for (const r of rawRows) {
      if (r.cashAmount > peak.val) peak = { key: r.key, val: r.cashAmount };
    }
    return peak.val > 0 ? peak.key : null;
  }, [rawRows]);

  // Filtered & Sorted rows
  const processedRows = useMemo(() => {
    let list = rawRows;

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.key.toLowerCase().includes(q) ||
          r.label.toLowerCase().includes(q) ||
          r.subLabel.toLowerCase().includes(q),
      );
    }

    // Quick filter
    if (quickFilter === 'hasBookings') {
      list = list.filter((r) => r.totalBookings > 0);
    } else if (quickFilter === 'hasCash') {
      list = list.filter((r) => r.cashAmount > 0);
    } else if (quickFilter === 'hasSignups') {
      list = list.filter((r) => r.totalSignups > 0);
    } else if (quickFilter === 'highCompletion') {
      list = list.filter((r) => (r.completionRate ?? 0) >= 80);
    }

    // Sorting
    const sorted = [...list].sort((a, b) => {
      let diff = 0;
      if (sortField === 'date') {
        diff = a.key.localeCompare(b.key);
      } else if (sortField === 'bookings') {
        diff = a.totalBookings - b.totalBookings;
      } else if (sortField === 'completion') {
        diff = (a.completionRate ?? -1) - (b.completionRate ?? -1);
      } else if (sortField === 'cash') {
        diff = a.cashAmount - b.cashAmount;
      } else if (sortField === 'signups') {
        diff = a.totalSignups - b.totalSignups;
      }

      return sortDirection === 'asc' ? diff : -diff;
    });

    return sorted;
  }, [rawRows, search, quickFilter, sortField, sortDirection]);

  // Aggregate summary
  const filteredSummary = useMemo(() => {
    let totalBookings = 0;
    let totalCompleted = 0;
    let totalCash = 0;
    let totalSignups = 0;

    for (const r of processedRows) {
      totalBookings += r.totalBookings;
      totalCompleted += r.completed;
      totalCash += r.cashAmount;
      totalSignups += r.totalSignups;
    }

    const avgCompletion =
      totalBookings > 0 ? Math.round((totalCompleted / totalBookings) * 100) : null;
    const avgDailyCash =
      processedRows.length > 0 ? Math.round(totalCash / processedRows.length) : 0;

    return {
      rowCount: processedRows.length,
      totalBookings,
      totalCompleted,
      totalCash,
      totalSignups,
      avgCompletion,
      avgDailyCash,
    };
  }, [processedRows]);

  // Pagination calculation
  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1;
    return Math.max(1, Math.ceil(processedRows.length / pageSize));
  }, [processedRows.length, pageSize]);

  const safePage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    if (pageSize === 'all') return processedRows;
    const start = (safePage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, safePage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExportCsv = () => {
    const headers = [
      isHourlyMode ? 'Hour' : 'Date',
      isHourlyMode ? 'Period' : 'Weekday',
      'Total Bookings',
      'Completed',
      'Open / In Progress',
      'Cancelled',
      'No Show',
      'Completion Rate (%)',
      'Cancel Rate (%)',
      'Cash Recorded (BDT)',
      'Customer Signups',
      'Partner Signups',
      'Total Signups',
    ];

    const csvLines = [headers.join(',')];

    for (const r of processedRows) {
      const rowData = [
        `"${r.key}"`,
        `"${r.subLabel}"`,
        r.totalBookings,
        r.completed,
        r.upcoming,
        r.cancelled,
        r.noShow,
        r.completionRate !== null ? r.completionRate : '—',
        r.cancelRate !== null ? r.cancelRate : '—',
        r.cashAmount,
        r.customers,
        r.partners,
        r.totalSignups,
      ];
      csvLines.push(rowData.join(','));
    }

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salunbd-${isHourlyMode ? 'hourly' : 'daily'}-progress-${overview.days}d-${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-[#94A3B8] opacity-60" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-[#635BFF]" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#635BFF]" />
    );
  };

  return (
    <Panel
      title={isHourlyMode ? `Hourly Breakdown for ${selectedDate}` : 'Date-Wise Progress Breakdown'}
      note={
        isHourlyMode
          ? `Detailed 24-hour operational breakdown of appointments and revenue velocity on ${selectedDate}`
          : `Comprehensive timeline of appointment fulfillment, cash receipts, and user sign-ups across ${overview.days} days`
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#64748B] transition-all hover:border-[#635BFF]/40 hover:text-[#635BFF] cursor-pointer shadow-2xs"
            title="Download this progress dataset as CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Search box with clear icon */}
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder={isHourlyMode ? 'Filter hour...' : 'Filter date or day...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-36 sm:w-48 rounded-lg border border-[#E2E8F0] bg-white py-1.5 pr-7 pl-8 text-[12px] text-[#1E293B] placeholder-[#94A3B8] outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 text-[#94A3B8] hover:text-[#1E293B]"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Quick Filter Bar & Summary Strip */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#94A3B8] uppercase">
            <Filter className="h-3 w-3" /> Quick Filter:
          </span>
          {(
            [
              { key: 'all', label: isHourlyMode ? 'All Hours' : 'All Dates' },
              { key: 'hasBookings', label: 'With Bookings' },
              { key: 'hasCash', label: 'With Cash' },
              { key: 'hasSignups', label: 'With Signups' },
              { key: 'highCompletion', label: 'High Complete (≥80%)' },
            ] as const
          ).map((f) => {
            const active = quickFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setQuickFilter(f.key);
                  setCurrentPage(1);
                }}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#635BFF] text-white shadow-2xs'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Dataset Summary Counter */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-semibold text-[#64748B]">
          <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 font-bold text-[#1E293B]">
            {filteredSummary.rowCount} {isHourlyMode ? 'hours' : 'days'}
          </span>
          <span>·</span>
          <span>
            <b className="text-[#1E293B]">{count(filteredSummary.totalBookings)}</b> bookings
          </span>
          <span>·</span>
          <span>
            <b className="text-[#15803D]">{money(filteredSummary.totalCash)}</b> cash
          </span>
          {filteredSummary.avgCompletion !== null && (
            <>
              <span>·</span>
              <span className="rounded-md bg-[#DCFCE7] px-1.5 py-0.5 font-bold text-[#15803D]">
                {filteredSummary.avgCompletion}% avg fulfillment
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]/70">
        <table className="w-full text-left text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold tracking-wider text-[#64748B] uppercase select-none">
              <th
                onClick={() => handleSort('date')}
                className="cursor-pointer py-3 pr-4 pl-3.5 hover:text-[#1E293B]"
              >
                <div className="flex items-center gap-1.5">
                  <span>{isHourlyMode ? 'Hour of Day' : 'Date / Day'}</span>
                  {renderSortIndicator('date')}
                </div>
              </th>

              <th
                onClick={() => handleSort('bookings')}
                className="cursor-pointer py-3 px-3 hover:text-[#1E293B]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Volume</span>
                  {renderSortIndicator('bookings')}
                </div>
              </th>

              <th className="py-3 px-3 min-w-[160px]">Appointment Fulfillment Mix</th>

              <th
                onClick={() => handleSort('completion')}
                className="cursor-pointer py-3 px-3 text-right hover:text-[#1E293B]"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Rate</span>
                  {renderSortIndicator('completion')}
                </div>
              </th>

              <th
                onClick={() => handleSort('cash')}
                className="cursor-pointer py-3 px-3 text-right hover:text-[#1E293B]"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Cash Recorded</span>
                  {renderSortIndicator('cash')}
                </div>
              </th>

              {!isHourlyMode && (
                <th
                  onClick={() => handleSort('signups')}
                  className="cursor-pointer py-3 px-3 text-right hover:text-[#1E293B]"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>New Signups</span>
                    {renderSortIndicator('signups')}
                  </div>
                </th>
              )}

              <th className="py-3 pr-3.5 pl-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] bg-white">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={isHourlyMode ? 6 : 7}
                  className="py-10 text-center text-[13px] text-[#94A3B8]"
                >
                  No matching records found for current filter.
                </td>
              </tr>
            ) : (
              paginatedRows.map((r) => {
                const isPeakB = r.key === peakBookingsKey;
                const isPeakC = r.key === peakCashKey;
                const isExpanded = expandedRowKey === r.key;

                return (
                  <React.Fragment key={r.key}>
                    <tr
                      onClick={() => {
                        if (!isHourlyMode) onSelectDate(r.key);
                        setExpandedRowKey(isExpanded ? null : r.key);
                      }}
                      className={`group cursor-pointer transition-colors ${
                        r.isSelected
                          ? 'bg-[#EEF2FF]/60 font-semibold text-[#1E293B]'
                          : isExpanded
                          ? 'bg-[#F8FAFC]'
                          : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {/* Date / Hour Column */}
                      <td className="py-3 pr-4 pl-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-7 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                              r.isSelected
                                ? 'bg-[#635BFF] text-white shadow-xs'
                                : 'bg-[#F1F5F9] text-[#64748B] group-hover:bg-[#E2E8F0]'
                            }`}
                          >
                            {r.subLabel}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#1E293B]">{r.label}</span>
                              {!isHourlyMode && (
                                <span className="text-[11px] text-[#94A3B8]">({r.key})</span>
                              )}
                              {r.isToday && !isHourlyMode && (
                                <span className="rounded-sm bg-[#DCFCE7] px-1.5 py-0.2 text-[9px] font-extrabold text-[#15803D]">
                                  TODAY
                                </span>
                              )}
                              {r.isYesterday && !isHourlyMode && (
                                <span className="rounded-sm bg-[#E0E7FF] px-1.5 py-0.2 text-[9px] font-extrabold text-[#4338CA]">
                                  YEST
                                </span>
                              )}
                              {isPeakB && (
                                <span
                                  className="inline-flex items-center gap-0.5 rounded-sm bg-[#FEF3C7] px-1.5 py-0.2 text-[9px] font-bold text-[#92400E]"
                                  title="Peak appointment volume"
                                >
                                  <Trophy className="h-2.5 w-2.5" /> Peak Bookings
                                </span>
                              )}
                              {isPeakC && (
                                <span
                                  className="inline-flex items-center gap-0.5 rounded-sm bg-[#DCFCE7] px-1.5 py-0.2 text-[9px] font-bold text-[#15803D]"
                                  title="Peak revenue recorded"
                                >
                                  <Wallet className="h-2.5 w-2.5" /> Top Cash
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Total Bookings */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <b className="tabular-nums text-[14px] text-[#1E293B]">
                            {count(r.totalBookings)}
                          </b>
                          {r.totalBookings > 0 && (
                            <span className="text-[11px] text-[#64748B]">appts</span>
                          )}
                        </div>
                      </td>

                      {/* Visual Progress Breakdown Bar */}
                      <td className="py-3 px-3">
                        <div className="min-w-[150px] space-y-1">
                          {/* Mini stacked bar */}
                          <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                            {r.totalBookings > 0 ? (
                              <>
                                {r.completed > 0 && (
                                  <div
                                    style={{ width: `${(r.completed / r.totalBookings) * 100}%` }}
                                    className="bg-[#16A34A]"
                                    title={`Completed: ${r.completed}`}
                                  />
                                )}
                                {r.upcoming > 0 && (
                                  <div
                                    style={{ width: `${(r.upcoming / r.totalBookings) * 100}%` }}
                                    className="bg-[#635BFF]"
                                    title={`Open / In Chair: ${r.upcoming}`}
                                  />
                                )}
                                {r.cancelled > 0 && (
                                  <div
                                    style={{ width: `${(r.cancelled / r.totalBookings) * 100}%` }}
                                    className="bg-[#F59E0B]"
                                    title={`Cancelled: ${r.cancelled}`}
                                  />
                                )}
                                {r.noShow > 0 && (
                                  <div
                                    style={{ width: `${(r.noShow / r.totalBookings) * 100}%` }}
                                    className="bg-[#EF4444]"
                                    title={`No-Show: ${r.noShow}`}
                                  />
                                )}
                              </>
                            ) : (
                              <div className="w-full bg-[#E2E8F0]/30" />
                            )}
                          </div>

                          {/* Mini status pills */}
                          <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                            <span className="flex items-center gap-0.5 text-[#16A34A] font-bold">
                              <CheckCircle2 className="h-2.5 w-2.5" /> {r.completed}
                            </span>
                            <span className="flex items-center gap-0.5 text-[#635BFF] font-bold">
                              <Clock className="h-2.5 w-2.5" /> {r.upcoming}
                            </span>
                            {(r.cancelled > 0 || r.noShow > 0) && (
                              <span className="flex items-center gap-0.5 text-[#F59E0B] font-bold">
                                <XCircle className="h-2.5 w-2.5" /> {r.cancelled + r.noShow}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Completion Rate */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {r.completionRate !== null ? (
                          <div className="inline-flex flex-col items-end">
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                                r.completionRate >= 80
                                  ? 'bg-[#DCFCE7] text-[#15803D]'
                                  : r.completionRate >= 50
                                  ? 'bg-[#FEF3C7] text-[#92400E]'
                                  : 'bg-[#FEE2E2] text-[#991B1B]'
                              }`}
                            >
                              {r.completionRate}%
                            </span>
                            {r.cancelRate !== null && r.cancelRate > 0 && (
                              <span className="text-[10px] text-[#94A3B8] mt-0.5">
                                {r.cancelRate}% drop
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>

                      {/* Cash Recorded */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-extrabold tabular-nums text-[13px] text-[#1E293B]">
                            {money(r.cashAmount)}
                          </span>
                          {r.performanceVsAvg !== null && r.performanceVsAvg !== 0 && (
                            <span
                              className={`text-[10px] font-bold ${
                                r.performanceVsAvg > 0 ? 'text-[#16A34A]' : 'text-[#94A3B8]'
                              }`}
                            >
                              {r.performanceVsAvg > 0 ? `+${r.performanceVsAvg}%` : `${r.performanceVsAvg}%`} vs avg
                            </span>
                          )}
                        </div>
                      </td>

                      {/* New Signups */}
                      {!isHourlyMode && (
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {r.totalSignups > 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-[#635BFF]">
                              <Users className="h-3 w-3" />
                              <span>+{r.totalSignups}</span>
                              <span className="text-[10px] font-normal text-[#64748B]">
                                ({r.customers}c · {r.partners}p)
                              </span>
                            </span>
                          ) : (
                            <span className="text-[#94A3B8]">0</span>
                          )}
                        </td>
                      )}

                      {/* Action */}
                      <td className="py-3 pr-3.5 pl-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isHourlyMode) onSelectDate(r.key);
                            }}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                              r.isSelected
                                ? 'bg-[#635BFF] text-white shadow-2xs'
                                : 'bg-[#F1F5F9] text-[#635BFF] hover:bg-[#635BFF] hover:text-white'
                            }`}
                          >
                            <span>{r.isSelected ? 'Focused' : 'Focus'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRowKey(isExpanded ? null : r.key);
                            }}
                            className="rounded-md p-1 text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#1E293B] cursor-pointer"
                            title={isExpanded ? 'Collapse row details' : 'Expand row details'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Deep-Dive Row */}
                    {isExpanded && (
                      <tr className="bg-[#FAFBFD] border-b border-[#E2E8F0]/60">
                        <td colSpan={isHourlyMode ? 6 : 7} className="p-4">
                          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs font-manrope">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3 mb-3">
                              <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-[#635BFF]" />
                                <h4 className="text-[13px] font-extrabold text-[#1E293B]">
                                  Operational Breakdown: {r.label} {r.subLabel && `(${r.subLabel})`}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2">
                                {!isHourlyMode && (
                                  <button
                                    type="button"
                                    onClick={() => onSelectDate(r.key)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#635BFF] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#5249DE] cursor-pointer"
                                  >
                                    <Check className="h-3 w-3" /> Focus Whole Dashboard on this Date
                                  </button>
                                )}
                                <Link
                                  href="/bookings"
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#64748B] hover:text-[#1E293B]"
                                >
                                  <span>View Bookings</span>
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                                <Link
                                  href="/money"
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#64748B] hover:text-[#1E293B]"
                                >
                                  <span>View Ledger</span>
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
                              <div className="rounded-lg bg-[#F8FAFC] p-3 border border-[#F1F5F9]">
                                <span className="text-[#64748B] text-[11px] font-bold uppercase">Completed Services</span>
                                <p className="text-lg font-extrabold text-[#16A34A] tabular-nums mt-0.5">
                                  {count(r.completed)}
                                </p>
                                <span className="text-[10px] text-[#94A3B8]">
                                  {r.completionRate !== null ? `${r.completionRate}% completion rate` : 'No bookings'}
                                </span>
                              </div>

                              <div className="rounded-lg bg-[#F8FAFC] p-3 border border-[#F1F5F9]">
                                <span className="text-[#64748B] text-[11px] font-bold uppercase">Open / In Progress</span>
                                <p className="text-lg font-extrabold text-[#635BFF] tabular-nums mt-0.5">
                                  {count(r.upcoming)}
                                </p>
                                <span className="text-[10px] text-[#94A3B8]">Active queue on date</span>
                              </div>

                              <div className="rounded-lg bg-[#F8FAFC] p-3 border border-[#F1F5F9]">
                                <span className="text-[#64748B] text-[11px] font-bold uppercase">Cancelled & No-Show</span>
                                <p className="text-lg font-extrabold text-[#EF4444] tabular-nums mt-0.5">
                                  {count(r.cancelled + r.noShow)}
                                </p>
                                <span className="text-[10px] text-[#94A3B8]">
                                  {r.cancelled} cancelled · {r.noShow} no-show
                                </span>
                              </div>

                              <div className="rounded-lg bg-[#F8FAFC] p-3 border border-[#F1F5F9]">
                                <span className="text-[#64748B] text-[11px] font-bold uppercase">Cash Settlement</span>
                                <p className="text-lg font-extrabold text-[#15803D] tabular-nums mt-0.5">
                                  {money(r.cashAmount)}
                                </p>
                                <span className="text-[10px] text-[#94A3B8]">
                                  {r.totalBookings > 0 && r.cashAmount > 0
                                    ? `~${money(Math.round(r.cashAmount / r.totalBookings))} per booking`
                                    : 'Recorded at counter'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Rows-Per-Page Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F1F5F9] pt-3 text-[12px] text-[#64748B]">
        {/* Left: Rows per page selector */}
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5">
            {([10, 25, 50, 'all'] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
                  pageSize === size
                    ? 'bg-[#635BFF] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                {size === 'all' ? 'All' : size}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-[#94A3B8]">
            Showing{' '}
            {pageSize === 'all'
              ? processedRows.length
              : Math.min(processedRows.length, (safePage - 1) * pageSize + 1)}
            –{pageSize === 'all' ? processedRows.length : Math.min(processedRows.length, safePage * pageSize)}{' '}
            of {processedRows.length}
          </span>
        </div>

        {/* Right: Page Navigation */}
        {pageSize !== 'all' && totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1E293B] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="First page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1E293B] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <span className="px-2 text-[12px] font-bold text-[#1E293B]">
              Page {safePage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1E293B] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1E293B] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Last page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </Panel>
  );
}
