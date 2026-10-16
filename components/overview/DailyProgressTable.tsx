'use client';

import React, { useMemo, useState } from 'react';
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
  TrendingUp,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Filter,
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

interface DayRow {
  day: string; // YYYY-MM-DD
  dateObj: Date;
  weekday: string;
  formattedDate: string;
  isToday: boolean;
  isYesterday: boolean;
  isSelected: boolean;
  totalBookings: number;
  completed: number;
  upcoming: number;
  cancelled: number;
  noShow: number;
  completionRate: number | null;
  cashAmount: number;
  customers: number;
  partners: number;
  totalSignups: number;
}

type SortField = 'date' | 'bookings' | 'completion' | 'cash' | 'signups';
type SortDirection = 'asc' | 'desc';
type QuickFilter = 'all' | 'hasBookings' | 'hasCash' | 'hasSignups';

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

  // Local today and yesterday ISO
  const { todayIso, yesterdayIso } = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    const tIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const yDate = new Date(Date.now() - 86400000);
    const yIso = `${yDate.getFullYear()}-${pad(yDate.getMonth() + 1)}-${pad(yDate.getDate())}`;
    return { todayIso: tIso, yesterdayIso: yIso };
  }, []);

  // Build combined daily rows from bookings, cash, and signups
  const rawRows = useMemo(() => {
    const bookingMap = new Map(overview.bookings.byDay.map((b) => [b.day, b]));
    const cashMap = new Map(overview.money.byDay.map((c) => [c.day, c.amount]));
    const signupMap = new Map(overview.signups.map((s) => [s.day, s]));

    // Collect all unique day strings
    const allDaysSet = new Set<string>();
    overview.bookings.byDay.forEach((b) => allDaysSet.add(b.day));
    overview.money.byDay.forEach((c) => allDaysSet.add(c.day));
    overview.signups.forEach((s) => allDaysSet.add(s.day));

    // Also include today if not in list
    allDaysSet.add(todayIso);

    const sortedDays = Array.from(allDaysSet).sort((a, b) => b.localeCompare(a)); // latest first

    return sortedDays.map((day): DayRow => {
      const dateObj = new Date(`${day}T00:00:00`);
      const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
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

      const completionRate =
        totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : null;

      const cashAmount = cashMap.get(day) ?? 0;

      const s = signupMap.get(day);
      const customers = s?.customers ?? 0;
      const partners = s?.partners ?? 0;
      const totalSignups = customers + partners;

      return {
        day,
        dateObj,
        weekday,
        formattedDate,
        isToday,
        isYesterday,
        isSelected,
        totalBookings,
        completed,
        upcoming,
        cancelled,
        noShow,
        completionRate,
        cashAmount,
        customers,
        partners,
        totalSignups,
      };
    });
  }, [overview, selectedDate, todayIso, yesterdayIso]);

  // Find peak day records
  const peakBookingsDay = useMemo(() => {
    let peak = { day: '', val: 0 };
    for (const r of rawRows) {
      if (r.totalBookings > peak.val) peak = { day: r.day, val: r.totalBookings };
    }
    return peak.val > 0 ? peak.day : null;
  }, [rawRows]);

  const peakCashDay = useMemo(() => {
    let peak = { day: '', val: 0 };
    for (const r of rawRows) {
      if (r.cashAmount > peak.val) peak = { day: r.day, val: r.cashAmount };
    }
    return peak.val > 0 ? peak.day : null;
  }, [rawRows]);

  // Filtered & Sorted rows
  const processedRows = useMemo(() => {
    let list = rawRows;

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.day.includes(q) ||
          r.weekday.toLowerCase().includes(q) ||
          r.formattedDate.toLowerCase().includes(q),
      );
    }

    // Quick filter
    if (quickFilter === 'hasBookings') {
      list = list.filter((r) => r.totalBookings > 0);
    } else if (quickFilter === 'hasCash') {
      list = list.filter((r) => r.cashAmount > 0);
    } else if (quickFilter === 'hasSignups') {
      list = list.filter((r) => r.totalSignups > 0);
    }

    // Sorting
    const sorted = [...list].sort((a, b) => {
      let diff = 0;
      if (sortField === 'date') {
        diff = a.day.localeCompare(b.day);
      } else if (sortField === 'bookings') {
        diff = a.totalBookings - b.totalBookings;
      } else if (sortField === 'completion') {
        const aRate = a.completionRate ?? -1;
        const bRate = b.completionRate ?? -1;
        diff = aRate - bRate;
      } else if (sortField === 'cash') {
        diff = a.cashAmount - b.cashAmount;
      } else if (sortField === 'signups') {
        diff = a.totalSignups - b.totalSignups;
      }

      return sortDirection === 'asc' ? diff : -diff;
    });

    return sorted;
  }, [rawRows, search, quickFilter, sortField, sortDirection]);

  // Aggregate summary of currently visible/filtered dataset
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

    return {
      daysCount: processedRows.length,
      totalBookings,
      totalCompleted,
      totalCash,
      totalSignups,
      avgCompletion,
    };
  }, [processedRows]);

  // Pagination calculation
  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1;
    return Math.max(1, Math.ceil(processedRows.length / pageSize));
  }, [processedRows.length, pageSize]);

  // Clamp current page if list length shrinks
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    if (pageSize === 'all') return processedRows;
    const start = (safePage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, safePage, pageSize]);

  // Toggle sorting on column header click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Export current table dataset to CSV
  const handleExportCsv = () => {
    const headers = [
      'Date',
      'Day of Week',
      'Total Bookings',
      'Completed',
      'Open / In Chair',
      'Cancelled',
      'No Show',
      'Completion Rate (%)',
      'Cash Recorded (BDT)',
      'Customer Signups',
      'Partner Signups',
      'Total Signups',
    ];

    const csvLines = [headers.join(',')];

    for (const r of processedRows) {
      const rowData = [
        `"${r.day}"`,
        `"${r.weekday}"`,
        r.totalBookings,
        r.completed,
        r.upcoming,
        r.cancelled,
        r.noShow,
        r.completionRate !== null ? r.completionRate : '—',
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
    link.download = `salunbd-daily-progress-${overview.days}d-${new Date().toISOString().slice(0, 10)}.csv`;
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
      title="Date-Wise Progress Breakdown"
      note={`Day-by-day record of bookings, earnings, and user sign-ups for the last ${overview.days} days`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#64748B] transition-all hover:border-[#635BFF]/40 hover:text-[#635BFF] cursor-pointer"
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
              placeholder="Filter date..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-36 sm:w-44 rounded-lg border border-[#E2E8F0] bg-white py-1 pr-7 pl-8 text-[12px] text-[#1E293B] placeholder-[#94A3B8] outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF]"
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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 border-b border-[#F1F5F9] pb-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#94A3B8] uppercase">
            <Filter className="h-3 w-3" /> Filter:
          </span>
          {(
            [
              { key: 'all', label: 'All Days' },
              { key: 'hasBookings', label: 'With Bookings' },
              { key: 'hasCash', label: 'With Cash' },
              { key: 'hasSignups', label: 'With Signups' },
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
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
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
        <div className="flex items-center gap-3 text-[11px] font-semibold text-[#64748B]">
          <span>
            <b className="text-[#1E293B]">{filteredSummary.daysCount}</b> days
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
              <span>
                <b className="text-[#1E293B]">{filteredSummary.avgCompletion}%</b> avg complete
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-[11px] font-bold tracking-wider text-[#64748B] uppercase select-none">
              <th
                onClick={() => handleSort('date')}
                className="cursor-pointer py-2.5 pr-4 pl-2 hover:text-[#1E293B]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date</span>
                  {renderSortIndicator('date')}
                </div>
              </th>

              <th
                onClick={() => handleSort('bookings')}
                className="cursor-pointer py-2.5 px-3 hover:text-[#1E293B]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Total Bookings</span>
                  {renderSortIndicator('bookings')}
                </div>
              </th>

              <th className="py-2.5 px-3">Progress Breakdown</th>

              <th
                onClick={() => handleSort('completion')}
                className="cursor-pointer py-2.5 px-3 text-right hover:text-[#1E293B]"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Completion</span>
                  {renderSortIndicator('completion')}
                </div>
              </th>

              <th
                onClick={() => handleSort('cash')}
                className="cursor-pointer py-2.5 px-3 text-right hover:text-[#1E293B]"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Cash Recorded</span>
                  {renderSortIndicator('cash')}
                </div>
              </th>

              <th
                onClick={() => handleSort('signups')}
                className="cursor-pointer py-2.5 px-3 text-right hover:text-[#1E293B]"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>New Signups</span>
                  {renderSortIndicator('signups')}
                </div>
              </th>

              <th className="py-2.5 pr-2 pl-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[13px] text-[#94A3B8]">
                  No matching dates found for current filter.
                </td>
              </tr>
            ) : (
              paginatedRows.map((r) => {
                const isPeakB = r.day === peakBookingsDay;
                const isPeakC = r.day === peakCashDay;

                return (
                  <tr
                    key={r.day}
                    onClick={() => onSelectDate(r.day)}
                    className={`group cursor-pointer transition-colors ${
                      r.isSelected
                        ? 'bg-[#EEF2FF] font-semibold text-[#1E293B]'
                        : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {/* Date Column */}
                    <td className="py-3 pr-4 pl-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold ${
                            r.isSelected
                              ? 'bg-[#635BFF] text-white shadow-xs'
                              : 'bg-[#F1F5F9] text-[#64748B] group-hover:bg-[#E2E8F0]'
                          }`}
                        >
                          {r.weekday}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#1E293B]">{r.formattedDate}</span>
                            <span className="text-[11px] text-[#94A3B8]">({r.day})</span>
                            {r.isToday && (
                              <span className="rounded-sm bg-[#DCFCE7] px-1.5 py-0.2 text-[9px] font-extrabold text-[#15803D]">
                                TODAY
                              </span>
                            )}
                            {r.isYesterday && (
                              <span className="rounded-sm bg-[#E0E7FF] px-1.5 py-0.2 text-[9px] font-extrabold text-[#4338CA]">
                                YEST
                              </span>
                            )}
                            {isPeakB && (
                              <span
                                className="inline-flex items-center gap-0.5 rounded-sm bg-[#FEF3C7] px-1.5 py-0.2 text-[9px] font-bold text-[#92400E]"
                                title="Busiest day for bookings in this period"
                              >
                                <Trophy className="h-2.5 w-2.5" /> Busiest
                              </span>
                            )}
                            {isPeakC && (
                              <span
                                className="inline-flex items-center gap-0.5 rounded-sm bg-[#DCFCE7] px-1.5 py-0.2 text-[9px] font-bold text-[#15803D]"
                                title="Highest revenue day in this period"
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
                      <b className="tabular-nums text-[#1E293B]">{count(r.totalBookings)}</b>
                    </td>

                    {/* Visual Progress Breakdown Bar */}
                    <td className="py-3 px-3">
                      <div className="min-w-[140px] space-y-1">
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
                                  className="bg-[#0EA5E9]"
                                  title={`Open / In Chair: ${r.upcoming}`}
                                />
                              )}
                              {(r.cancelled > 0 || r.noShow > 0) && (
                                <div
                                  style={{
                                    width: `${((r.cancelled + r.noShow) / r.totalBookings) * 100}%`,
                                  }}
                                  className="bg-[#EF4444]"
                                  title={`Cancelled / No-show: ${r.cancelled + r.noShow}`}
                                />
                              )}
                            </>
                          ) : (
                            <div className="w-full bg-[#E2E8F0]/40" />
                          )}
                        </div>

                        {/* Mini labels */}
                        <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                          <span className="flex items-center gap-0.5 text-[#16A34A]">
                            <CheckCircle2 className="h-2.5 w-2.5" /> {r.completed}
                          </span>
                          <span className="flex items-center gap-0.5 text-[#0EA5E9]">
                            <Clock className="h-2.5 w-2.5" /> {r.upcoming}
                          </span>
                          <span className="flex items-center gap-0.5 text-[#EF4444]">
                            <XCircle className="h-2.5 w-2.5" /> {r.cancelled + r.noShow}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Completion Rate */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {r.completionRate !== null ? (
                        <span
                          className={`inline-block rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                            r.completionRate >= 80
                              ? 'bg-[#DCFCE7] text-[#15803D]'
                              : r.completionRate >= 50
                              ? 'bg-[#FEF3C7] text-[#92400E]'
                              : 'bg-[#FEE2E2] text-[#991B1B]'
                          }`}
                        >
                          {r.completionRate}%
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>

                    {/* Cash Recorded */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span className="font-bold tabular-nums text-[#1E293B]">
                        {money(r.cashAmount)}
                      </span>
                    </td>

                    {/* New Signups */}
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

                    {/* Action */}
                    <td className="py-3 pr-2 pl-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDate(r.day);
                        }}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                          r.isSelected
                            ? 'bg-[#635BFF] text-white shadow-2xs'
                            : 'bg-[#F1F5F9] text-[#635BFF] hover:bg-[#635BFF] hover:text-white'
                        }`}
                      >
                        <span>{r.isSelected ? 'Selected' : 'Focus'}</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
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
