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
  CheckCircle2,
  AlertTriangle,
  Clock,
  Scissors,
  Store,
  Layers,
  Sparkles,
  TrendingUp,
  XCircle,
  Hourglass,
  Calendar,
  AlertOctagon,
} from 'lucide-react';
import type { BookingQuality } from '@/lib/api/insights';
import { duration, percent } from '@/components/insights/Bits';
import { placeHref } from '@/lib/placeHref';

const COLORS = {
  completed: '#10B981',    // Emerald
  waiting: '#635BFF',      // Indigo
  accepted: '#0EA5E9',     // Sky
  custCancel: '#F59E0B',   // Amber
  shopCancel: '#FB7185',   // Rose
  expired: '#94A3B8',      // Slate
  noShow: '#EF4444',       // Red
  primary: '#635BFF',
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

export function BookingQualityAnalytics({
  data,
  onSelectPlace,
}: {
  data: BookingQuality;
  onSelectPlace?: (placeKey: string) => void;
}) {
  const { funnel, acceptance, cancellations, sessions } = data;

  // 1. Funnel Stages Breakdown
  const funnelData = useMemo(() => {
    return [
      {
        stage: 'Requested',
        count: funnel.requested,
        fill: '#635BFF',
        subLabel: 'Total app booking requests created',
      },
      {
        stage: 'Accepted',
        count: funnel.accepted,
        fill: '#0EA5E9',
        subLabel: `${funnel.acceptRate ?? 0}% accepted by venue`,
      },
      {
        stage: 'Completed',
        count: funnel.completed,
        fill: '#10B981',
        subLabel: `${funnel.completionRate ?? 0}% of accepted successfully serviced`,
      },
      {
        stage: 'Cancelled',
        count: funnel.cancelledByCustomer + funnel.cancelledByShop,
        fill: '#F59E0B',
        subLabel: `${funnel.cancelledByCustomer} by customer · ${funnel.cancelledByShop} by shop`,
      },
      {
        stage: 'No-Show',
        count: funnel.noShow,
        fill: '#EF4444',
        subLabel: 'Customer missed appointment',
      },
      {
        stage: 'Expired',
        count: funnel.expiredUnaccepted,
        fill: '#94A3B8',
        subLabel: 'Venue never responded before time',
      },
    ];
  }, [funnel]);

  // 2. Cancellation Responsibility Donut
  const cancellationDonutData = useMemo(() => {
    const total = funnel.requested || 1;
    const items = [
      { name: 'Completed Serviced', value: funnel.completed, color: COLORS.completed },
      { name: 'Customer Cancelled', value: funnel.cancelledByCustomer, color: COLORS.custCancel },
      { name: 'Shop Cancelled / Declined', value: funnel.cancelledByShop, color: COLORS.shopCancel },
      { name: 'No-Show (Missed)', value: funnel.noShow, color: COLORS.noShow },
      { name: 'Expired Unaccepted', value: funnel.expiredUnaccepted, color: COLORS.expired },
      { name: 'Waiting to Accept', value: funnel.stillWaiting, color: COLORS.waiting },
    ].filter((item) => item.value > 0);

    return items.map((i) => ({
      ...i,
      share: Math.round((i.value / total) * 100),
    }));
  }, [funnel]);

  // 3. Slowest Venues to Accept Bar Chart
  const slowestVenuesData = useMemo(() => {
    return (acceptance.slowest || []).slice(0, 6).map((s) => ({
      key: s.key,
      name: s.name,
      shortName: s.name.length > 15 ? s.name.slice(0, 13) + '…' : s.name,
      minutes: s.medianMinutes ?? 0,
      bookings: s.bookings,
      subLabel: `${s.bookings} total requests serviced`,
    }));
  }, [acceptance]);

  // 4. Session Punctuality Comparison
  const punctualityData = useMemo(() => {
    const started = sessions.started || 1;
    const onTimeCount = Math.round((started * (sessions.onTime ?? 0)) / 100);
    const earlyCount = sessions.startedEarly || 0;
    const delayedCount = Math.max(0, started - onTimeCount - earlyCount);

    return [
      { name: 'Started On Time', value: onTimeCount, color: '#10B981' },
      { name: 'Started Early', value: earlyCount, color: '#0EA5E9' },
      { name: 'Delayed Start', value: delayedCount, color: '#F59E0B' },
    ];
  }, [sessions]);

  return (
    <div className="space-y-6 font-manrope">
      {/* 2-Column Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Funnel Lifecycle BarChart */}
        <div className="lg:col-span-7 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-[#635BFF]">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1E293B]">
                  Booking Request Lifecycle & Outcomes
                </h3>
              </div>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                Conversion flow from client request to chair completion vs friction points
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {percent(funnel.acceptRate)} Acceptance
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                {percent(funnel.completionRate)} Completion
              </span>
            </div>
          </div>

          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="stage"
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
                      formatValue={(val) => `${val} requests`}
                    />
                  }
                />
                <Bar
                  dataKey="count"
                  name="Requests"
                  radius={[6, 6, 0, 0]}
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#F1F5F9] mt-3">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-[10px] text-[#94A3B8] font-bold uppercase">Requested</p>
              <p className="text-[14px] font-extrabold text-[#1E293B] tabular-nums mt-0.5">
                {funnel.requested}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-[10px] text-[#94A3B8] font-bold uppercase">Completed</p>
              <p className="text-[14px] font-extrabold text-[#10B981] tabular-nums mt-0.5">
                {funnel.completed}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-[10px] text-[#94A3B8] font-bold uppercase">Total Dropoffs</p>
              <p className="text-[14px] font-extrabold text-[#EF4444] tabular-nums mt-0.5">
                {funnel.cancelledByCustomer + funnel.cancelledByShop + funnel.noShow}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-[10px] text-[#94A3B8] font-bold uppercase">Unaccepted Expired</p>
              <p className="text-[14px] font-extrabold text-[#64748B] tabular-nums mt-0.5">
                {funnel.expiredUnaccepted}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Outcomes Distribution Donut */}
        <div className="lg:col-span-5 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1E293B]">
                  Outcomes Share Distribution
                </h3>
              </div>
              <span className="text-[12px] font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                {funnel.requested} Total
              </span>
            </div>

            <div className="h-[170px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cancellationDonutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {cancellationDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <GlassTooltip
                        formatValue={(val) => `${val} bookings`}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="space-y-1.5 mt-2">
              {cancellationDonutData.map((item) => (
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

          {/* Response Benchmark Widget */}
          <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-50">
            <span className="font-bold text-[#475569]">Fast Acceptance (&le; 15 min):</span>
            <span className="font-extrabold text-emerald-600">
              {percent(acceptance.within15min)} of requests
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Slowest Responders & Session Punctuality */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Slowest Venues to Accept Requests */}
        <div className="lg:col-span-6 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="text-[15px] font-bold text-[#1E293B]">
                Slowest Venues to Accept (Response Latency)
              </h3>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Median Minutes
            </span>
          </div>

          {slowestVenuesData.length === 0 ? (
            <div className="py-12 text-center text-[12px] text-[#94A3B8]">
              No response latency recorded yet.
            </div>
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={slowestVenuesData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  onClick={(entry: any) => {
                    const placeKey = entry?.activePayload?.[0]?.payload?.key;
                    if (placeKey && onSelectPlace) onSelectPlace(placeKey);
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
                    dataKey="shortName"
                    type="category"
                    stroke="#475569"
                    fontSize={11}
                    fontWeight={700}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                    width={95}
                  />
                  <Tooltip
                    content={
                      <GlassTooltip
                        formatValue={(val) => `${val} min median`}
                      />
                    }
                  />
                  <Bar
                    dataKey="minutes"
                    name="Median Response (min)"
                    fill="#F59E0B"
                    radius={[0, 4, 4, 0]}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Session Timing & In-Chair Punctuality */}
        <div className="lg:col-span-6 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                  <Scissors className="h-4 w-4" />
                </div>
                <h3 className="text-[15px] font-bold text-[#1E293B]">
                  In-Chair Service Punctuality & Overruns
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {percent(sessions.onTime)} Started On-Time
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-[#64748B] font-bold">Start vs Scheduled</p>
                <p className="text-[16px] font-extrabold text-[#1E293B] tabular-nums mt-1">
                  {duration(sessions.medianLateMinutes)}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">
                  {sessions.startedEarly} started early of {sessions.started} sessions
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-[#64748B] font-bold">Finished Service Overrun</p>
                <p className="text-[16px] font-extrabold text-[#1E293B] tabular-nums mt-1">
                  {duration(sessions.medianOverrunMinutes)}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">
                  {sessions.finished} completed chair sessions
                </p>
              </div>
            </div>

            {/* Overrun Warning Pill */}
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-rose-500 shrink-0" />
                <span className="font-bold text-rose-900">
                  Ran 15+ Minutes Past Booked End Time:
                </span>
              </div>
              <span className="font-extrabold text-rose-700 tabular-nums text-[13px]">
                {sessions.overranBy15} sessions
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Customer Late Cancellation Strikes Limit:</span>
            <span className="font-extrabold text-[#1E293B]">
              {cancellations.strikeLimit} strikes in {cancellations.strikeWindowDays} days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
