'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { money, count } from '@/lib/format';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  labelProp?: string;
  formatValue?: (val: number) => string;
}

function GlassTooltip({ active, payload, label, labelProp, formatValue }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const itemPayload = payload[0]?.payload;
  const headerText =
    (labelProp && itemPayload && itemPayload[labelProp]) ||
    label ||
    itemPayload?.label ||
    itemPayload?.xLabel;

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white/95 p-3 shadow-lg backdrop-blur-md font-manrope text-[12px] min-w-[160px]">
      {headerText && <p className="font-bold text-[#1E293B] border-b border-[#F1F5F9] pb-1.5 mb-2">{headerText}</p>}
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-[#64748B] font-medium">{entry.name}</span>
            </div>
            <span className="font-bold text-[#1E293B] tabular-nums">
              {formatValue ? formatValue(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface TrendBookingItem {
  key?: string;
  label?: string;
  shortLabel?: string;
  day?: string;
  completed: number;
  upcoming: number;
  cancelled: number;
  noShow: number;
}

export interface TrendMoneyItem {
  key?: string;
  label?: string;
  shortLabel?: string;
  day?: string;
  amount: number;
  payments?: number;
}

/** 1. Interactive Bookings Trajectory Chart (Supports Hour, Day, Week, Month granularities) */
export function BookingsTrendChart({
  data,
  selectedDate,
  onSelectDate,
  days = 30,
  unit = 'day',
}: {
  data: TrendBookingItem[];
  selectedDate?: string;
  onSelectDate?: (day: string) => void;
  days?: number;
  unit?: 'hour' | 'day' | 'week' | 'month';
}) {
  const formattedData = data.map((d) => {
    const xLabel = d.shortLabel ?? (d.day ? d.day.slice(5) : d.key ?? '');
    const fullLabel = d.label ?? (d.day ? d.day : d.key ?? '');
    return {
      ...d,
      xLabel,
      fullLabel,
      total: d.completed + d.upcoming + d.cancelled + d.noShow,
    };
  });

  const tickInterval =
    unit === 'hour'
      ? 2 // show every 3rd hour: 12 AM, 3 AM, 6 AM, 9 AM, 12 PM, 3 PM, 6 PM, 9 PM
      : unit === 'month' || unit === 'week' || days === 7
      ? 0
      : days === 365
      ? Math.max(1, Math.floor(data.length / 12))
      : days === 90
      ? Math.max(1, Math.floor(data.length / 8))
      : days === 30
      ? Math.max(1, Math.floor(data.length / 7))
      : 0;

  const barSize =
    unit === 'hour'
      ? 12
      : unit === 'week'
      ? 36
      : unit === 'month'
      ? 28
      : days === 1
      ? 48
      : days === 7
      ? 24
      : undefined;

  return (
    <div className="h-[220px] w-full font-manrope">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          onClick={(state: any) => {
            if (state && state.activePayload && state.activePayload.length) {
              const clicked = state.activePayload[0].payload as { day?: string; key?: string };
              const target = clicked?.day ?? clicked?.key;
              if (target && onSelectDate && /^\d{4}-\d{2}-\d{2}$/.test(target)) {
                onSelectDate(target);
              }
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="xLabel"
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={<GlassTooltip labelProp="fullLabel" />}
            cursor={{ fill: '#F8FAFC', opacity: 0.8 }}
          />
          <Bar dataKey="completed" name="Completed" stackId="a" fill="#16A34A" maxBarSize={barSize} radius={[0, 0, 0, 0]} />
          <Bar dataKey="upcoming" name="Open / Upcoming" stackId="a" fill="#635BFF" maxBarSize={barSize} radius={[0, 0, 0, 0]} />
          <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill="#F59E0B" maxBarSize={barSize} radius={[0, 0, 0, 0]} />
          <Bar dataKey="noShow" name="No-Show" stackId="a" fill="#EF4444" maxBarSize={barSize} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 2. Interactive Cash Revenue Area/Bar Chart (Supports Hour, Day, Week, Month granularities) */
export function RevenueTrendChart({
  data,
  selectedDate,
  onSelectDate,
  days = 30,
  unit = 'day',
}: {
  data: TrendMoneyItem[];
  selectedDate?: string;
  onSelectDate?: (day: string) => void;
  days?: number;
  unit?: 'hour' | 'day' | 'week' | 'month';
}) {
  const formattedData = data.map((d) => {
    const xLabel = d.shortLabel ?? (d.day ? d.day.slice(5) : d.key ?? '');
    const fullLabel = d.label ?? (d.day ? d.day : d.key ?? '');
    return {
      ...d,
      xLabel,
      fullLabel,
    };
  });

  const tickInterval =
    unit === 'hour'
      ? 2
      : unit === 'month' || unit === 'week' || days === 7
      ? 0
      : days === 365
      ? Math.max(1, Math.floor(data.length / 12))
      : days === 90
      ? Math.max(1, Math.floor(data.length / 8))
      : days === 30
      ? Math.max(1, Math.floor(data.length / 7))
      : 0;

  const useBarChart = unit === 'hour' || formattedData.length <= 1;
  const barSize = unit === 'hour' ? 12 : 48;

  if (useBarChart) {
    return (
      <div className="h-[220px] w-full font-manrope">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="xLabel" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} interval={tickInterval} />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `৳${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />
            <Tooltip content={<GlassTooltip labelProp="fullLabel" formatValue={money} />} />
            <Bar dataKey="amount" name="Cash Recorded" fill="#16A34A" maxBarSize={barSize} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full font-manrope">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          onClick={(state: any) => {
            if (state && state.activePayload && state.activePayload.length) {
              const clicked = state.activePayload[0].payload as { day?: string; key?: string };
              const target = clicked?.day ?? clicked?.key;
              if (target && onSelectDate && /^\d{4}-\d{2}-\d{2}$/.test(target)) {
                onSelectDate(target);
              }
            }
          }}
        >
          <defs>
            <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="xLabel"
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `৳${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip
            content={<GlassTooltip labelProp="fullLabel" formatValue={money} />}
          />
          <Area
            type="monotone"
            dataKey="amount"
            name="Cash Recorded"
            stroke="#16A34A"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#cashGrad)"
            activeDot={{ r: 6, fill: '#16A34A', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 3. Sleek Donut Chart */
export function DonutBreakdownChart({
  parts,
  total,
  centreLabel = 'Total',
}: {
  parts: { name: string; value: number; color: string }[];
  total: number;
  centreLabel?: string;
}) {
  const validParts = parts.filter((p) => p.value > 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-manrope">
      {/* Pie Graphic with Centre Text */}
      <div className="relative h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={<GlassTooltip formatValue={(v) => `${count(v)} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`} />}
            />
            <Pie
              data={validParts.length ? validParts : [{ name: 'None', value: 1, color: '#F1F5F9' }]}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={validParts.length > 1 ? 3 : 0}
              dataKey="value"
              stroke="none"
            >
              {(validParts.length ? validParts : [{ name: 'None', value: 1, color: '#F1F5F9' }]).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">{centreLabel}</span>
          <span className="text-[20px] font-extrabold text-[#1E293B] tabular-nums leading-tight">
            {count(total)}
          </span>
        </div>
      </div>

      {/* Legend with percentages */}
      <div className="w-full sm:flex-1 space-y-1.5">
        {parts.map((p) => {
          const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
          return (
            <div key={p.name} className="flex items-center justify-between gap-2 text-[12px] p-1 rounded-md hover:bg-[#F8FAFC]">
              <div className="flex items-center gap-2 truncate">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="font-semibold text-[#475569] truncate">{p.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <b className="text-[#1E293B] tabular-nums">{count(p.value)}</b>
                <span className="text-[11px] text-[#94A3B8] tabular-nums w-8 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 4. New Signups Grouped Bar Chart */
export function SignupsTrendChart({
  data,
  selectedDate,
  onSelectDate,
}: {
  data: { day: string; customers: number; partners: number }[];
  selectedDate?: string;
  onSelectDate?: (day: string) => void;
}) {
  const formattedData = data.map((d) => ({
    ...d,
    shortDay: d.day.slice(5),
  }));

  return (
    <div className="h-[220px] w-full font-manrope">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          onClick={(state: any) => {
            if (state && state.activePayload && state.activePayload.length) {
              const clicked = state.activePayload[0].payload as { day: string };
              if (clicked && onSelectDate) onSelectDate(clicked.day);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="shortDay"
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={<GlassTooltip label="Registrations on date" />}
            cursor={{ fill: '#F8FAFC', opacity: 0.8 }}
          />
          <Bar dataKey="customers" name="Customers" fill="#635BFF" radius={[3, 3, 0, 0]} />
          <Bar dataKey="partners" name="Partners (Shops/Barbers)" fill="#F59E0B" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 5. Sleek Horizontal Ranking Bars */
export function RankingHorizontalChart({
  items,
  color = '#635BFF',
  formatValue = (v: number) => count(v),
}: {
  items: { name: string; value: number; href?: string }[];
  color?: string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));

  if (!items.length) {
    return <p className="py-8 text-center text-[12px] text-[#94A3B8]">No data recorded yet.</p>;
  }

  return (
    <div className="space-y-2.5 font-manrope">
      {items.map((item, idx) => {
        const pct = Math.max(4, Math.round((item.value / max) * 100));
        return (
          <div key={`${idx}-${item.name}`} className="space-y-1">
            <div className="flex items-center justify-between text-[12px]">
              {item.href ? (
                <a href={item.href} className="font-semibold text-[#1E293B] hover:text-[#635BFF] truncate max-w-[220px]">
                  {item.name}
                </a>
              ) : (
                <span className="font-semibold text-[#1E293B] truncate max-w-[220px]">{item.name}</span>
              )}
              <span className="font-bold text-[#1E293B] tabular-nums">{formatValue(item.value)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
