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
  Check,
  Activity,
  Layers,
  Banknote,
  Scissors,
  UserCheck,
  AlertCircle,
  BarChart2,
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
  subLabel: string; // Weekday or short label
  dayNumber?: string; // Day of month
  isWeekend?: boolean;
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
type QuickFilter = 'all' | 'hasBookings' | 'hasCash' | 'hasCancellations' | 'hasSignups' | 'highCompletion';

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

  // Local today and yesterday ISO strings
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
    if (selectedDate) allDaysSet.add(selectedDate);

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
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday & Saturday in Bangladesh
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const dayNumber = String(dateObj.getDate()).padStart(2, '0');

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
        dayNumber,
        isWeekend,
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

  // Dynamic quick-filter counts
  const quickFilterCounts = useMemo(() => {
    return {
      all: rawRows.length,
      hasBookings: rawRows.filter((r) => r.totalBookings > 0).length,
      hasCash: rawRows.filter((r) => r.cashAmount > 0).length,
      hasCancellations: rawRows.filter((r) => r.cancelled > 0 || r.noShow > 0).length,
      hasSignups: rawRows.filter((r) => r.totalSignups > 0).length,
      highCompletion: rawRows.filter((r) => (r.completionRate ?? 0) >= 80).length,
    };
  }, [rawRows]);

  // Filtered & Sorted rows
  const processedRows = useMemo(() => {
    let list = rawRows;

    // Search filter: date ISO, label, weekday, month
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.key.toLowerCase().includes(q) ||
          r.label.toLowerCase().includes(q) ||
          r.subLabel.toLowerCase().includes(q) ||
          (r.dayNumber && r.dayNumber.includes(q)),
      );
    }

    // Quick filter
    if (quickFilter === 'hasBookings') {
      list = list.filter((r) => r.totalBookings > 0);
    } else if (quickFilter === 'hasCash') {
      list = list.filter((r) => r.cashAmount > 0);
    } else if (quickFilter === 'hasCancellations') {
      list = list.filter((r) => r.cancelled > 0 || r.noShow > 0);
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
    let totalCancelled = 0;
    let totalCash = 0;
    let totalSignups = 0;

    for (const r of processedRows) {
      totalBookings += r.totalBookings;
      totalCompleted += r.completed;
      totalCancelled += r.cancelled + r.noShow;
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
      totalCancelled,
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
      return <ArrowUpDown className="h-3 w-3 text-[#94A3B8] opacity-50" />;
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
          : `Day-by-day telemetry of appointment fulfillment, cancellations, cash velocity, and sign-ups across ${overview.days} days`
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] font-bold text-[#475569] transition-all hover:border-[#635BFF] hover:text-[#635BFF] cursor-pointer shadow-xs"
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
              placeholder={isHourlyMode ? 'Filter hour...' : 'Filter date, day, month...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-36 sm:w-56 rounded-lg border border-[#E2E8F0] bg-white py-1.5 pr-7 pl-8 text-[12px] text-[#1E293B] placeholder-[#94A3B8] outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 transition-all"
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
      <div className="space-y-4 font-manrope">
        {/* Quick Filter Bar & Summary Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl bg-[#FAFBFD] border border-[#F1F5F9] p-3">
          {/* Filter Pills with Counts */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-extrabold text-[#64748B] uppercase tracking-wide mr-1">
              <Filter className="h-3 w-3" /> Filters:
            </span>
            {(
              [
                { key: 'all', label: isHourlyMode ? 'All Hours' : 'All Dates', count: quickFilterCounts.all },
                { key: 'hasBookings', label: 'With Bookings', count: quickFilterCounts.hasBookings },
                { key: 'hasCash', label: 'With Cash', count: quickFilterCounts.hasCash },
                { key: 'hasCancellations', label: 'With Drop-offs', count: quickFilterCounts.hasCancellations },
                { key: 'hasSignups', label: 'With Signups', count: quickFilterCounts.hasSignups },
                { key: 'highCompletion', label: '≥80% Complete', count: quickFilterCounts.highCompletion },
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
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#635BFF] text-white shadow-xs'
                      : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-black ${
                      active ? 'bg-white/25 text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dataset Metrics Strip */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#64748B]">
            <span className="rounded-md bg-[#EDE9FE] px-2 py-0.5 font-bold text-[#6D28D9]">
              {filteredSummary.rowCount} {isHourlyMode ? 'hours' : 'days'}
            </span>
            <span>·</span>
            <span className="text-[#1E293B]">
              <b className="font-extrabold">{count(filteredSummary.totalBookings)}</b> appts
            </span>
            <span>·</span>
            <span className="text-[#15803D]">
              <b className="font-extrabold">{money(filteredSummary.totalCash)}</b> cash
            </span>
            {filteredSummary.totalCancelled > 0 && (
              <>
                <span>·</span>
                <span className="text-[#DC2626]">
                  <b className="font-extrabold">{filteredSummary.totalCancelled}</b> cancelled
                </span>
              </>
            )}
            {filteredSummary.avgCompletion !== null && (
              <>
                <span>·</span>
                <span className="rounded-md bg-[#DCFCE7] px-1.5 py-0.5 font-bold text-[#15803D]">
                  {filteredSummary.avgCompletion}% fulfillment
                </span>
              </>
            )}
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] shadow-2xs">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-extrabold tracking-wider text-[#475569] uppercase select-none">
                <th
                  onClick={() => handleSort('date')}
                  className="cursor-pointer py-3.5 pr-4 pl-4 hover:text-[#1E293B] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{isHourlyMode ? 'Hour of Day' : 'Date / Timeline'}</span>
                    {renderSortIndicator('date')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('bookings')}
                  className="cursor-pointer py-3.5 px-3 hover:text-[#1E293B] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Volume</span>
                    {renderSortIndicator('bookings')}
                  </div>
                </th>

                <th className="py-3.5 px-3 min-w-[170px]">Appointment Fulfillment Mix</th>

                <th
                  onClick={() => handleSort('completion')}
                  className="cursor-pointer py-3.5 px-3 text-right hover:text-[#1E293B] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Fulfillment</span>
                    {renderSortIndicator('completion')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('cash')}
                  className="cursor-pointer py-3.5 px-3 text-right hover:text-[#1E293B] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Cash Settlement</span>
                    {renderSortIndicator('cash')}
                  </div>
                </th>

                {!isHourlyMode && (
                  <th
                    onClick={() => handleSort('signups')}
                    className="cursor-pointer py-3.5 px-3 text-right hover:text-[#1E293B] transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>New Signups</span>
                      {renderSortIndicator('signups')}
                    </div>
                  </th>
                )}

                <th className="py-3.5 pr-4 pl-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] bg-white">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={isHourlyMode ? 6 : 7}
                    className="py-12 text-center text-[13px] text-[#94A3B8]"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Calendar className="h-8 w-8 text-[#CBD5E1] mb-2" />
                      <p className="font-bold text-[#64748B]">No records match your filter criteria.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearch('');
                          setQuickFilter('all');
                        }}
                        className="mt-2 text-[12px] font-bold text-[#635BFF] hover:underline"
                      >
                        Reset filters
                      </button>
                    </div>
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
                        onClick={() => setExpandedRowKey(isExpanded ? null : r.key)}
                        className={`group cursor-pointer transition-all ${
                          r.isSelected
                            ? 'bg-[#F5F3FF] border-l-4 border-l-[#635BFF]'
                            : isExpanded
                            ? 'bg-[#FAFBFD]'
                            : 'hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {/* Date / Timeline Column */}
                        <td className="py-3.5 pr-4 pl-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {/* Weekday badge */}
                            <div
                              className={`flex flex-col items-center justify-center w-9 h-9 rounded-lg text-center transition-all ${
                                r.isSelected
                                  ? 'bg-[#635BFF] text-white shadow-xs'
                                  : r.isToday
                                  ? 'bg-[#DCFCE7] text-[#15803D] ring-1 ring-[#86EFAC]'
                                  : r.isWeekend
                                  ? 'bg-[#F3E8FF] text-[#7E22CE]'
                                  : 'bg-[#F1F5F9] text-[#475569] group-hover:bg-[#E2E8F0]'
                              }`}
                            >
                              <span className="text-[10px] font-extrabold uppercase leading-tight">
                                {r.subLabel}
                              </span>
                              {r.dayNumber && (
                                <span className="text-[12px] font-black leading-none mt-0.5">
                                  {r.dayNumber}
                                </span>
                              )}
                            </div>

                            {/* Date Label & Badges */}
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-[13px] font-extrabold ${
                                    r.isSelected ? 'text-[#4338CA]' : 'text-[#1E293B]'
                                  }`}
                                >
                                  {r.label}
                                </span>

                                {!isHourlyMode && (
                                  <span className="text-[11px] font-mono text-[#94A3B8]">
                                    {r.key}
                                  </span>
                                )}

                                {r.isSelected && !isHourlyMode && (
                                  <span className="rounded-full bg-[#635BFF] px-2 py-0.2 text-[9px] font-black text-white shadow-2xs">
                                    FOCUSED DATE
                                  </span>
                                )}

                                {r.isToday && !isHourlyMode && !r.isSelected && (
                                  <span className="rounded-full bg-[#DCFCE7] px-2 py-0.2 text-[9px] font-extrabold text-[#15803D]">
                                    TODAY
                                  </span>
                                )}

                                {r.isYesterday && !isHourlyMode && (
                                  <span className="rounded-full bg-[#E0E7FF] px-2 py-0.2 text-[9px] font-extrabold text-[#4338CA]">
                                    YESTERDAY
                                  </span>
                                )}

                                {isPeakB && (
                                  <span
                                    className="inline-flex items-center gap-0.5 rounded-full bg-[#FEF3C7] px-2 py-0.2 text-[9px] font-black text-[#92400E]"
                                    title="Peak booking volume across period"
                                  >
                                    <Trophy className="h-2.5 w-2.5" /> Peak Volume
                                  </span>
                                )}

                                {isPeakC && (
                                  <span
                                    className="inline-flex items-center gap-0.5 rounded-full bg-[#DCFCE7] px-2 py-0.2 text-[9px] font-black text-[#15803D]"
                                    title="Peak revenue day across period"
                                  >
                                    <Wallet className="h-2.5 w-2.5" /> Top Cash
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Total Volume */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="tabular-nums text-base font-extrabold text-[#1E293B]">
                              {count(r.totalBookings)}
                            </span>
                            <span className="text-[11px] font-medium text-[#64748B]">
                              {r.totalBookings === 1 ? 'appt' : 'appts'}
                            </span>
                          </div>
                        </td>

                        {/* Progress Breakdown Bar */}
                        <td className="py-3.5 px-3">
                          <div className="min-w-[160px] space-y-1.5">
                            {/* Stacked fulfillment bar */}
                            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#F1F5F9] shadow-inner">
                              {r.totalBookings > 0 ? (
                                <>
                                  {r.completed > 0 && (
                                    <div
                                      style={{ width: `${(r.completed / r.totalBookings) * 100}%` }}
                                      className="bg-[#16A34A] transition-all duration-300"
                                      title={`Completed: ${r.completed}`}
                                    />
                                  )}
                                  {r.upcoming > 0 && (
                                    <div
                                      style={{ width: `${(r.upcoming / r.totalBookings) * 100}%` }}
                                      className="bg-[#635BFF] transition-all duration-300"
                                      title={`Open / In-Chair: ${r.upcoming}`}
                                    />
                                  )}
                                  {r.cancelled > 0 && (
                                    <div
                                      style={{ width: `${(r.cancelled / r.totalBookings) * 100}%` }}
                                      className="bg-[#F59E0B] transition-all duration-300"
                                      title={`Cancelled: ${r.cancelled}`}
                                    />
                                  )}
                                  {r.noShow > 0 && (
                                    <div
                                      style={{ width: `${(r.noShow / r.totalBookings) * 100}%` }}
                                      className="bg-[#EF4444] transition-all duration-300"
                                      title={`No-Show: ${r.noShow}`}
                                    />
                                  )}
                                </>
                              ) : (
                                <div className="w-full bg-[#E2E8F0]/30" />
                              )}
                            </div>

                            {/* Mini status pills */}
                            <div className="flex items-center gap-2 text-[10px] text-[#64748B] flex-wrap">
                              <span className="flex items-center gap-0.5 text-[#16A34A] font-extrabold">
                                <CheckCircle2 className="h-2.5 w-2.5" /> {r.completed} done
                              </span>
                              {r.upcoming > 0 && (
                                <span className="flex items-center gap-0.5 text-[#635BFF] font-bold">
                                  <Clock className="h-2.5 w-2.5" /> {r.upcoming} active
                                </span>
                              )}
                              {(r.cancelled > 0 || r.noShow > 0) && (
                                <span className="flex items-center gap-0.5 text-[#EF4444] font-bold">
                                  <XCircle className="h-2.5 w-2.5" /> {r.cancelled + r.noShow} drop
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Fulfillment Rate */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          {r.completionRate !== null ? (
                            <div className="inline-flex flex-col items-end">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[11px] font-black tabular-nums shadow-2xs ${
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
                                <span className="text-[10px] font-bold text-[#DC2626] mt-0.5">
                                  {r.cancelRate}% drop
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#94A3B8]">—</span>
                          )}
                        </td>

                        {/* Cash Recorded */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span className="font-extrabold tabular-nums text-[13px] text-[#1E293B]">
                              {money(r.cashAmount)}
                            </span>
                            {r.performanceVsAvg !== null && r.performanceVsAvg !== 0 && (
                              <span
                                className={`text-[10px] font-bold flex items-center gap-0.5 ${
                                  r.performanceVsAvg > 0 ? 'text-[#16A34A]' : 'text-[#64748B]'
                                }`}
                              >
                                {r.performanceVsAvg > 0 ? (
                                  <TrendingUp className="h-2.5 w-2.5" />
                                ) : (
                                  <TrendingDown className="h-2.5 w-2.5" />
                                )}
                                {r.performanceVsAvg > 0 ? `+${r.performanceVsAvg}%` : `${r.performanceVsAvg}%`} vs avg
                              </span>
                            )}
                          </div>
                        </td>

                        {/* New Signups */}
                        {!isHourlyMode && (
                          <td className="py-3.5 px-3 text-right whitespace-nowrap">
                            {r.totalSignups > 0 ? (
                              <div className="inline-flex flex-col items-end">
                                <span className="inline-flex items-center gap-1 font-extrabold text-[#635BFF] text-[12px]">
                                  <Users className="h-3 w-3" />
                                  <span>+{r.totalSignups}</span>
                                </span>
                                <span className="text-[10px] font-semibold text-[#64748B]">
                                  {r.customers}c · {r.partners}p
                                </span>
                              </div>
                            ) : (
                              <span className="text-[#94A3B8]">—</span>
                            )}
                          </td>
                        )}

                        {/* Quick Actions */}
                        <td className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isHourlyMode && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectDate(r.key);
                                }}
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition-all cursor-pointer ${
                                  r.isSelected
                                    ? 'bg-[#635BFF] text-white shadow-2xs'
                                    : 'bg-[#F1F5F9] text-[#635BFF] hover:bg-[#635BFF] hover:text-white'
                                }`}
                                title="Filter entire overview command centre on this date"
                              >
                                {r.isSelected ? (
                                  <>
                                    <Check className="h-3 w-3" />
                                    <span>Focused</span>
                                  </>
                                ) : (
                                  <span>Focus</span>
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRowKey(isExpanded ? null : r.key);
                              }}
                              className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] transition-colors cursor-pointer"
                              title={isExpanded ? 'Collapse row breakdown' : 'Expand row breakdown'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-[#635BFF]" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Deep-Dive Console */}
                      {isExpanded && (
                        <tr className="bg-[#FAFBFD] border-b border-[#E2E8F0]/80">
                          <td colSpan={isHourlyMode ? 6 : 7} className="p-4 sm:p-5">
                            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs font-manrope space-y-4">
                              {/* Header & Quick Navigation */}
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EDE9FE] text-[#635BFF]">
                                    <Activity className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <h4 className="text-[14px] font-extrabold text-[#1E293B]">
                                      Operational Audit & Fulfillment: {r.label}{' '}
                                      <span className="text-[#64748B] font-medium">({r.subLabel})</span>
                                    </h4>
                                    <p className="text-[11px] text-[#64748B]">
                                      ISO Reference: <code className="font-mono text-[#475569]">{r.key}</code> · Deep telemetry for appointments, cash receipts, and customer conversions.
                                    </p>
                                  </div>
                                </div>

                                {/* Deep-dive quick actions */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {!isHourlyMode && !r.isSelected && (
                                    <button
                                      type="button"
                                      onClick={() => onSelectDate(r.key)}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#635BFF] px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-[#5249DE] cursor-pointer shadow-xs transition-colors"
                                    >
                                      <Check className="h-3 w-3" /> Focus Overview on this Date
                                    </button>
                                  )}

                                  <Link
                                    href={`/bookings?date=${r.key}`}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#475569] hover:border-[#635BFF] hover:text-[#635BFF] transition-all shadow-2xs"
                                  >
                                    <span>View Bookings</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>

                                  <Link
                                    href={`/money?date=${r.key}&days=1`}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#475569] hover:border-[#15803D] hover:text-[#15803D] transition-all shadow-2xs"
                                  >
                                    <span>View Cash Ledger</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>
                                </div>
                              </div>

                              {/* 4-Card Granular Telemetry Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {/* Metric 1: Completed Appointments */}
                                <div className="rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-3.5">
                                  <div className="flex items-center justify-between text-[#15803D]">
                                    <span className="text-[11px] font-extrabold uppercase">Fulfilled Done</span>
                                    <CheckCircle2 className="h-4 w-4" />
                                  </div>
                                  <p className="mt-1.5 text-2xl font-black text-[#15803D] tabular-nums">
                                    {count(r.completed)}
                                  </p>
                                  <span className="text-[11px] font-semibold text-[#16A34A]">
                                    {r.completionRate !== null ? `${r.completionRate}% completion rate` : 'No bookings'}
                                  </span>
                                </div>

                                {/* Metric 2: Open / In Chair */}
                                <div className="rounded-xl border border-[#EDE9FE] bg-[#FAF5FF] p-3.5">
                                  <div className="flex items-center justify-between text-[#6D28D9]">
                                    <span className="text-[11px] font-extrabold uppercase">Open / In Queue</span>
                                    <Clock className="h-4 w-4" />
                                  </div>
                                  <p className="mt-1.5 text-2xl font-black text-[#6D28D9] tabular-nums">
                                    {count(r.upcoming)}
                                  </p>
                                  <span className="text-[11px] font-semibold text-[#7C3AED]">
                                    Active appointments on date
                                  </span>
                                </div>

                                {/* Metric 3: Cancelled & No-Show Drop-offs */}
                                <div className="rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] p-3.5">
                                  <div className="flex items-center justify-between text-[#B91C1C]">
                                    <span className="text-[11px] font-extrabold uppercase">Drop-offs & No-Shows</span>
                                    <XCircle className="h-4 w-4" />
                                  </div>
                                  <p className="mt-1.5 text-2xl font-black text-[#B91C1C] tabular-nums">
                                    {count(r.cancelled + r.noShow)}
                                  </p>
                                  <span className="text-[11px] font-semibold text-[#DC2626]">
                                    {r.cancelled} cancelled · {r.noShow} no-show
                                  </span>
                                </div>

                                {/* Metric 4: Cash Velocity */}
                                <div className="rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-3.5">
                                  <div className="flex items-center justify-between text-[#15803D]">
                                    <span className="text-[11px] font-extrabold uppercase">Settled Cash</span>
                                    <Banknote className="h-4 w-4" />
                                  </div>
                                  <p className="mt-1.5 text-2xl font-black text-[#15803D] tabular-nums">
                                    {money(r.cashAmount)}
                                  </p>
                                  <span className="text-[11px] font-semibold text-[#16A34A]">
                                    {r.totalBookings > 0 && r.cashAmount > 0
                                      ? `~${money(Math.round(r.cashAmount / r.totalBookings))} per booking`
                                      : 'Recorded at salon counter'}
                                  </span>
                                </div>
                              </div>

                              {/* Conversion Strip if signups exist */}
                              {!isHourlyMode && r.totalSignups > 0 && (
                                <div className="flex items-center justify-between rounded-xl bg-[#F8FAFC] border border-[#F1F5F9] px-4 py-2.5 text-[12px]">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-[#635BFF]" />
                                    <span className="font-extrabold text-[#1E293B]">
                                      New Registrations on {r.label}:
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="font-bold text-[#475569]">
                                      <b className="text-[#635BFF] font-black">{r.customers}</b> Customers
                                    </span>
                                    <span className="font-bold text-[#475569]">
                                      <b className="text-[#0EA5E9] font-black">{r.partners}</b> Partners (Barbers/Shops)
                                    </span>
                                  </div>
                                </div>
                              )}
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F1F5F9] pt-3 text-[12px] text-[#64748B]">
          {/* Left: Rows per page selector */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#475569]">Rows per page:</span>
            <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5">
              {([10, 25, 50, 'all'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-extrabold transition-all cursor-pointer ${
                    pageSize === size
                      ? 'bg-[#635BFF] text-white shadow-2xs'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {size === 'all' ? 'All' : size}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-[#94A3B8] ml-1">
              Showing{' '}
              {pageSize === 'all'
                ? processedRows.length
                : Math.min(processedRows.length, (safePage - 1) * pageSize + 1)}
              –{pageSize === 'all' ? processedRows.length : Math.min(processedRows.length, safePage * pageSize)}{' '}
              of {processedRows.length} {isHourlyMode ? 'hours' : 'days'}
            </span>
          </div>

          {/* Right: Page Navigation */}
          {pageSize !== 'all' && totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1E293B] disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
                title="First page"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1E293B] disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
                title="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <span className="px-2.5 text-[12px] font-extrabold text-[#1E293B]">
                Page {safePage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1E293B] disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
                title="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#1E293B] disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
                title="Last page"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
