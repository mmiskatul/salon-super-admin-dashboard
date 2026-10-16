'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  Users,
  TrendingUp,
  UserCheck,
  Smartphone,
  Share2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  Filter,
  Flame,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Repeat,
} from 'lucide-react';
import type { Growth } from '@/lib/api/insights';
import { count } from '@/lib/format';
import { Badge } from '@/components/ui/primitives';
import { percent } from '@/components/insights/Bits';

// Palette tokens
const COLORS = {
  primary: '#635BFF',
  primaryLight: '#818CF8',
  primaryFaint: '#EEF2FF',
  customer: '#635BFF',
  barber: '#0EA5E9',
  owner: '#10B981',
  returning: '#10B981',
  firstTime: '#635BFF',
  warning: '#F59E0B',
  danger: '#EF4444',
  slateDark: '#1E293B',
  slateMuted: '#64748B',
  slateLight: '#94A3B8',
  slateBorder: '#E2E8F0',
  slateBg: '#F8FAFC',
};

const PIE_PALETTE = ['#635BFF', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

interface TooltipItem {
  color?: string;
  name: string;
  value: number;
  payload?: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
  labelProp?: string;
  formatValue?: (val: number) => string;
}

export function GlassTooltip({ active, payload, label, labelProp, formatValue }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const itemPayload = payload[0]?.payload as Record<string, unknown> | undefined;
  const headerText =
    (labelProp && itemPayload && String(itemPayload[labelProp])) ||
    label ||
    (itemPayload?.fullLabel ? String(itemPayload.fullLabel) : undefined) ||
    (itemPayload?.day ? String(itemPayload.day) : undefined);

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white/95 p-3.5 shadow-xl backdrop-blur-md font-manrope text-[12px] min-w-[190px] z-50">
      {headerText && (
        <div className="font-bold text-[#1E293B] border-b border-[#F1F5F9] pb-1.5 mb-2.5 flex items-center justify-between">
          <span>{headerText}</span>
          {itemPayload?.total !== undefined && (
            <span className="text-[11px] font-semibold text-[#635BFF] bg-[#EEF2FF] px-2 py-0.5 rounded-md">
              Total: {count(Number(itemPayload.total))}
            </span>
          )}
        </div>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: entry.color }} />
              <span className="text-[#64748B] font-semibold">{entry.name}</span>
            </div>
            <span className="font-extrabold text-[#1E293B] tabular-nums">
              {formatValue ? formatValue(entry.value) : count(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------------------
// 1. SIGNUP DYNAMICS & MOMENTUM CHART
// -----------------------------------------------------------------------------------------
export function SignupTrajectoryChart({
  growth,
  days,
}: {
  growth: Growth;
  days: number;
}) {
  const [viewMode, setViewMode] = useState<'stacked' | 'total' | 'cumulative'>('stacked');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const timelineUnit = growth.timeline?.unit ?? (days === 1 ? 'hour' : days === 7 ? 'day' : days <= 90 ? 'week' : 'month');

  const chartData = useMemo(() => {
    // 1. If backend provided timeline buckets, use them directly
    if (growth.timeline?.buckets && growth.timeline.buckets.length > 0) {
      let runningTotal = 0;
      return growth.timeline.buckets.map((b) => {
        const customers = b.customers || 0;
        const barbers = b.barbers || 0;
        const owners = b.owners || 0;
        const total = b.total || customers + barbers + owners;
        runningTotal += total;

        return {
          ...b,
          customers,
          barbers,
          owners,
          total,
          cumulative: runningTotal,
          xLabel: b.shortLabel,
          fullLabel: b.label,
        };
      });
    }

    // 2. Client-side fallback transformation based on grain:
    const signups = growth.signupsByDay || [];

    if (days === 1) {
      // 24 Hours for Today: 12 AM .. 11 PM
      let runningTotal = 0;
      return Array.from({ length: 24 }, (_, h) => {
        const hStr = String(h).padStart(2, '0');
        const period = h < 12 ? 'AM' : 'PM';
        const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
        // If single day data exists, spread or show matching
        const dayItem = signups[0];
        const customers = dayItem && h === 12 ? dayItem.customers : 0;
        const barbers = dayItem && h === 12 ? dayItem.barbers : 0;
        const owners = dayItem && h === 12 ? dayItem.owners : 0;
        const total = customers + barbers + owners;
        runningTotal += total;

        return {
          key: `${hStr}:00`,
          xLabel: `${displayH} ${period}`,
          fullLabel: `${displayH}:00 ${period} (Today)`,
          customers,
          barbers,
          owners,
          total,
          cumulative: runningTotal,
        };
      });
    }

    if (days === 7) {
      // 7 Days: Day of Week (Mon, Tue, Wed, ...)
      let runningTotal = 0;
      return signups.map((d) => {
        const dateObj = new Date(`${d.day}T00:00:00.000Z`);
        const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
        const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
        const customers = d.customers || 0;
        const barbers = d.barbers || 0;
        const owners = d.owners || 0;
        const total = customers + barbers + owners;
        runningTotal += total;

        return {
          key: d.day,
          xLabel: weekday,
          fullLabel: `${weekday}, ${monthDay}`,
          customers,
          barbers,
          owners,
          total,
          cumulative: runningTotal,
        };
      });
    }

    if (days <= 90) {
      // 30 Days (Monthly): 4-5 Weeks (Week 1, Week 2, ...)
      const chunkSize = 7;
      const totalChunks = Math.ceil(signups.length / chunkSize);
      let runningTotal = 0;
      const weeks: Array<{
        key: string;
        xLabel: string;
        fullLabel: string;
        customers: number;
        barbers: number;
        owners: number;
        total: number;
        cumulative: number;
      }> = [];

      for (let w = 0; w < totalChunks; w++) {
        const slice = signups.slice(w * chunkSize, (w + 1) * chunkSize);
        if (slice.length === 0) continue;
        const firstDay = slice[0].day;
        const lastDay = slice[slice.length - 1].day;
        const firstDate = new Date(`${firstDay}T00:00:00.000Z`);
        const lastDate = new Date(`${lastDay}T00:00:00.000Z`);
        const firstStr = firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
        const lastStr = lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

        let customers = 0;
        let barbers = 0;
        let owners = 0;
        for (const item of slice) {
          customers += item.customers || 0;
          barbers += item.barbers || 0;
          owners += item.owners || 0;
        }
        const total = customers + barbers + owners;
        runningTotal += total;
        const weekNum = w + 1;

        weeks.push({
          key: `week-${weekNum}`,
          xLabel: `Week ${weekNum}`,
          fullLabel: `Week ${weekNum} (${firstStr} – ${lastStr})`,
          customers,
          barbers,
          owners,
          total,
          cumulative: runningTotal,
        });
      }

      return weeks;
    }

    // Yearly: 12 Months (Jan, Feb, Mar, ...)
    const monthsMap = new Map<string, {
      key: string;
      xLabel: string;
      fullLabel: string;
      customers: number;
      barbers: number;
      owners: number;
      total: number;
    }>();

    for (const d of signups) {
      const monthKey = d.day.slice(0, 7);
      if (!monthsMap.has(monthKey)) {
        const [year, m] = monthKey.split('-');
        const monthDate = new Date(parseInt(year, 10), parseInt(m, 10) - 1, 1);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
        monthsMap.set(monthKey, {
          key: monthKey,
          xLabel: monthName,
          fullLabel: `${monthName} ${year}`,
          customers: 0,
          barbers: 0,
          owners: 0,
          total: 0,
        });
      }

      const mItem = monthsMap.get(monthKey)!;
      mItem.customers += d.customers || 0;
      mItem.barbers += d.barbers || 0;
      mItem.owners += d.owners || 0;
      mItem.total += (d.customers || 0) + (d.barbers || 0) + (d.owners || 0);
    }

    let runningTotal = 0;
    return Array.from(monthsMap.values()).map((m) => {
      runningTotal += m.total;
      return {
        ...m,
        cumulative: runningTotal,
      };
    });
  }, [growth.timeline, growth.signupsByDay, days]);

  const summary = useMemo(() => {
    const totalPeriodSignups = chartData.reduce((acc, d) => acc + d.total, 0);
    const totalCustomers = chartData.reduce((acc, d) => acc + d.customers, 0);
    const totalBarbers = chartData.reduce((acc, d) => acc + d.barbers, 0);
    const totalOwners = chartData.reduce((acc, d) => acc + d.owners, 0);

    const divisor = timelineUnit === 'hour' ? 24 : chartData.length || 1;
    const rateUnit =
      timelineUnit === 'hour' ? '/ hr' : timelineUnit === 'day' ? '/ day' : timelineUnit === 'week' ? '/ wk' : '/ mo';
    const avgVelocity = (totalPeriodSignups / divisor).toFixed(1);

    let peakBucket = { label: '-', count: 0 };
    for (const d of chartData) {
      if (d.total > peakBucket.count) {
        peakBucket = { label: d.xLabel || d.fullLabel || '-', count: d.total };
      }
    }

    return {
      total: totalPeriodSignups,
      customers: totalCustomers,
      barbers: totalBarbers,
      owners: totalOwners,
      avgVelocity,
      rateUnit,
      peakBucket,
    };
  }, [chartData, timelineUnit]);

  // Tick interval on X-axis:
  // - 24 hours: show every 3rd hour: 12 AM, 3 AM, 6 AM, 9 AM, 12 PM, 3 PM, 6 PM, 9 PM
  // - Weekly: 0 (show all 7 days)
  // - Monthly: 0 (show all 4-5 weeks)
  // - Yearly: 0 (show all 12 months)
  const tickInterval = timelineUnit === 'hour' ? 2 : 0;

  const headerTitle =
    timelineUnit === 'hour'
      ? 'User Acquisition Dynamics (Today · 24-Hour View)'
      : timelineUnit === 'day'
      ? 'User Acquisition Dynamics (Weekly View · Day-by-Day)'
      : timelineUnit === 'week'
      ? 'User Acquisition Dynamics (Monthly View · Week-by-Week)'
      : 'User Acquisition Dynamics (Yearly View · Month-by-Month)';

  const headerSubtitle =
    timelineUnit === 'hour'
      ? 'Hourly onboarding trajectory across customers, barbers, and salon owners over 24 hours'
      : timelineUnit === 'day'
      ? 'Daily onboarding trajectory across customers, barbers, and salon owners across the past 7 days'
      : timelineUnit === 'week'
      ? 'Weekly onboarding cohorts across customers, barbers, and salon owners across the past month'
      : 'Monthly onboarding trajectory across customers, barbers, and salon owners over the past year';

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs font-manrope">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-extrabold text-[#1E293B] tracking-tight">
              {headerTitle}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-extrabold text-[#6D28D9]">
              <Sparkles className="h-2.5 w-2.5" /> Recharts
            </span>
          </div>
          <p className="text-[12px] font-medium text-[#64748B] mt-0.5">
            {headerSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="inline-flex items-center rounded-xl bg-[#F8FAFC] p-1 border border-[#E2E8F0] text-[12px] font-bold">
            <button
              type="button"
              onClick={() => setViewMode('stacked')}
              className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                viewMode === 'stacked'
                  ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              By Role
            </button>
            <button
              type="button"
              onClick={() => setViewMode('total')}
              className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                viewMode === 'total'
                  ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {timelineUnit === 'hour' ? 'Hourly Total' : timelineUnit === 'day' ? 'Daily Total' : timelineUnit === 'week' ? 'Weekly Total' : 'Monthly Total'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cumulative')}
              className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                viewMode === 'cumulative'
                  ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Cumulative
            </button>
          </div>

          {/* Chart visual type toggle */}
          {viewMode !== 'cumulative' && (
            <div className="inline-flex items-center rounded-xl bg-[#F8FAFC] p-1 border border-[#E2E8F0] text-[12px] font-bold">
              <button
                type="button"
                onClick={() => setChartType('area')}
                className={`rounded-lg px-2 py-1 transition-all cursor-pointer ${
                  chartType === 'area'
                    ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
                title="Area Chart"
              >
                Area
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`rounded-lg px-2 py-1 transition-all cursor-pointer ${
                  chartType === 'bar'
                    ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
                title="Bar Chart"
              >
                Bar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Summary KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/70 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">New Registrations</p>
          <p className="mt-1 text-[20px] font-black text-[#1E293B] tabular-nums">{count(summary.total)}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#64748B] font-medium">
            <span className="h-2 w-2 rounded-full bg-[#635BFF]" />
            <span>{count(summary.customers)} customers ({summary.total > 0 ? Math.round((summary.customers / summary.total) * 100) : 0}%)</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/70 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Acquisition Velocity</p>
          <p className="mt-1 text-[20px] font-black text-[#1E293B] tabular-nums">{summary.avgVelocity} <span className="text-[12px] font-semibold text-[#94A3B8]">{summary.rateUnit}</span></p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#64748B] font-medium">
            <span className="h-2 w-2 rounded-full bg-[#0EA5E9]" />
            <span>{count(summary.barbers)} barbers · {count(summary.owners)} owners</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/70 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            {timelineUnit === 'hour' ? 'Peak Hour' : timelineUnit === 'day' ? 'Peak Day' : timelineUnit === 'week' ? 'Peak Week' : 'Peak Month'}
          </p>
          <p className="mt-1 text-[20px] font-black text-[#1E293B] tabular-nums">
            {summary.peakBucket.count > 0 ? count(summary.peakBucket.count) : '0'}
            <span className="text-[12px] font-semibold text-[#94A3B8] ml-1">users</span>
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[#635BFF] truncate">
            {summary.peakBucket.count > 0 ? summary.peakBucket.label : 'None in range'}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/70 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Verification Gap</p>
          <p className="mt-1 text-[20px] font-black text-[#EF4444] tabular-nums">{count(growth.totals.unverified)}</p>
          <p className="mt-1 text-[11px] font-semibold text-[#64748B]">
            Pending email confirmation
          </p>
        </div>
      </div>

      {/* Main Interactive Rechart Container */}
      <div className="h-[280px] w-full font-manrope">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'cumulative' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="growthCumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="xLabel"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                interval={tickInterval}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => count(val)}
              />
              <Tooltip content={<GlassTooltip formatValue={(v) => `${count(v)} total users`} />} />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Cumulative Sign-ups"
                stroke={COLORS.primary}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#growthCumulativeGrad)"
              />
            </AreaChart>
          ) : viewMode === 'total' ? (
            chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthTotalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="xLabel"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  interval={tickInterval}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => count(val)}
                />
                <Tooltip content={<GlassTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Daily Sign-ups"
                  stroke={COLORS.primary}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#growthTotalGrad)"
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="xLabel"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  interval={tickInterval}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => count(val)}
                />
                <Tooltip content={<GlassTooltip />} />
                <Bar
                  dataKey="total"
                  name="Total Sign-ups"
                  fill={COLORS.primary}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            )
          ) : chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCust" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.customer} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS.customer} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradBarber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.barber} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS.barber} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradOwner" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.owner} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS.owner} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="xLabel"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                interval={tickInterval}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => count(val)}
              />
              <Tooltip content={<GlassTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="customers"
                name="Customers"
                stackId="1"
                stroke={COLORS.customer}
                fill="url(#gradCust)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="barbers"
                name="Barbers"
                stackId="1"
                stroke={COLORS.barber}
                fill="url(#gradBarber)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="owners"
                name="Salon Owners"
                stackId="1"
                stroke={COLORS.owner}
                fill="url(#gradOwner)"
                strokeWidth={2}
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="xLabel"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                interval={tickInterval}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => count(val)}
              />
              <Tooltip content={<GlassTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }}
              />
              <Bar dataKey="customers" name="Customers" stackId="role" fill={COLORS.customer} radius={[0, 0, 0, 0]} maxBarSize={32} />
              <Bar dataKey="barbers" name="Barbers" stackId="role" fill={COLORS.barber} radius={[0, 0, 0, 0]} maxBarSize={32} />
              <Bar dataKey="owners" name="Salon Owners" stackId="role" fill={COLORS.owner} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------------------
// 2. CONVERSION & RETENTION FUNNEL CHART
// -----------------------------------------------------------------------------------------
export function FunnelAnalysisSuite({
  growth,
  days,
}: {
  growth: Growth;
  days: number;
}) {
  const f = growth.funnel;
  const startedTotal = f.startedNotFinished + f.gaveUp + f.signedUp;

  // Funnel steps data for visualization
  const funnelSteps = [
    {
      id: 'initiated',
      name: 'Registration Started',
      description: 'Initiated OTP registration',
      count: startedTotal,
      pctOfStart: 100,
      color: '#818CF8',
    },
    {
      id: 'verified',
      name: 'Verified & Signed Up',
      description: 'Completed email verification',
      count: f.signedUp,
      pctOfStart: startedTotal > 0 ? Math.round((f.signedUp / startedTotal) * 100) : 100,
      dropoff: f.gaveUp,
      dropoffLabel: `${f.gaveUp} expired/gave up`,
      color: '#635BFF',
    },
    {
      id: 'firstBooking',
      name: 'First Booking Completed',
      description: 'Activated customer with 1st appointment',
      count: f.firstBooking,
      pctOfStart: startedTotal > 0 ? Math.round((f.firstBooking / startedTotal) * 100) : 0,
      conversionRate: f.signupToBookingRate,
      color: '#0EA5E9',
    },
    {
      id: 'repeated',
      name: 'Booked Again (Retained)',
      description: 'Customers with 2 or more bookings',
      count: f.bookedAgain,
      pctOfStart: startedTotal > 0 ? Math.round((f.bookedAgain / startedTotal) * 100) : 0,
      conversionRate: f.repeatRate,
      color: '#10B981',
    },
  ];

  const horizontalChartData = funnelSteps.map((s) => ({
    name: s.name,
    count: s.count,
    fill: s.color,
  }));

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs font-manrope">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-extrabold text-[#1E293B] tracking-tight">
              Customer Journey & Conversion Funnel
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-extrabold text-[#059669]">
              <TrendingUp className="h-2.5 w-2.5" /> Retention Pipeline
            </span>
          </div>
          <p className="text-[12px] font-medium text-[#64748B] mt-0.5">
            Stage progression and conversion drop-offs from sign-up intent to repeat bookings ({days}d cohort)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone={f.signupToBookingRate && f.signupToBookingRate > 25 ? 'live' : 'warning'}>
            Signup → 1st Booking: {percent(f.signupToBookingRate)}
          </Badge>
          <Badge tone={f.repeatRate && f.repeatRate > 30 ? 'live' : 'primary'}>
            Repeat Rate: {percent(f.repeatRate)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Recharts Horizontal Funnel Bar Chart */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={horizontalChartData}
                margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip content={<GlassTooltip formatValue={(v) => `${count(v)} customers`} />} />
                <Bar dataKey="count" name="Customers" radius={[0, 6, 6, 0]}>
                  {horizontalChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-[12px] text-[#64748B]">
            <p className="font-semibold text-[#1E293B]">Cohort Insights:</p>
            <p className="mt-1">
              Of <b>{count(f.signedUp)}</b> customers signed up in this period, <b>{count(f.firstBooking)}</b> booked ({percent(f.signupToBookingRate)}), and <b>{count(f.bookedAgain)}</b> returned for a second appointment ({percent(f.repeatRate)}).
            </p>
          </div>
        </div>

        {/* Right: Detailed Stage Cards & Drop-off Flow */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          {funnelSteps.map((step, idx) => {
            const isLast = idx === funnelSteps.length - 1;
            return (
              <div
                key={step.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-2xs hover:border-[#CBD5E1] transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-black text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: step.color }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-[13px] font-bold text-[#1E293B]">{step.name}</p>
                      <p className="text-[11px] font-medium text-[#64748B]">{step.description}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[15px] font-black text-[#1E293B] tabular-nums">{count(step.count)}</p>
                    {step.conversionRate !== undefined ? (
                      <span className="text-[11px] font-bold text-[#635BFF]">{percent(step.conversionRate)} conv.</span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#64748B]">{step.pctOfStart}%</span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2.5 h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${step.pctOfStart}%`,
                      backgroundColor: step.color,
                    }}
                  />
                </div>

                {step.dropoff !== undefined && step.dropoff > 0 && (
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#EF4444] font-medium">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {step.dropoffLabel}
                    </span>
                    <span className="font-bold">
                      {startedTotal > 0 ? Math.round((step.dropoff / startedTotal) * 100) : 0}% unverified drop-off
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------------------
// 3. RETENTION & BOOKERS COMPOSITION CHART (First-time vs Returning)
// -----------------------------------------------------------------------------------------
export function BookerCompositionSuite({
  growth,
}: {
  growth: Growth;
}) {
  const b = growth.bookers;
  const totalBookers = b.firstTime + b.returning;
  const returningRate = totalBookers > 0 ? Math.round((b.returning / totalBookers) * 100) : 0;
  const firstTimeRate = totalBookers > 0 ? Math.round((b.firstTime / totalBookers) * 100) : 0;

  const data = [
    { name: 'First-time Bookers', value: b.firstTime, color: COLORS.firstTime },
    { name: 'Returning Loyal Bookers', value: b.returning, color: COLORS.returning },
  ];

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs font-manrope flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-extrabold text-[#1E293B] tracking-tight">
                Customer Loyalty & Repeat Mix
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-extrabold text-[#635BFF]">
                <Repeat className="h-2.5 w-2.5" /> Bookers Ratio
              </span>
            </div>
            <p className="text-[12px] font-medium text-[#64748B] mt-0.5">
              Breakdown of customers who booked during this timeframe
            </p>
          </div>
          <Badge tone={returningRate >= 35 ? 'live' : 'primary'}>
            {returningRate}% Returning
          </Badge>
        </div>

        {/* Donut Chart with Center Metric */}
        <div className="relative h-[200px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<GlassTooltip formatValue={(v) => `${count(v)} customers`} />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[20px] font-black text-[#1E293B] tabular-nums">{count(totalBookers)}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Total Bookers</span>
          </div>
        </div>

        {/* Legend & Breakdown pills */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#635BFF]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#635BFF]" />
              <span>First-Timers</span>
            </div>
            <p className="mt-1 text-[18px] font-black text-[#1E293B] tabular-nums">{count(b.firstTime)}</p>
            <p className="text-[11px] font-semibold text-[#94A3B8]">{firstTimeRate}% of bookers</p>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#10B981]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
              <span>Returning</span>
            </div>
            <p className="mt-1 text-[18px] font-black text-[#1E293B] tabular-nums">{count(b.returning)}</p>
            <p className="text-[11px] font-semibold text-[#94A3B8]">{returningRate}% repeat cohort</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] text-[12px] text-[#64748B] flex items-center justify-between">
        <span>Repeat booking health:</span>
        <span className="font-bold text-[#1E293B]">
          {returningRate > 40 ? '🌟 Exceptional Retention' : returningRate >= 25 ? '✅ Solid Marketplace Stickiness' : '⚠️ Acquisition Focused'}
        </span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------------------
// 4. ACTIVE USERS PULSE & STICKINESS (DAU / WAU / MAU)
// -----------------------------------------------------------------------------------------
export function ActivePulseSuite({
  growth,
}: {
  growth: Growth;
}) {
  const { day, week, month } = growth.active;

  // Stickiness: DAU / MAU ratio (a gold standard SaaS/platform engagement metric)
  const stickinessRatio = month.total > 0 ? Math.round((day.total / month.total) * 100) : 0;
  const wauToMauRatio = month.total > 0 ? Math.round((week.total / month.total) * 100) : 0;

  const barData = [
    {
      label: 'Daily (DAU)',
      period: 'Today (24h)',
      total: day.total,
      customers: day.customers,
      partners: day.partners,
    },
    {
      label: 'Weekly (WAU)',
      period: 'Past 7 Days',
      total: week.total,
      customers: week.customers,
      partners: week.partners,
    },
    {
      label: 'Monthly (MAU)',
      period: 'Past 30 Days',
      total: month.total,
      customers: month.customers,
      partners: month.partners,
    },
  ];

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs font-manrope">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-extrabold text-[#1E293B] tracking-tight">
              Activity Pulse & Platform Stickiness
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-extrabold text-[#059669]">
              <Activity className="h-2.5 w-2.5" /> DAU / WAU / MAU
            </span>
          </div>
          <p className="text-[12px] font-medium text-[#64748B] mt-0.5">
            Active user presence across customers and salon service providers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone={stickinessRatio >= 20 ? 'live' : 'primary'}>
            DAU/MAU Stickiness: {stickinessRatio}%
          </Badge>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-12 items-center">
        {/* Left: Recharts Stacked Bar Chart */}
        <div className="md:col-span-7 h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => count(val)} />
              <Tooltip content={<GlassTooltip />} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }} />
              <Bar dataKey="customers" name="Customers" stackId="active" fill={COLORS.customer} maxBarSize={48} />
              <Bar dataKey="partners" name="Partners (Barbers/Staff)" stackId="active" fill={COLORS.barber} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Stickiness Gauge & Horizon Cards */}
        <div className="md:col-span-5 space-y-2.5">
          <div className="rounded-xl border border-[#E2E8F0] bg-linear-to-br from-[#635BFF]/5 to-[#8B5CF6]/10 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#635BFF]">Platform Stickiness</span>
              <span className="text-[14px] font-black text-[#635BFF] tabular-nums">{stickinessRatio}%</span>
            </div>
            <p className="mt-1 text-[11px] text-[#64748B]">
              Ratio of monthly active users who return on any given day. {stickinessRatio >= 20 ? 'High daily engagement!' : 'Normal marketplace frequency.'}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#E0E7FF] overflow-hidden">
              <div className="h-full rounded-full bg-[#635BFF]" style={{ width: `${Math.min(100, stickinessRatio * 2.5)}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
              <p className="font-bold text-[#64748B] text-[11px]">Today (DAU)</p>
              <p className="text-[16px] font-extrabold text-[#1E293B] tabular-nums mt-0.5">{count(day.total)}</p>
              <p className="text-[10px] text-[#94A3B8]">{day.customers} cust · {day.partners} part</p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
              <p className="font-bold text-[#64748B] text-[11px]">Month (MAU)</p>
              <p className="text-[16px] font-extrabold text-[#1E293B] tabular-nums mt-0.5">{count(month.total)}</p>
              <p className="text-[10px] text-[#94A3B8]">{month.customers} cust · {month.partners} part</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------------------
// 5. PUSH NOTIFICATION & DEVICE REACH
// -----------------------------------------------------------------------------------------
export function PushReachSuite({
  growth,
}: {
  growth: Growth;
}) {
  const p = growth.push;

  const platformData = (p.platforms || []).map((item, idx) => ({
    name: item.key ? item.key.toUpperCase() : `Platform ${idx + 1}`,
    value: item.count,
    color: PIE_PALETTE[idx % PIE_PALETTE.length],
  }));

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs font-manrope flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-extrabold text-[#1E293B] tracking-tight">
                Push Notification Reach & Devices
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-extrabold text-[#6D28D9]">
                <Smartphone className="h-2.5 w-2.5" /> Direct Reach
              </span>
            </div>
            <p className="text-[12px] font-medium text-[#64748B] mt-0.5">
              Active registered push tokens and operating system distribution
            </p>
          </div>
          <Badge tone={p.devices > 0 ? 'live' : 'signal'}>
            {p.devices} Registered Device{p.devices === 1 ? '' : 's'}
          </Badge>
        </div>

        {/* Customer vs Partner Reach Progress */}
        <div className="space-y-3 mb-4">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-bold text-[#1E293B]">Customer Notification Reach</span>
              <span className="font-extrabold text-[#635BFF] tabular-nums">
                {percent(p.customers.percent)} ({p.customers.withPush} / {p.customers.users})
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#635BFF] transition-all"
                style={{ width: `${p.customers.percent ?? 0}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-bold text-[#1E293B]">Partner (Salon Staff/Owner) Reach</span>
              <span className="font-extrabold text-[#0EA5E9] tabular-nums">
                {percent(p.partners.percent)} ({p.partners.withPush} / {p.partners.users})
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0EA5E9] transition-all"
                style={{ width: `${p.partners.percent ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Platform breakdown chart if devices exist */}
        {platformData.length > 0 ? (
          <div className="mt-4 pt-3 border-t border-[#F1F5F9]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">Device Ecosystem</p>
            <div className="flex items-center justify-between gap-4">
              <div className="h-[120px] w-[120px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={platformData} dataKey="value" innerRadius={28} outerRadius={46} paddingAngle={2}>
                      {platformData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<GlassTooltip formatValue={(v) => `${count(v)} devices`} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-1.5 text-[12px]">
                {platformData.map((plat) => (
                  <div key={plat.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#64748B] font-semibold">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: plat.color }} />
                      {plat.name}
                    </span>
                    <span className="font-extrabold text-[#1E293B] tabular-nums">{count(plat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-3 text-center text-[12px] text-[#64748B]">
            No mobile device tokens registered yet. Once mobile apps with FCM / APNS are connected, device distribution will display here.
          </div>
        )}
      </div>

      <p className="mt-3 text-[11px] text-[#94A3B8]">
        {p.devices === 0
          ? 'Tip: Android push requires Firebase (FCM) credentials configured in mobile app builds.'
          : 'Push notification enables instantaneous appointment alerts, reminders, and broadcast promos.'}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------------------
// 6. VIRAL REFERRAL ENGINE & WHO REFERRED WHO
// -----------------------------------------------------------------------------------------
export function ReferralEngineSuite({
  growth,
  days,
}: {
  growth: Growth;
  days: number;
}) {
  const ref = growth.referrals;
  const [activeSubTab, setActiveSubTab] = useState<'who-referred-who' | 'leaderboard' | 'spikes'>('who-referred-who');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'booked' | 'unbooked'>('all');

  const recentList = ref.recentReferrals || [];

  // Filtered referrals for "Who Referred Who"
  const filteredReferrals = useMemo(() => {
    return recentList.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (item.referrerName && item.referrerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.referredUserName && item.referredUserName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.referrerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.referredUserId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'booked'
          ? item.hasBooked
          : !item.hasBooked;

      return matchesSearch && matchesStatus;
    });
  }, [recentList, searchTerm, statusFilter]);

  const bookedCount = recentList.filter((r) => r.hasBooked).length;
  const conversionPct = recentList.length > 0 ? Math.round((bookedCount / recentList.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs font-manrope">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-extrabold text-[#1E293B] tracking-tight">
              Growth Viral Loop & Advocacy
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-extrabold text-[#B45309]">
              <Share2 className="h-2.5 w-2.5" /> Who Referred Who
            </span>
          </div>
          <p className="text-[12px] font-medium text-[#64748B] mt-0.5">
            Member-to-member referral lineage, direct inviter → invitee attribution, and appointment conversion
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">{ref.codes} Active Codes</Badge>
          <Badge tone="live">{ref.total} Total Invites</Badge>
          <Badge tone="quiet">{ref.inPeriod} in {days}d</Badge>
          {ref.referredWithoutBooking > 0 && (
            <Badge tone="warning">{ref.referredWithoutBooking} Invited Never Booked</Badge>
          )}
        </div>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3 mb-5">
        <div className="inline-flex items-center rounded-xl bg-[#F8FAFC] p-1 border border-[#E2E8F0] text-[12px] font-bold">
          <button
            type="button"
            onClick={() => setActiveSubTab('who-referred-who')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              activeSubTab === 'who-referred-who'
                ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Who Referred Who ({recentList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('leaderboard')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              activeSubTab === 'leaderboard'
                ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Top Advocates ({ref.topReferrers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('spikes')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              activeSubTab === 'spikes'
                ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-[#F59E0B]" />
            <span>Viral Influx Spikes ({ref.suspicious.length})</span>
          </button>
        </div>

        {activeSubTab === 'who-referred-who' && recentList.length > 0 && (
          <div className="flex items-center gap-2 text-[12px] text-[#64748B]">
            <span className="font-semibold">Conversion Rate:</span>
            <span className="font-extrabold text-[#10B981] tabular-nums">{conversionPct}% Booked</span>
            <span className="text-[#94A3B8]">({bookedCount}/{recentList.length})</span>
          </div>
        )}
      </div>

      {/* TAB 1: WHO REFERRED WHO DETAILS */}
      {activeSubTab === 'who-referred-who' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search referrer or referred user by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 pl-9 text-[12px] font-medium text-[#1E293B] placeholder-[#94A3B8] focus:border-[#635BFF] focus:bg-white focus:outline-none transition-all"
              />
              <Users className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-[11px] font-bold text-[#94A3B8] hover:text-[#1E293B]"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <span className="text-[#94A3B8] mr-1">Status:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#635BFF] text-white shadow-2xs font-extrabold'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                All ({recentList.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('booked')}
                className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                  statusFilter === 'booked'
                    ? 'bg-[#10B981] text-white shadow-2xs font-extrabold'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                ✅ Made Booking ({bookedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('unbooked')}
                className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                  statusFilter === 'unbooked'
                    ? 'bg-[#F59E0B] text-white shadow-2xs font-extrabold'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                ⏳ No Booking ({recentList.length - bookedCount})
              </button>
            </div>
          </div>

          {/* Referral Pairs List */}
          {filteredReferrals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center">
              <Share2 className="mx-auto h-8 w-8 text-[#94A3B8] mb-2" />
              <p className="font-bold text-[#1E293B] text-[14px]">
                {recentList.length === 0 ? 'No Referrals Recorded Yet' : 'No Referrals Match Your Filter'}
              </p>
              <p className="mt-1 text-[12px] text-[#64748B] max-w-md mx-auto">
                {recentList.length === 0
                  ? 'When users share their invite codes and new customers join through them, the detailed "Who Referred Who" lineage will display right here.'
                  : 'Try adjusting your search query or switching the status filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredReferrals.map((item) => {
                const dateLabel = item.createdAt ? item.createdAt.slice(0, 10) : 'Recent';
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-2xs hover:border-[#635BFF]/40 transition-all font-manrope"
                  >
                    {/* Referrer (Who invited) */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#635BFF] font-black text-[12px] shrink-0 border border-[#E0E7FF]">
                        {item.referrerName ? item.referrerName.slice(0, 2).toUpperCase() : 'RF'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                          Referrer (Inviter)
                        </span>
                        <Link
                          href={`/users/${item.referrerId}`}
                          className="font-bold text-[#1E293B] hover:text-[#635BFF] flex items-center gap-1 text-[13px] truncate"
                        >
                          <span>{item.referrerName || 'User ' + item.referrerId.slice(0, 8)}</span>
                          <ArrowUpRight className="h-3 w-3 text-[#94A3B8]" />
                        </Link>
                        <span className="text-[10px] text-[#94A3B8] font-mono">{item.referrerId.slice(0, 8)}...</span>
                      </div>
                    </div>

                    {/* Arrow / Connection Indicator */}
                    <div className="flex items-center justify-center shrink-0 px-2 text-[#64748B]">
                      <div className="flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-3 py-1 text-[11px] font-extrabold text-[#635BFF]">
                        <span>referred</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    {/* Referred User (Who was invited) */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#059669] font-black text-[12px] shrink-0 border border-[#D1FAE5]">
                        {item.referredUserName ? item.referredUserName.slice(0, 2).toUpperCase() : 'CU'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                          Referred Customer
                        </span>
                        <Link
                          href={`/users/${item.referredUserId}`}
                          className="font-bold text-[#1E293B] hover:text-[#635BFF] flex items-center gap-1 text-[13px] truncate"
                        >
                          <span>{item.referredUserName || 'User ' + item.referredUserId.slice(0, 8)}</span>
                          <ArrowUpRight className="h-3 w-3 text-[#94A3B8]" />
                        </Link>
                        <span className="text-[10px] text-[#94A3B8] font-mono">{item.referredUserId.slice(0, 8)}...</span>
                      </div>
                    </div>

                    {/* Outcome & Booking Conversion */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
                      <div className="flex items-center gap-1.5">
                        {item.hasBooked ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-extrabold text-[#059669]">
                            <CheckCircle2 className="h-3 w-3" /> Booked ({item.bookingCount} visit{item.bookingCount === 1 ? '' : 's'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-[11px] font-extrabold text-[#B45309]">
                            <AlertCircle className="h-3 w-3" /> No booking yet
                          </span>
                        )}
                        <Badge tone={item.status === 'COMPLETED' ? 'live' : 'plain'}>
                          {item.status}
                        </Badge>
                      </div>
                      <span className="text-[11px] font-medium text-[#94A3B8]">
                        Registered: {dateLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TOP ADVOCATES LEADERBOARD */}
      {activeSubTab === 'leaderboard' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[13px] font-bold text-[#1E293B]">Top Referral Advocates Leaderboard</h4>
              <span className="text-[11px] font-semibold text-[#94A3B8]">Ranked by total invited customers</span>
            </div>

            {ref.topReferrers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center text-[13px] text-[#64748B]">
                No active referrers recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {ref.topReferrers.map((referrer, rank) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const badge = rank < 3 ? medals[rank] : `#${rank + 1}`;
                  return (
                    <div
                      key={referrer.userId}
                      className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white p-3 hover:border-[#635BFF]/40 transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[14px] font-black w-6 text-center text-[#64748B] shrink-0">
                          {badge}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/users/${referrer.userId}`}
                            className="font-bold text-[#1E293B] hover:text-[#635BFF] flex items-center gap-1.5 truncate text-[13px]"
                          >
                            <span>{referrer.name || 'Anonymous User'}</span>
                            <ArrowUpRight className="h-3 w-3 text-[#94A3B8]" />
                          </Link>
                          <p className="text-[11px] text-[#94A3B8] font-mono truncate">{referrer.userId.slice(0, 10)}...</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[14px] font-black text-[#635BFF] tabular-nums">
                          {count(referrer.count)}
                          <span className="text-[11px] font-normal text-[#94A3B8] ml-1">invites</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-[13px] font-bold text-[#1E293B] mb-2.5">Referral Status Breakdown</h4>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 space-y-2">
              {ref.byStatus.length === 0 ? (
                <p className="text-[12px] text-[#94A3B8]">No referral status tags recorded.</p>
              ) : (
                ref.byStatus.map((status) => (
                  <div key={status.key} className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-[#64748B] uppercase text-[11px] tracking-wide">
                      {status.key}
                    </span>
                    <span className="font-extrabold text-[#1E293B] tabular-nums">{count(status.count)}</span>
                  </div>
                ))
              )}

              {ref.referredWithoutBooking > 0 && (
                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[12px] text-[#F59E0B] font-semibold">
                  <span>Invited without booking</span>
                  <span className="font-bold">{count(ref.referredWithoutBooking)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VIRAL INFLUX SPIKES */}
      {activeSubTab === 'spikes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[14px] font-bold text-[#1E293B]">Viral Influx Spikes & Velocity Audits</h4>
              <p className="text-[12px] text-[#64748B]">
                Flags single users generating 3 or more referral registrations on a single day.
              </p>
            </div>
            <Badge tone={ref.suspicious.length > 0 ? 'warning' : 'live'}>
              {ref.suspicious.length} Flags Detected
            </Badge>
          </div>

          {ref.suspicious.length === 0 ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 text-center text-[13px] text-[#64748B]">
              <p className="font-bold text-[#1E293B] flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#10B981]" /> All Referral Spikes Look Normal
              </p>
              <p className="mt-1 text-[12px] text-[#94A3B8]">
                No abnormal bursts detected. Any suspicious single-day referral spikes will appear here for audit.
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {ref.suspicious.map((s) => (
                <div
                  key={`${s.userId}-${s.day}`}
                  className="flex items-center justify-between rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] p-3 text-[12px]"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/users/${s.userId}`}
                      className="font-bold text-[#92400E] hover:underline truncate block"
                    >
                      {s.name || s.userId.slice(0, 10)}
                    </Link>
                    <span className="text-[11px] text-[#B45309]">Account ID: {s.userId.slice(0, 8)}...</span>
                  </div>
                  <Badge tone="warning">
                    {s.count} on {s.day}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

