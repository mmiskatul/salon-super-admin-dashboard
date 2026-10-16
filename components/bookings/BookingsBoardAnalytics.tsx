'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Calendar,
  Clock,
  Layers,
  TrendingUp,
  AlertTriangle,
  Scissors,
  Store,
  DollarSign,
  Activity,
} from 'lucide-react';
import type { BookingBoard, CancelGroup } from '@/lib/api/insights';
import { CANCEL_GROUP_LABELS } from '@/lib/api/insights';
import { count, money } from '@/lib/format';
import { percent } from '@/components/insights/Bits';

const COLORS = {
  completed: '#10B981',    // Emerald
  open: '#635BFF',         // Indigo
  cancelled: '#F59E0B',    // Amber
  noShow: '#EF4444',       // Red
  sky: '#0EA5E9',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatValue?: (val: number) => string;
}

function GlassTooltip({ active, payload, label, formatValue }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0]?.payload;
  const title = label || item?.name || item?.label;

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white/95 p-3.5 shadow-xl backdrop-blur-md font-manrope text-[12px] min-w-[200px] z-50">
      {title && (
        <div className="font-bold text-[#1E293B] border-b border-[#F1F5F9] pb-1.5 mb-2">
          <p className="text-[13px] text-[#1E293B] font-extrabold truncate">{title}</p>
          {item?.subLabel && (
            <p className="text-[10px] font-medium text-[#64748B] mt-0.5">{item.subLabel}</p>
          )}
        </div>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, idx) => (
          <div key={`entry-${idx}`} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-[#64748B] font-semibold">{entry.name}</span>
            </div>
            <span className="font-extrabold text-[#1E293B] tabular-nums">
              {formatValue ? formatValue(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BookingsBoardAnalytics({
  data,
  onSelectCancelledBy,
}: {
  data: BookingBoard;
  onSelectCancelledBy?: (group: CancelGroup) => void;
}) {
  const { summary, byDay, weekdays, cancellations, services } = data;

  // 1. Outcome shares donut data
  const outcomeDonutData = useMemo(() => {
    const total = summary.total || 1;
    return [
      { name: 'Completed Visits', value: summary.completed, color: COLORS.completed, share: Math.round((summary.completed / total) * 100) },
      { name: 'Open / Upcoming', value: summary.open, color: COLORS.open, share: Math.round((summary.open / total) * 100) },
      { name: 'Cancelled', value: summary.cancelled, color: COLORS.cancelled, share: Math.round((summary.cancelled / total) * 100) },
      { name: 'No-Show', value: summary.noShow, color: COLORS.noShow, share: Math.round((summary.noShow / total) * 100) },
    ].filter((i) => i.value > 0);
  }, [summary]);

  // 2. Daily trends data (formatting labels)
  const dailyTrendsData = useMemo(() => {
    return (byDay || []).map((d) => ({
      ...d,
      shortDay: d.day.length > 5 ? d.day.slice(5) : d.day,
    }));
  }, [byDay]);

  // 3. Who cancelled data
  const whoCancelledData = useMemo(() => {
    return (cancellations?.byWho || []).map((w) => ({
      key: w.key,
      label: CANCEL_GROUP_LABELS[w.key] || w.key,
      count: w.count,
    }));
  }, [cancellations]);

  // 4. Lead time data
  const leadTimeData = useMemo(() => {
    return (cancellations?.leadTime || []).map((l) => ({
      ...l,
      fill: l.key === 'after' || l.key === 'lt2h' ? '#EF4444' : l.key === 'lt24h' ? '#F59E0B' : '#10B981',
    }));
  }, [cancellations]);

  // 5. Top 5 services
  const topServicesData = useMemo(() => {
    return (services || []).slice(0, 5).map((s) => ({
      name: s.name,
      shortName: s.name.length > 15 ? s.name.slice(0, 13) + '…' : s.name,
      total: s.total,
      completed: s.completed,
      cancelled: s.cancelled,
      subLabel: `${s.completed} done · ${percent(s.cancelRate)} cancelled`,
    }));
  }, [services]);

  return (
    <div className="space-y-6 font-manrope">
      {/* Row 1: Daily Visit Trends + Outcome Share Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Visit Volume Trends */}
        <div className="lg:col-span-8 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-[#635BFF]">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1E293B]">
                  Daily Bookings & Outcome Volume
                </h3>
              </div>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                Completed, upcoming, and cancelled visits plotted across the active timeframe
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-[#10B981]">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" /> Done ({summary.completed})
              </span>
              <span className="flex items-center gap-1 text-[#635BFF]">
                <span className="h-2 w-2 rounded-full bg-[#635BFF]" /> Open ({summary.open})
              </span>
              <span className="flex items-center gap-1 text-[#F59E0B]">
                <span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Cancelled ({summary.cancelled})
              </span>
            </div>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyTrendsData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="shortDay"
                  stroke="#64748B"
                  fontSize={11}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <Tooltip
                  content={
                    <GlassTooltip
                      formatValue={(val) => `${val} bookings`}
                    />
                  }
                />
                <Bar dataKey="completed" name="Completed" stackId="day" fill={COLORS.completed} />
                <Bar dataKey="open" name="Open / Upcoming" stackId="day" fill={COLORS.open} />
                <Bar dataKey="cancelled" name="Cancelled" stackId="day" fill={COLORS.cancelled} />
                <Bar dataKey="noShow" name="No-Show" stackId="day" fill={COLORS.noShow} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Outcome Shares Donut */}
        <div className="lg:col-span-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1E293B]">
                  Outcome Shares
                </h3>
              </div>
              <span className="text-[12px] font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                {count(summary.total)} Total
              </span>
            </div>

            <div className="h-[160px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomeDonutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {outcomeDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <GlassTooltip
                        formatValue={(val) => `${val} visits`}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 mt-2">
              {outcomeDonutData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-[11px] p-1 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-[#334155] truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="font-extrabold text-[#1E293B]">{item.value}</span>
                    <span className="text-[#94A3B8] font-semibold w-8 text-right">({item.share}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px]">
            <span className="font-bold text-[#64748B]">Walk-in Appointments:</span>
            <span className="font-extrabold text-[#1E293B]">{summary.walkIns} visits</span>
          </div>
        </div>
      </div>

      {/* Row 2: Cancellation Forensics (Who, Lead Time, Top Services) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Who Cancelled */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-3">
            <h4 className="text-[14px] font-bold text-[#1E293B]">Who Cancelled</h4>
            <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              {summary.cancelled} Total
            </span>
          </div>

          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={whoCancelledData}
                layout="vertical"
                margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
                onClick={(entry: any) => {
                  const key = entry?.activePayload?.[0]?.payload?.key;
                  if (key && onSelectCancelledBy) onSelectCancelledBy(key as CancelGroup);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis
                  dataKey="label"
                  type="category"
                  stroke="#475569"
                  fontSize={11}
                  fontWeight={700}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  content={
                    <GlassTooltip
                      formatValue={(val) => `${val} cancellations`}
                    />
                  }
                />
                <Bar dataKey="count" name="Cancellations" fill="#F59E0B" radius={[0, 4, 4, 0]} className="cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* When Cancelled (Lead Time) */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-3">
            <h4 className="text-[14px] font-bold text-[#1E293B]">Cancellation Lead Time</h4>
            <span className="text-[11px] font-bold text-[#64748B]">Before visit</span>
          </div>

          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={leadTimeData}
                layout="vertical"
                margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis
                  dataKey="label"
                  type="category"
                  stroke="#475569"
                  fontSize={11}
                  fontWeight={700}
                  tickLine={false}
                  width={85}
                />
                <Tooltip
                  content={
                    <GlassTooltip
                      formatValue={(val) => `${val} bookings`}
                    />
                  }
                />
                <Bar dataKey="count" name="Cancellations" radius={[0, 4, 4, 0]}>
                  {leadTimeData.map((entry, idx) => (
                    <Cell key={`lead-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Booked Services */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-3">
            <h4 className="text-[14px] font-bold text-[#1E293B]">Top Booked Services</h4>
            <span className="text-[11px] font-bold text-[#64748B]">Demand leaders</span>
          </div>

          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topServicesData}
                layout="vertical"
                margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis
                  dataKey="shortName"
                  type="category"
                  stroke="#475569"
                  fontSize={11}
                  fontWeight={700}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  content={
                    <GlassTooltip
                      formatValue={(val) => `${val} bookings`}
                    />
                  }
                />
                <Bar dataKey="total" name="Total Bookings" fill="#0EA5E9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Weekday Distribution */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-[#635BFF]">
                <Calendar className="h-4 w-4" />
              </div>
              <h3 className="text-[15px] font-bold text-[#1E293B]">
                Day of Week Pattern (Sunday to Saturday)
              </h3>
            </div>
            <p className="text-[12px] text-[#64748B] mt-0.5">
              Historical appointments grouped by weekday to identify peak staffing requirements
            </p>
          </div>
        </div>

        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weekdays}
              margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                stroke="#64748B"
                fontSize={11}
                fontWeight={700}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <Tooltip
                content={
                  <GlassTooltip
                    formatValue={(val) => `${val} bookings`}
                  />
                }
              />
              <Bar dataKey="completed" name="Completed" stackId="w" fill={COLORS.completed} />
              <Bar dataKey="open" name="Open / Upcoming" stackId="w" fill={COLORS.open} />
              <Bar dataKey="cancelled" name="Cancelled" stackId="w" fill={COLORS.cancelled} />
              <Bar dataKey="noShow" name="No-Show" stackId="w" fill={COLORS.noShow} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
