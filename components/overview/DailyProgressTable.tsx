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

export function DailyProgressTable({
  overview,
  selectedDate,
  onSelectDate,
}: DailyProgressTableProps) {
  const [search, setSearch] = useState('');

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
  const rows = useMemo(() => {
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
    for (const r of rows) {
      if (r.totalBookings > peak.val) peak = { day: r.day, val: r.totalBookings };
    }
    return peak.val > 0 ? peak.day : null;
  }, [rows]);

  const peakCashDay = useMemo(() => {
    let peak = { day: '', val: 0 };
    for (const r of rows) {
      if (r.cashAmount > peak.val) peak = { day: r.day, val: r.cashAmount };
    }
    return peak.val > 0 ? peak.day : null;
  }, [rows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.day.includes(q) ||
        r.weekday.toLowerCase().includes(q) ||
        r.formattedDate.toLowerCase().includes(q),
    );
  }, [rows, search]);

  return (
    <Panel
      title="Date-Wise Progress Breakdown"
      note={`Day-by-day record of bookings, earnings, and user sign-ups for the last ${overview.days} days`}
      actions={
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search date (e.g. Oct 15, Mon)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 rounded-lg border border-[#E2E8F0] bg-white py-1 pr-2.5 pl-8 text-[12px] text-[#1E293B] placeholder-[#94A3B8] outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF]"
            />
          </div>
          <span className="text-[12px] font-semibold text-[#64748B]">
            {filteredRows.length} day{filteredRows.length === 1 ? '' : 's'}
          </span>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-[11px] font-bold tracking-wider text-[#64748B] uppercase">
              <th className="py-2.5 pr-4 pl-2">Date</th>
              <th className="py-2.5 px-3">Total Bookings</th>
              <th className="py-2.5 px-3">Progress Breakdown</th>
              <th className="py-2.5 px-3 text-right">Completion</th>
              <th className="py-2.5 px-3 text-right">Cash Recorded</th>
              <th className="py-2.5 px-3 text-right">New Signups</th>
              <th className="py-2.5 pr-2 pl-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {filteredRows.map((r) => {
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
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-all ${
                        r.isSelected
                          ? 'bg-[#635BFF] text-white shadow-2xs'
                          : 'bg-[#F1F5F9] text-[#635BFF] hover:bg-[#635BFF] hover:text-white'
                      }`}
                    >
                      <span>{r.isSelected ? 'Selected' : 'Inspect'}</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
