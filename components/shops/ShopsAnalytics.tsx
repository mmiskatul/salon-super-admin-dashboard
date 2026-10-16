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
  Store,
  DollarSign,
  Calendar,
  Users,
  Sparkles,
  Scissors,
  Star,
  Activity,
  Award,
} from 'lucide-react';
import type { Tenant } from '@/lib/api/tenants';
import type { TenantVitals } from '@/lib/api/platform';
import { vitalityOf } from '@/lib/api/platform';
import { count, money, brandColor } from '@/lib/format';
import { Badge } from '@/components/ui/primitives';

const COLORS = {
  primary: '#635BFF',
  primaryLight: '#818CF8',
  live: '#10B981',
  info: '#0EA5E9',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
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
  const headerText = itemPayload?.shopName || label || itemPayload?.name;

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white/95 p-3.5 shadow-xl backdrop-blur-md font-manrope text-[12px] min-w-[210px] z-50">
      {headerText && (
        <div className="font-bold text-[#1E293B] border-b border-[#F1F5F9] pb-1.5 mb-2.5">
          <p className="text-[13px] text-[#1E293B] font-extrabold truncate">{headerText}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-semibold text-[#64748B]">
              {itemPayload?.businessType || 'Salon'}
            </span>
            {itemPayload?.isOwnerStudio && (
              <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded">
                Owner Studio
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
        {itemPayload?.statusText && (
          <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px]">
            <span className="text-[#94A3B8]">Status</span>
            <span className="font-bold text-[#1E293B]">{itemPayload.statusText}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ShopsAnalytics({
  tenants,
  vitals,
  onSelectShop,
}: {
  tenants: Tenant[];
  vitals: Record<string, TenantVitals>;
  onSelectShop?: (tenantId: string) => void;
}) {
  const [metricKey, setMetricKey] = useState<'revenue' | 'appointments' | 'staff' | 'rating'>('revenue');

  // 1. Leaderboard Data for top 7 salons
  const leaderboardData = useMemo(() => {
    const list = tenants.map((t) => {
      const v = vitals[t.id];
      const rev = v?.revenue ?? 0;
      const appts = v?.appointments ?? 0;
      const staff = v?.staff ?? 0;
      const rNum = Number(t.ratingAvg) || 0;

      let metricVal = 0;
      if (metricKey === 'revenue') metricVal = rev;
      else if (metricKey === 'appointments') metricVal = appts;
      else if (metricKey === 'staff') metricVal = staff;
      else metricVal = rNum;

      const shortName = t.name.length > 15 ? t.name.slice(0, 13) + '...' : t.name;

      let statusText = 'Taking bookings';
      const vitality = vitalityOf(v);
      if (t.isSuspended) statusText = 'Suspended';
      else if (!t.isListed) statusText = 'Hidden from customers';
      else if (vitality === 'idle') statusText = 'No bookings yet';
      else if (vitality === 'dormant') statusText = 'Never set up';

      return {
        tenantId: t.id,
        shopName: t.name,
        shortName,
        businessType: t.businessType,
        isOwnerStudio: !!t.isOwnerStudio,
        brandColor: brandColor(t.brandColor),
        revenue: rev,
        appointments: appts,
        staff,
        rating: rNum,
        statusText,
        value: metricVal,
      };
    });

    list.sort((a, b) => b.value - a.value);
    return list.slice(0, 7);
  }, [tenants, vitals, metricKey]);

  // 2. Vitality & Operational State Donut Data
  const vitalityPieData = useMemo(() => {
    let live = 0;
    let idle = 0;
    let dormant = 0;
    let hidden = 0;

    for (const t of tenants) {
      if (t.isSuspended || !t.isListed) {
        hidden++;
        continue;
      }
      const v = vitals[t.id];
      const vit = vitalityOf(v);
      if (vit === 'live') live++;
      else if (vit === 'idle') idle++;
      else dormant++;
    }

    return [
      { name: 'Taking Bookings', count: live, color: COLORS.live },
      { name: 'Idle / No Bookings', count: idle, color: COLORS.warning },
      { name: 'Never Set Up', count: dormant, color: COLORS.slateMuted },
      { name: 'Hidden / Suspended', count: hidden, color: COLORS.danger },
    ].filter((d) => d.count > 0);
  }, [tenants, vitals]);

  // 3. Business Type Distribution
  const businessTypeData = useMemo(() => {
    const typeMap = new Map<string, number>();
    for (const t of tenants) {
      const type = t.businessType || 'Barbershop';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    }

    const arr = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
    }));
    arr.sort((a, b) => b.count - a.count);
    return arr.slice(0, 5);
  }, [tenants]);

  const totalShops = tenants.length;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 font-manrope">
      {/* 1. Salon Leaderboard (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635BFF]/10 text-[#635BFF]">
                  <Store size={15} />
                </span>
                <h3 className="text-base font-extrabold text-[#1E293B]">Salon Performance Leaderboard</h3>
              </div>
              <p className="text-xs font-medium text-[#64748B] mt-1">
                Top commercial studios ranked by historical activity and traction
              </p>
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] gap-1 self-start sm:self-auto">
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
                onClick={() => setMetricKey('staff')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  metricKey === 'staff'
                    ? 'bg-[#635BFF] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Staff
              </button>
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
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-[240px] w-full pt-4">
            {leaderboardData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#94A3B8]">
                No salon records available
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
                          return `${count(val)} team barbers`;
                        }}
                      />
                    }
                  />
                  <Bar
                    dataKey="value"
                    name={
                      metricKey === 'revenue'
                        ? 'Total Revenue'
                        : metricKey === 'rating'
                        ? 'Rating Score'
                        : metricKey === 'appointments'
                        ? 'Total Bookings'
                        : 'Staff Members'
                    }
                    fill={metricKey === 'revenue' ? COLORS.primary : COLORS.info}
                    radius={[6, 6, 0, 0]}
                    cursor="pointer"
                    onClick={(entry: any) => onSelectShop && onSelectShop(entry?.tenantId || entry?.payload?.tenantId)}
                  >
                    {leaderboardData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.brandColor ||
                          (metricKey === 'revenue'
                            ? index === 0
                              ? COLORS.primary
                              : COLORS.primaryLight
                            : COLORS.info)
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#64748B]">
          <span className="flex items-center gap-1.5 font-semibold text-[#1E293B]">
            <Sparkles size={12} className="text-[#635BFF]" />
            Showing top {leaderboardData.length} studios by {metricKey}
          </span>
          <span className="text-[#94A3B8]">Click any bar to filter or inspect details</span>
        </div>
      </div>

      {/* 2. Operational Vitality & Business Categories (5 Cols) */}
      <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
        {/* Vitality Mix Donut */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Activity size={13} />
              </span>
              <h4 className="text-sm font-extrabold text-[#1E293B]">Operational Vitality</h4>
            </div>
            <Badge tone="live">{count(totalShops)} Shops</Badge>
          </div>

          <div className="grid grid-cols-12 items-center py-2">
            <div className="col-span-6 h-[120px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vitalityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={54}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {vitalityPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<GlassTooltip formatValue={(v) => `${count(v)} salons`} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-extrabold text-[#1E293B] tabular-nums">{count(totalShops)}</span>
                <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">Salons</span>
              </div>
            </div>

            <div className="col-span-6 space-y-2 pl-2">
              {vitalityPieData.map((entry) => {
                const percent = totalShops > 0 ? Math.round((entry.count / totalShops) * 100) : 0;
                return (
                  <div key={entry.name} className="flex flex-col">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 font-semibold text-[#64748B] truncate">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        {entry.name}
                      </span>
                      <span className="font-extrabold text-[#1E293B] tabular-nums">{percent}%</span>
                    </div>
                    <span className="text-[10px] text-[#94A3B8] pl-3.5">{count(entry.count)} salons</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Business Type Distribution */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Scissors size={13} />
              </span>
              <h4 className="text-sm font-extrabold text-[#1E293B]">Business Categories</h4>
            </div>
            <span className="text-[11px] font-bold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
              {businessTypeData.length} Types
            </span>
          </div>

          <div className="space-y-1.5 py-2">
            {businessTypeData.map((item) => {
              const pct = totalShops > 0 ? Math.round((item.count / totalShops) * 100) : 0;
              return (
                <div key={item.type} className="flex items-center justify-between text-[11px] gap-2">
                  <span className="font-semibold text-[#475569] shrink-0 w-28 truncate">{item.type}</span>
                  <div className="flex-1 bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#635BFF] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-extrabold text-[#1E293B] tabular-nums shrink-0 w-12 text-right">
                    {item.count} <span className="text-[#94A3B8] font-normal text-[10px]">({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[10px] text-[#94A3B8]">
            <span>Commercial classification</span>
            <span className="font-semibold text-[#635BFF]">
              {businessTypeData[0]?.type || 'Barbershop'} Lead ({businessTypeData[0]?.count || 0})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
