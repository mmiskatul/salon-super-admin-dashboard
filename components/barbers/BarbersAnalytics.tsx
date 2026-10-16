'use client';

import React, { useState, useMemo } from 'react';
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
} from 'recharts';
import {
  Scissors,
  Store,
  Star,
  DollarSign,
  Calendar,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Layers,
  Award,
  Clock,
} from 'lucide-react';
import type { BarberSummary } from '@/lib/api/barbers';
import { count, money, rating } from '@/lib/format';
import { Badge } from '@/components/ui/primitives';

const COLORS = {
  primary: '#635BFF',
  primaryLight: '#818CF8',
  live: '#10B981',
  info: '#0EA5E9',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  amber: '#F59E0B',
  slateDark: '#1E293B',
  slateMuted: '#64748B',
  slateLight: '#94A3B8',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatValue?: (val: number) => string;
}

function GlassTooltip({ active, payload, label, formatValue }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const itemPayload = payload[0]?.payload;
  const headerText = itemPayload?.barberName || label || itemPayload?.name;

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white/95 p-3.5 shadow-xl backdrop-blur-md font-manrope text-[12px] min-w-[210px] z-50">
      {headerText && (
        <div className="font-bold text-[#1E293B] border-b border-[#F1F5F9] pb-1.5 mb-2.5">
          <p className="text-[13px] text-[#1E293B] font-extrabold truncate">{headerText}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {itemPayload?.isSolo ? (
              <span className="inline-flex items-center text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                Independent Solo
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[160px]">
                {itemPayload?.tenantName || 'Shop-Linked'}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-[#64748B] font-semibold">{entry.name}</span>
            </div>
            <span className="font-extrabold text-[#1E293B] tabular-nums">
              {formatValue ? formatValue(entry.value) : entry.value}
            </span>
          </div>
        ))}
        {itemPayload?.ratingAvg !== undefined && Number(itemPayload.ratingAvg) > 0 && (
          <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px]">
            <span className="text-[#94A3B8]">Rating</span>
            <span className="font-bold text-amber-500 flex items-center gap-1">
              ★ {Number(itemPayload.ratingAvg).toFixed(1)}
              {itemPayload.ratingCount ? ` (${itemPayload.ratingCount})` : ''}
            </span>
          </div>
        )}
        {itemPayload?.statusText && (
          <div className="pt-1.5 border-t border-[#F1F5F9] flex items-center justify-between text-[11px]">
            <span className="text-[#94A3B8]">Status</span>
            <span className="font-bold text-[#1E293B]">{itemPayload.statusText}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function BarbersAnalytics({
  barbers,
  onSelectBarber,
}: {
  barbers: BarberSummary[];
  onSelectBarber?: (barberId: string) => void;
}) {
  const [metricKey, setMetricKey] = useState<'rating' | 'appointments' | 'revenue' | 'services'>('rating');

  // 1. Leaderboard Data for top 7 barbers
  const leaderboardData = useMemo(() => {
    const sorted = [...barbers].sort((a, b) => {
      if (metricKey === 'rating') {
        const rB = Number(b.ratingAvg) || 0;
        const rA = Number(a.ratingAvg) || 0;
        if (rB !== rA) return rB - rA;
        return b.ratingCount - a.ratingCount;
      }
      if (metricKey === 'appointments') return (b.appointmentsCount || 0) - (a.appointmentsCount || 0);
      if (metricKey === 'revenue') return (b.totalRevenue || 0) - (a.totalRevenue || 0);
      return (b.servicesCount || 0) - (a.servicesCount || 0);
    });

    return sorted.slice(0, 7).map((b) => {
      const shortName = b.name.length > 15 ? b.name.slice(0, 13) + '...' : b.name;
      let statusText = 'Active';
      if (b.isBanned) statusText = 'Banned';

      let metricVal = 0;
      if (metricKey === 'rating') metricVal = Number(b.ratingAvg) || 0;
      else if (metricKey === 'appointments') metricVal = b.appointmentsCount || 0;
      else if (metricKey === 'revenue') metricVal = b.totalRevenue || 0;
      else metricVal = b.servicesCount || 0;

      return {
        barberId: b.id,
        barberName: b.name,
        shortName,
        isSolo: b.type === 'SOLO',
        tenantName: b.tenantName,
        ratingAvg: b.ratingAvg,
        ratingCount: b.ratingCount,
        appointments: b.appointmentsCount || 0,
        revenue: b.totalRevenue || 0,
        services: b.servicesCount || 0,
        statusText,
        value: metricVal,
      };
    });
  }, [barbers, metricKey]);

  // 2. Operational Model Mix: Shop-Linked vs Solo
  const affiliationPieData = useMemo(() => {
    let shopStaff = 0;
    let solo = 0;

    for (const b of barbers) {
      if (b.type === 'SOLO') solo++;
      else shopStaff++;
    }

    return [
      { name: 'Shop-Linked Stylists', count: shopStaff, color: COLORS.primary },
      { name: 'Independent Solo', count: solo, color: COLORS.purple },
    ].filter((d) => d.count > 0);
  }, [barbers]);

  // 3. Rating Tiers Distribution
  const ratingTierData = useMemo(() => {
    let elite = 0; // 5.0
    let high = 0; // 4.5 - 4.9
    let standard = 0; // 4.0 - 4.4
    let needsWork = 0; // < 4.0
    let unrated = 0;

    let totalRatingSum = 0;
    let ratedCount = 0;
    let totalReviews = 0;

    for (const b of barbers) {
      const r = Number(b.ratingAvg) || 0;
      totalReviews += b.ratingCount || 0;

      if (r === 0) {
        unrated++;
      } else {
        totalRatingSum += r;
        ratedCount++;
        if (r >= 5.0) elite++;
        else if (r >= 4.5) high++;
        else if (r >= 4.0) standard++;
        else needsWork++;
      }
    }

    const avgRating = ratedCount > 0 ? (totalRatingSum / ratedCount).toFixed(2) : '—';

    const tiers = [
      { tier: '5.0 ★ Elite', count: elite, color: '#10B981' },
      { tier: '4.5-4.9 ★ High', count: high, color: '#635BFF' },
      { tier: '4.0-4.4 ★ Solid', count: standard, color: '#0EA5E9' },
      { tier: '< 4.0 ★ Watch', count: needsWork, color: '#F59E0B' },
      { tier: 'Unrated / New', count: unrated, color: '#94A3B8' },
    ];

    return {
      tiers,
      avgRating,
      ratedCount,
      totalReviews,
    };
  }, [barbers]);

  const totalBarbers = barbers.length;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 font-manrope">
      {/* 1. Performance Leaderboard (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635BFF]/10 text-[#635BFF]">
                  <Scissors size={15} />
                </span>
                <h3 className="text-base font-extrabold text-[#1E293B]">Stylist Performance Leaderboard</h3>
              </div>
              <p className="text-xs font-medium text-[#64748B] mt-1">
                Top individual service providers ranked by key performance dimensions
              </p>
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] gap-1 self-start sm:self-auto">
              <button
                onClick={() => setMetricKey('rating')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  metricKey === 'rating'
                    ? 'bg-[#635BFF] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Rating (★)
              </button>
              <button
                onClick={() => setMetricKey('appointments')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  metricKey === 'appointments'
                    ? 'bg-[#635BFF] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Bookings
              </button>
              <button
                onClick={() => setMetricKey('revenue')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  metricKey === 'revenue'
                    ? 'bg-[#635BFF] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setMetricKey('services')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  metricKey === 'services'
                    ? 'bg-[#635BFF] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Services
              </button>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-[240px] w-full pt-4">
            {leaderboardData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#94A3B8]">
                No barber records available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaderboardData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="shortName"
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickFormatter={(val) => {
                      if (metricKey === 'revenue') return `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`;
                      if (metricKey === 'rating') return `${val}★`;
                      return String(val);
                    }}
                  />
                  <Tooltip
                    content={
                      <GlassTooltip
                        formatValue={(val) => {
                          if (metricKey === 'revenue') return money(val);
                          if (metricKey === 'rating') return `${Number(val).toFixed(1)} ★`;
                          if (metricKey === 'appointments') return `${count(val)} bookings`;
                          return `${count(val)} active services`;
                        }}
                      />
                    }
                  />
                  <Bar
                    dataKey="value"
                    name={
                      metricKey === 'revenue'
                        ? 'Estimated Revenue'
                        : metricKey === 'rating'
                        ? 'Rating Score'
                        : metricKey === 'appointments'
                        ? 'Completed Bookings'
                        : 'Active Services'
                    }
                    fill={metricKey === 'rating' ? '#F59E0B' : COLORS.primary}
                    radius={[6, 6, 0, 0]}
                    onClick={(entry: any) => onSelectBarber && onSelectBarber(entry?.barberId || entry?.payload?.barberId)}
                  >
                    {leaderboardData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          metricKey === 'rating'
                            ? index === 0
                              ? '#F59E0B'
                              : '#FBBF24'
                            : index === 0
                            ? COLORS.primary
                            : COLORS.primaryLight
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Legend / Quick Insight Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#64748B]">
          <span className="flex items-center gap-1.5 font-semibold text-[#1E293B]">
            <Sparkles size={12} className="text-[#635BFF]" />
            Showing top {leaderboardData.length} stylists by {metricKey}
          </span>
          <span className="text-[#94A3B8]">Click any bar to filter or inspect details</span>
        </div>
      </div>

      {/* 2. Affiliation Model Mix & Quality Tiers (5 Cols) */}
      <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
        {/* Affiliation Mix Donut */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Store size={13} />
              </span>
              <h4 className="text-sm font-extrabold text-[#1E293B]">Stylist Operating Model</h4>
            </div>
            <Badge tone="live">{count(totalBarbers)} Total</Badge>
          </div>

          <div className="grid grid-cols-12 items-center py-2">
            <div className="col-span-6 h-[120px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={affiliationPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={54}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {affiliationPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<GlassTooltip formatValue={(v) => `${count(v)} stylists`} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-extrabold text-[#1E293B] tabular-nums">{count(totalBarbers)}</span>
                <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">Stylists</span>
              </div>
            </div>

            <div className="col-span-6 space-y-2 pl-2">
              {affiliationPieData.map((entry) => {
                const percent = totalBarbers > 0 ? Math.round((entry.count / totalBarbers) * 100) : 0;
                return (
                  <div key={entry.name} className="flex flex-col">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 font-semibold text-[#64748B] truncate">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        {entry.name}
                      </span>
                      <span className="font-extrabold text-[#1E293B] tabular-nums">{percent}%</span>
                    </div>
                    <span className="text-[10px] text-[#94A3B8] pl-3.5">{count(entry.count)} stylists</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rating Excellence Tiers */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <Star size={13} className="fill-amber-400 text-amber-400" />
              </span>
              <h4 className="text-sm font-extrabold text-[#1E293B]">Quality & Rating Tiers</h4>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              ★ {ratingTierData.avgRating} Platform Avg
            </div>
          </div>

          <div className="space-y-1.5 py-2">
            {ratingTierData.tiers.map((t) => {
              const pct = totalBarbers > 0 ? Math.round((t.count / totalBarbers) * 100) : 0;
              return (
                <div key={t.tier} className="flex items-center justify-between text-[11px] gap-2">
                  <span className="font-semibold text-[#475569] shrink-0 w-24 truncate">{t.tier}</span>
                  <div className="flex-1 bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: t.color }}
                    />
                  </div>
                  <span className="font-extrabold text-[#1E293B] tabular-nums shrink-0 w-12 text-right">
                    {t.count} <span className="text-[#94A3B8] font-normal text-[10px]">({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[10px] text-[#94A3B8]">
            <span>{count(ratingTierData.totalReviews)} client reviews aggregated</span>
            <span className="font-semibold text-emerald-600">
              {Math.round(((ratingTierData.tiers[0].count + ratingTierData.tiers[1].count) / (totalBarbers || 1)) * 100)}% Top Rated
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
