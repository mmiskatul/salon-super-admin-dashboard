'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { count } from '@/lib/format';
import { ShieldCheck, UserCheck, Users, TrendingUp, Sparkles, AlertTriangle } from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  labelProp?: string;
  formatValue?: (val: number) => string;
}

function GlassTooltip({ active, payload, label, labelProp, formatValue }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const itemPayload = payload[0]?.payload as Record<string, unknown> | undefined;
  const headerText =
    (labelProp && itemPayload && String(itemPayload[labelProp])) ||
    label ||
    (itemPayload?.label ? String(itemPayload.label) : undefined) ||
    (itemPayload?.xLabel ? String(itemPayload.xLabel) : undefined);

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white/95 p-3.5 shadow-xl backdrop-blur-md font-manrope text-[12px] min-w-[180px] z-50">
      {headerText && (
        <p className="font-bold text-[#1E293B] border-b border-[#F1F5F9] pb-1.5 mb-2.5 flex items-center justify-between">
          <span>{headerText}</span>
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: entry.color }} />
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

export interface UserCompositionSegment {
  name: string;
  value: number;
  color: string;
  roleKey?: string;
}

export interface SignupTrendPoint {
  day?: string;
  label?: string;
  shortLabel?: string;
  customers: number;
  partners: number;
  total?: number;
}

interface UsersAnalyticsSuiteProps {
  totalUsers: number;
  segments: UserCompositionSegment[];
  signupPoints: SignupTrendPoint[];
  unverifiedCount: number;
  bannedCount: number;
  activeRoleFilter?: string;
  onSelectRole?: (role: string) => void;
}

export function UsersAnalyticsSuite({
  totalUsers,
  segments,
  signupPoints,
  unverifiedCount,
  bannedCount,
  activeRoleFilter,
  onSelectRole,
}: UsersAnalyticsSuiteProps) {
  const [activeTab, setActiveTab] = useState<'composition' | 'signups' | 'health'>('composition');
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const validSegments = segments.filter((s) => s.value > 0);
  const verifiedCount = Math.max(0, totalUsers - unverifiedCount - bannedCount);
  const verificationPct = totalUsers > 0 ? Math.round((verifiedCount / totalUsers) * 100) : 100;

  // Prepare signup trend data for Recharts
  const formattedSignups = (signupPoints || []).map((pt) => {
    const xLabel = pt.shortLabel ?? (pt.day ? pt.day.slice(5) : pt.label ?? '');
    const fullLabel = pt.label ?? (pt.day ? pt.day : pt.shortLabel ?? '');
    return {
      ...pt,
      xLabel,
      fullLabel,
      total: (pt.customers || 0) + (pt.partners || 0),
    };
  });

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs font-manrope transition-all">
      {/* Top Bar with Title and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#635BFF]/15 to-[#8B5CF6]/20 text-[#635BFF] border border-[#635BFF]/20 shadow-2xs">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-extrabold text-[#1E293B] tracking-tight">
                Account Demographics & Activity Pulse
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-extrabold text-[#6D28D9]">
                <Sparkles className="h-2.5 w-2.5" /> Live Insights
              </span>
            </div>
            <p className="text-[12px] font-medium text-[#64748B]">
              Real-time user segmentation across {count(totalUsers)} registered platform accounts
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex items-center rounded-xl bg-[#F8FAFC] p-1 border border-[#E2E8F0] text-[12px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('composition')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              activeTab === 'composition'
                ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Role Breakdown</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signups')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              activeTab === 'signups'
                ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Registration Trajectory</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              activeTab === 'health'
                ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Health & Security</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Composition (Interactive Donut + Legend) */}
      {activeTab === 'composition' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Donut Graphic */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative h-[220px] w-[220px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={
                      <GlassTooltip
                        formatValue={(v) =>
                          `${count(v)} accounts (${totalUsers > 0 ? Math.round((v / totalUsers) * 100) : 0}%)`
                        }
                      />
                    }
                  />
                  <Pie
                    data={validSegments.length ? validSegments : [{ name: 'None', value: 1, color: '#F1F5F9' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={95}
                    paddingAngle={validSegments.length > 1 ? 3 : 0}
                    dataKey="value"
                    stroke="none"
                    onMouseEnter={(entry) => setHoveredSegment(entry.name || null)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={(entry) => {
                      const payload = entry.payload as UserCompositionSegment | undefined;
                      if (payload?.roleKey && onSelectRole) {
                        onSelectRole(payload.roleKey);
                      }
                    }}
                  >
                    {(validSegments.length ? validSegments : [{ name: 'None', value: 1, color: '#F1F5F9' }]).map(
                      (entry, index) => {
                        const isHovered = hoveredSegment === entry.name;
                        const isFiltered = activeRoleFilter && entry.roleKey === activeRoleFilter;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            opacity={isHovered || isFiltered || !hoveredSegment ? 1 : 0.45}
                            stroke={isFiltered ? '#1E293B' : 'none'}
                            strokeWidth={isFiltered ? 2 : 0}
                            className="cursor-pointer transition-all duration-200"
                          />
                        );
                      }
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Centre Total Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                  Total Users
                </span>
                <span className="text-[26px] font-black text-[#1E293B] tabular-nums leading-tight">
                  {count(totalUsers)}
                </span>
                <span className="text-[11px] font-bold text-[#16A34A] flex items-center gap-0.5">
                  <ShieldCheck className="h-3 w-3" /> {verificationPct}% Verified
                </span>
              </div>
            </div>
            <p className="mt-1 text-[11px] font-semibold text-[#94A3B8] text-center">
              Click any wedge or category pill below to filter directory
            </p>
          </div>

          {/* Role Breakdown List */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#64748B] pb-1 border-b border-[#F1F5F9]">
              <span>Role Category</span>
              <div className="flex items-center gap-6">
                <span>Distribution</span>
                <span className="w-14 text-right">Headcount</span>
              </div>
            </div>

            {segments.map((seg) => {
              const pct = totalUsers > 0 ? Math.round((seg.value / totalUsers) * 100) : 0;
              const isSelected = activeRoleFilter && seg.roleKey === activeRoleFilter;

              return (
                <div
                  key={seg.name}
                  onClick={() => seg.roleKey && onSelectRole?.(seg.roleKey)}
                  onMouseEnter={() => setHoveredSegment(seg.name)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  className={`group flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#635BFF] bg-[#EEF2FF]/50 shadow-2xs'
                      : 'border-transparent bg-[#FAFBFD] hover:bg-white hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full shrink-0 shadow-2xs group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: seg.color }}
                    />
                    <div className="truncate">
                      <p className="text-[13px] font-bold text-[#1E293B] group-hover:text-[#635BFF] transition-colors">
                        {seg.name}
                      </p>
                      <p className="text-[11px] text-[#64748B] font-medium">
                        {pct}% of platform accounts
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:block w-32 h-2 rounded-full bg-[#E2E8F0]/70 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: seg.color }}
                      />
                    </div>
                    <div className="text-right">
                      <span className="block text-[14px] font-extrabold text-[#1E293B] tabular-nums">
                        {count(seg.value)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Signups Growth Trajectory */}
      {activeTab === 'signups' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
            <p className="font-semibold text-[#475569]">
              Daily sign-up velocity for customers vs platform partners (salon owners & stylists):
            </p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-bold text-[#635BFF]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#635BFF]" /> Customers
              </span>
              <span className="flex items-center gap-1.5 font-bold text-[#F59E0B]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" /> Partners (Owners/Barbers)
              </span>
            </div>
          </div>

          <div className="h-[220px] w-full font-manrope">
            {formattedSignups.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[12px] font-semibold text-[#94A3B8]">
                No registration records available for current timeframe.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={formattedSignups}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="custSignupGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#635BFF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#635BFF" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="partSignupGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="xLabel"
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
                  <Tooltip content={<GlassTooltip labelProp="fullLabel" />} />
                  <Area
                    type="monotone"
                    dataKey="customers"
                    name="Customer Signups"
                    stroke="#635BFF"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#custSignupGrad)"
                    activeDot={{ r: 5, fill: '#635BFF', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="partners"
                    name="Partner Signups"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#partSignupGrad)"
                    activeDot={{ r: 5, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Security & Verification Health */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Verified Metric */}
            <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-[#16A34A]">Verified Accounts</span>
                <ShieldCheck className="h-5 w-5 text-[#16A34A]" />
              </div>
              <p className="mt-2 text-2xl font-black text-[#15803D] tabular-nums">
                {count(verifiedCount)}
              </p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#DCFCE7] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#16A34A]"
                  style={{ width: `${verificationPct}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] font-semibold text-[#16A34A]">
                {verificationPct}% of all platform users
              </p>
            </div>

            {/* Unverified Metric */}
            <div className="rounded-xl border border-[#FDE68A] bg-[#FEF3C7]/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-[#B45309]">Unverified Emails</span>
                <AlertTriangle className="h-5 w-5 text-[#B45309]" />
              </div>
              <p className="mt-2 text-2xl font-black text-[#B45309] tabular-nums">
                {count(unverifiedCount)}
              </p>
              <p className="mt-3 text-[11px] font-semibold text-[#64748B]">
                Pending email address confirmation via OTP
              </p>
            </div>

            {/* Banned Metric */}
            <div className="rounded-xl border border-[#FECDD3] bg-[#FFF1F2] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-[#E11D48]">Banned / Suspended</span>
                <AlertTriangle className="h-5 w-5 text-[#E11D48]" />
              </div>
              <p className="mt-2 text-2xl font-black text-[#BE123C] tabular-nums">
                {count(bannedCount)}
              </p>
              <p className="mt-3 text-[11px] font-semibold text-[#64748B]">
                Access revoked due to policy or security violations
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
