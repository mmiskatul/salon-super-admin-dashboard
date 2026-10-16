'use client';

import React, { useMemo } from 'react';
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
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Camera,
  Scissors,
  Store,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import type { Readiness, ReadinessRow, ListingStep } from '@/lib/api/insights';
import { STEP_LABELS } from '@/lib/api/insights';

const COLORS = {
  ready: '#10B981',      // Emerald
  primary: '#635BFF',    // Indigo
  amber: '#F59E0B',      // Amber
  rose: '#EF4444',       // Rose
  slateDark: '#1E293B',
  slateMuted: '#64748B',
  slateLight: '#94A3B8',
  bgLight: '#F8FAFC',
};

const STEP_ICONS: Record<ListingStep, React.ComponentType<{ className?: string }>> = {
  service: Scissors,
  hours: Clock,
  location: MapPin,
  photos: Camera,
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
        {item?.note && (
          <div className="pt-1.5 border-t border-[#F1F5F9] text-[11px] text-[#64748B] font-medium">
            {item.note}
          </div>
        )}
      </div>
    </div>
  );
}

export function ReadinessAnalytics({
  readiness,
  onSelectStep,
  onSelectEntity,
}: {
  readiness: Readiness;
  onSelectStep?: (step: ListingStep) => void;
  onSelectEntity?: (id: string, kind: 'shop' | 'barber') => void;
}) {
  const { summary, rows } = readiness;

  // 1. Step Completion vs Missing Breakdown
  const stepFunnelData = useMemo(() => {
    const total = summary.total || 1;
    const steps: ListingStep[] = ['service', 'hours', 'location', 'photos'];

    return steps.map((stepKey) => {
      const missingCount = summary.missing[stepKey] || 0;
      const readyCount = Math.max(0, total - missingCount);
      const readyRate = Math.round((readyCount / total) * 100);

      return {
        key: stepKey,
        label: STEP_LABELS[stepKey],
        subLabel: `${readyRate}% of network complete`,
        ready: readyCount,
        missing: missingCount,
        readyRate,
        note: `${missingCount} venues still missing this requirement`,
      };
    });
  }, [summary]);

  // 2. Go-Live Score Distribution (Donut Chart)
  const completionDistribution = useMemo(() => {
    let complete4 = 0; // 100%
    let partial3 = 0;  // 75%
    let partial1to2 = 0; // 25-50%
    let unconfigured = 0; // 0%

    for (const r of rows) {
      const completedSteps = 4 - r.missing.length;
      if (completedSteps === 4) complete4++;
      else if (completedSteps === 3) partial3++;
      else if (completedSteps > 0) partial1to2++;
      else unconfigured++;
    }

    const total = rows.length || 1;

    return [
      {
        name: '100% Ready (Visible)',
        value: complete4,
        share: Math.round((complete4 / total) * 100),
        color: COLORS.ready,
        description: 'Meets all 4 customer listing criteria',
      },
      {
        name: '75% (1 Step Away)',
        value: partial3,
        share: Math.round((partial3 / total) * 100),
        color: COLORS.primary,
        description: 'Only 1 hurdle away from go-live',
      },
      {
        name: '25-50% Partial Setup',
        value: partial1to2,
        share: Math.round((partial1to2 / total) * 100),
        color: COLORS.amber,
        description: 'Started setup, missing multiple steps',
      },
      {
        name: '0% Unconfigured',
        value: unconfigured,
        share: Math.round((unconfigured / total) * 100),
        color: COLORS.rose,
        description: 'Registered but zero steps completed',
      },
    ].filter((d) => d.value > 0);
  }, [rows]);

  // 3. Top 6 Bookable Places (Capacity: Booked vs Open Slots)
  const capacityLeaderboard = useMemo(() => {
    return [...rows]
      .sort((a, b) => b.openSlots7d + b.booked7d - (a.openSlots7d + a.booked7d))
      .slice(0, 6)
      .map((r) => ({
        id: r.id,
        kind: r.kind,
        name: r.name,
        shortName: r.name.length > 14 ? r.name.slice(0, 12) + '…' : r.name,
        open: r.openSlots7d,
        booked: r.booked7d,
        total: r.openSlots7d + r.booked7d,
        listed: r.listed,
        kindLabel: r.kind === 'shop' ? 'Shop' : 'Independent Barber',
      }));
  }, [rows]);

  // 4. Entity Kind Breakdown (Shops vs Independent Barbers)
  const entitySplit = useMemo(() => {
    const shops = rows.filter((r) => r.kind === 'shop');
    const barbers = rows.filter((r) => r.kind === 'barber');

    const shopListed = shops.filter((s) => s.listed).length;
    const barberListed = barbers.filter((b) => b.listed).length;

    return {
      shopsTotal: shops.length,
      shopsListed: shopListed,
      shopsRate: shops.length ? Math.round((shopListed / shops.length) * 100) : 0,
      barbersTotal: barbers.length,
      barbersListed: barberListed,
      barbersRate: barbers.length ? Math.round((barberListed / barbers.length) * 100) : 0,
    };
  }, [rows]);

  return (
    <div className="space-y-6 font-manrope">
      {/* 2-Column Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Missing Step Funnel & Bottlenecks */}
        <div className="lg:col-span-7 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-[#635BFF]">
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1E293B]">
                  Go-Live Checklist Bottlenecks
                </h3>
              </div>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                Completed vs. missing requirements across all {summary.total} venues (Click bar to filter)
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              4 Mandated Steps
            </span>
          </div>

          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stepFunnelData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                onClick={(entry: any) => {
                  const stepKey = entry?.activePayload?.[0]?.payload?.key;
                  if (stepKey && onSelectStep) onSelectStep(stepKey);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  stroke="#475569"
                  fontSize={12}
                  fontWeight={700}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  width={90}
                />
                <Tooltip
                  content={
                    <GlassTooltip
                      formatValue={(val) => `${val} venues`}
                    />
                  }
                />
                <Bar
                  dataKey="ready"
                  name="Completed & Ready"
                  stackId="a"
                  fill={COLORS.ready}
                  radius={[0, 0, 0, 0]}
                  className="cursor-pointer"
                />
                <Bar
                  dataKey="missing"
                  name="Missing Requirement"
                  stackId="a"
                  fill="#FECDD3"
                  radius={[0, 4, 4, 0]}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Step Indicators */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#F1F5F9]">
            {stepFunnelData.map((s) => {
              const Icon = STEP_ICONS[s.key as ListingStep];
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onSelectStep?.(s.key as ListingStep)}
                  className="flex items-center gap-2 p-2 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] hover:bg-indigo-50/60 hover:border-indigo-200 transition-colors text-left"
                >
                  <div className={`p-1.5 rounded-lg ${s.missing > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#1E293B] truncate">{s.label}</p>
                    <p className="text-[10px] text-[#64748B]">
                      {s.missing > 0 ? `${s.missing} missing` : 'All ready'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Go-Live Score Distribution Donut */}
        <div className="lg:col-span-5 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1E293B]">
                  Network Readiness Tiers
                </h3>
              </div>
              <span className="text-[12px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {summary.listed} / {summary.total} Live
              </span>
            </div>

            <div className="h-[170px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {completionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <GlassTooltip
                        formatValue={(val) => `${val} entities`}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="space-y-2 mt-2">
              {completionDistribution.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-[11px] p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
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

          {/* Quick Entity Type Comparison Mini-Widget */}
          <div className="mt-4 pt-3 border-t border-[#F1F5F9] grid grid-cols-2 gap-3 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-[#64748B] mb-0.5">
                <Store className="h-3 w-3 text-indigo-500" />
                <span className="font-bold">Salons & Studios</span>
              </div>
              <p className="text-[13px] font-extrabold text-[#1E293B]">
                {entitySplit.shopsListed} / {entitySplit.shopsTotal}
                <span className="ml-1 text-[11px] font-bold text-emerald-600">({entitySplit.shopsRate}%)</span>
              </p>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-[#64748B] mb-0.5">
                <Scissors className="h-3 w-3 text-sky-500" />
                <span className="font-bold">Independent Stylists</span>
              </div>
              <p className="text-[13px] font-extrabold text-[#1E293B]">
                {entitySplit.barbersListed} / {entitySplit.barbersTotal}
                <span className="ml-1 text-[11px] font-bold text-sky-600">({entitySplit.barbersRate}%)</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity & 7-Day Bookable Slots Leaderboard */}
      {capacityLeaderboard.length > 0 && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1E293B]">
                  Next 7 Days Bookable Capacity & Utilization
                </h3>
              </div>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                Top venues by available chairs and booked client slots for the upcoming week
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 font-bold text-[#1E293B]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#635BFF]" /> Open Slots ({summary.openSlots7d})
              </span>
              <span className="flex items-center gap-1.5 font-bold text-[#1E293B]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" /> Booked ({summary.booked7d})
              </span>
            </div>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={capacityLeaderboard}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                onClick={(entry: any) => {
                  const id = entry?.activePayload?.[0]?.payload?.id;
                  const kind = entry?.activePayload?.[0]?.payload?.kind;
                  if (id && onSelectEntity) onSelectEntity(id, kind);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="shortName"
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
                      formatValue={(val) => `${val} slots`}
                    />
                  }
                />
                <Bar
                  dataKey="open"
                  name="Available Open Slots"
                  stackId="cap"
                  fill="#635BFF"
                  radius={[0, 0, 0, 0]}
                  className="cursor-pointer"
                />
                <Bar
                  dataKey="booked"
                  name="Booked Appointments"
                  stackId="cap"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
