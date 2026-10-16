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
  Scissors,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Layers,
} from 'lucide-react';
import type { OwnerDashboardSummary } from '@/lib/api/owners';
import { count, money } from '@/lib/format';
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
  const headerText = itemPayload?.tenantName || label || itemPayload?.name;

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white/95 p-3.5 shadow-xl backdrop-blur-md font-manrope text-[12px] min-w-[200px] z-50">
      {headerText && (
        <div className="font-bold text-[#1E293B] border-b border-[#F1F5F9] pb-1.5 mb-2.5">
          <p className="text-[13px] text-[#1E293B] font-extrabold truncate">{headerText}</p>
          {itemPayload?.ownerName && (
            <p className="text-[11px] font-medium text-[#64748B]">Owner: {itemPayload.ownerName}</p>
          )}
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

export function OwnerDashboardsAnalytics({
  dashboards,
  onSelectSalon,
}: {
  dashboards: OwnerDashboardSummary[];
  onSelectSalon?: (tenantId: string) => void;
}) {
  const [metricKey, setMetricKey] = useState<'revenue' | 'appointments' | 'barbers' | 'clients'>('revenue');

  // 1. Leaderboard Data for top 7 salons
  const leaderboardData = useMemo(() => {
    const sorted = [...dashboards].sort((a, b) => {
      if (metricKey === 'revenue') return b.revenueTotal - a.revenueTotal;
      if (metricKey === 'appointments') return b.appointmentsCount - a.appointmentsCount;
      if (metricKey === 'barbers') return b.barbersCount - a.barbersCount;
      return b.clientsCount - a.clientsCount;
    });

    return sorted.slice(0, 7).map((d) => {
      const shortName = d.tenantName.length > 16 ? d.tenantName.slice(0, 14) + '...' : d.tenantName;
      let statusText = 'Active & Listed';
      if (d.isSuspended) statusText = 'Suspended';
      else if (d.isBanned) statusText = 'Owner Banned';
      else if (!d.isListed) statusText = 'Unlisted';

      return {
        tenantId: d.tenantId,
        tenantName: d.tenantName,
        shortName,
        ownerName: d.ownerName,
        revenue: d.revenueTotal,
        appointments: d.appointmentsCount,
        barbers: d.barbersCount,
        clients: d.clientsCount,
        statusText,
        value:
          metricKey === 'revenue'
            ? d.revenueTotal
            : metricKey === 'appointments'
            ? d.appointmentsCount
            : metricKey === 'barbers'
            ? d.barbersCount
            : d.clientsCount,
      };
    });
  }, [dashboards, metricKey]);

  // 2. Operational Health & Listing Status
  const statusPieData = useMemo(() => {
    let activeListed = 0;
    let unlisted = 0;
    let suspended = 0;
    let banned = 0;

    for (const d of dashboards) {
      if (d.isBanned) banned++;
      else if (d.isSuspended) suspended++;
      else if (!d.isListed) unlisted++;
      else activeListed++;
    }

    return [
      { name: 'Active & Listed', value: activeListed, color: COLORS.live },
      { name: 'Unlisted / Setup', value: unlisted, color: COLORS.info },
      { name: 'Suspended', value: suspended, color: COLORS.warning },
      { name: 'Owner Banned', value: banned, color: COLORS.danger },
    ].filter((s) => s.value > 0);
  }, [dashboards]);

  // 3. Shop Scale Tiers (Solo, Boutique, Mid-Size, Flagship)
  const scaleTierData = useMemo(() => {
    let solo = 0; // 0-1 barbers
    let boutique = 0; // 2-3 barbers
    let midSize = 0; // 4-6 barbers
    let flagship = 0; // 7+ barbers

    for (const d of dashboards) {
      if (d.barbersCount <= 1) solo++;
      else if (d.barbersCount <= 3) boutique++;
      else if (d.barbersCount <= 6) midSize++;
      else flagship++;
    }

    return [
      { name: 'Studio (1 staff)', count: solo, color: '#635BFF' },
      { name: 'Boutique (2-3 staff)', count: boutique, color: '#0EA5E9' },
      { name: 'Mid-size (4-6 staff)', count: midSize, color: '#10B981' },
      { name: 'Flagship (7+ staff)', count: flagship, color: '#F59E0B' },
    ];
  }, [dashboards]);

  const metricLabel =
    metricKey === 'revenue'
      ? 'Gross Turnover'
      : metricKey === 'appointments'
      ? 'Total Bookings'
      : metricKey === 'barbers'
      ? 'Barbers Roster'
      : 'Client Base';

  return (
    <div className="grid gap-5 lg:grid-cols-12 font-manrope">
      {/* Left 8 Cols: Top Owner Dashboards Leaderboard */}
      <div className="lg:col-span-8 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-extrabold text-[#1E293B] tracking-tight">
                  Salon Performance & Capacity Leaderboard
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-extrabold text-[#6D28D9]">
                  <Sparkles className="h-2.5 w-2.5" /> Recharts
                </span>
              </div>
              <p className="text-[12px] font-medium text-[#64748B] mt-0.5">
                Top salon owner dashboards ranked by {metricLabel.toLowerCase()}
              </p>
            </div>

            {/* Metric Toggle */}
            <div className="inline-flex items-center rounded-xl bg-[#F8FAFC] p-1 border border-[#E2E8F0] text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setMetricKey('revenue')}
                className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                  metricKey === 'revenue'
                    ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Revenue
              </button>
              <button
                type="button"
                onClick={() => setMetricKey('appointments')}
                className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                  metricKey === 'appointments'
                    ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Bookings
              </button>
              <button
                type="button"
                onClick={() => setMetricKey('barbers')}
                className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                  metricKey === 'barbers'
                    ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Team Size
              </button>
              <button
                type="button"
                onClick={() => setMetricKey('clients')}
                className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                  metricKey === 'clients'
                    ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Clients
              </button>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={leaderboardData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length) {
                    const clicked = state.activePayload[0].payload;
                    if (clicked?.tenantId && onSelectSalon) {
                      onSelectSalon(clicked.tenantId);
                    }
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="shortName"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (metricKey === 'revenue' ? money(val) : count(val))}
                />
                <Tooltip
                  content={
                    <GlassTooltip
                      formatValue={(val) => (metricKey === 'revenue' ? money(val) : `${count(val)} ${metricKey}`)}
                    />
                  }
                />
                <Bar
                  dataKey="value"
                  name={metricLabel}
                  fill={metricKey === 'revenue' ? COLORS.live : COLORS.primary}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={42}
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="mt-3 text-[11px] font-semibold text-[#94A3B8] border-t border-[#F1F5F9] pt-2.5 flex items-center justify-between">
          <span>Tip: Click on any salon bar to filter or inspect its complete owner dashboard.</span>
          <span className="text-[#635BFF] font-bold">Showing Top {leaderboardData.length} of {dashboards.length} Salons</span>
        </p>
      </div>

      {/* Right 4 Cols: Operational Status Donut & Team Scale Distribution */}
      <div className="lg:col-span-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4 mb-4">
            <div>
              <h3 className="text-[15px] font-extrabold text-[#1E293B] tracking-tight">
                Operational Status Mix
              </h3>
              <p className="text-[12px] font-medium text-[#64748B] mt-0.5">
                Marketplace health across all {dashboards.length} salons
              </p>
            </div>
            <Badge tone="primary">{dashboards.length} Shops</Badge>
          </div>

          {/* Donut Chart */}
          <div className="relative h-[160px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<GlassTooltip formatValue={(v) => `${count(v)} salons`} />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[18px] font-black text-[#1E293B] tabular-nums">{dashboards.length}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]">Salons</span>
            </div>
          </div>

          {/* Legend list */}
          <div className="grid grid-cols-2 gap-2 mt-3 text-[12px]">
            {statusPieData.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-lg bg-[#F8FAFC] p-2 border border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-[#64748B] font-semibold text-[11px] truncate">{s.name}</span>
                </div>
                <span className="font-extrabold text-[#1E293B] tabular-nums text-[12px]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team Scale Tiers */}
        <div className="mt-4 pt-3 border-t border-[#F1F5F9]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2 flex items-center gap-1">
            <Scissors className="h-3 w-3 text-[#635BFF]" /> Team Size Scale Distribution
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {scaleTierData.map((tier) => (
              <div key={tier.name} className="flex items-center justify-between text-[#64748B]">
                <span className="truncate">{tier.name}</span>
                <span className="font-bold text-[#1E293B] tabular-nums">{tier.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
