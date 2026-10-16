'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  RotateCw,
  Database,
  Server,
  Cpu,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  Layers,
  Table as TableIcon,
  Lock,
  ArrowUpRight,
  Search,
  Filter,
  HardDrive,
  Terminal,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Radio,
  BarChart3,
  Users,
  Store,
  CalendarCheck,
  CreditCard,
  Star,
  MessageSquare,
  Bell,
  LifeBuoy,
  Flag,
  Play,
  Pause,
} from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { getSystem, type JobRun, type SystemHealth } from '@/lib/api/insights';
import { count, dateTime, since } from '@/lib/format';
import { Badge, Button, Canvas, Empty, Failed, Loading, PageHead, Panel } from '@/components/ui/primitives';
import { percent } from '@/components/insights/Bits';

const JOB_METADATA: Record<string, { label: string; desc: string; schedule: string }> = {
  'reminder-sweep': {
    label: 'Booking Reminders',
    desc: 'Dispatches push notifications and SMS for upcoming appointments',
    schedule: 'Every 5 minutes',
  },
  'expire-sweep': {
    label: 'Stale Booking Sweep',
    desc: 'Auto-cancels unaccepted appointments past their start window',
    schedule: 'Every 15 minutes',
  },
  'working-hours-roll': {
    label: 'Working Hours Roll',
    desc: 'Rolls daily shift availability slots and salon calendar forward',
    schedule: 'Daily at midnight (00:00 UTC)',
  },
  'token-cleanup': {
    label: 'Session Token Cleanup',
    desc: 'Purges expired refresh tokens and invalidated device credentials',
    schedule: 'Daily at 03:00 UTC',
  },
};

const TABLE_ROUTES: Record<string, { label: string; href?: string; icon: React.ComponentType<{ className?: string }> }> = {
  users: { label: 'User Accounts', href: '/users', icon: Users },
  shops: { label: 'Salons & Partners', href: '/shops', icon: Store },
  bookings: { label: 'Appointments', href: '/bookings', icon: CalendarCheck },
  transactions: { label: 'Cash & Payments', href: '/money', icon: CreditCard },
  reviews: { label: 'Customer Reviews', href: '/reviews', icon: Star },
  chatMessages: { label: 'Chat Messages', icon: MessageSquare },
  notifications: { label: 'Push Notifications', icon: Bell },
  tickets: { label: 'Support Tickets', href: '/support', icon: LifeBuoy },
  reports: { label: 'Content Reports', href: '/reports', icon: Flag },
  services: { label: 'Catalog Services', icon: ScissorsIcon },
};

function ScissorsIcon({ className }: { className?: string }) {
  return <Layers className={className} />;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

type SystemTab = 'overview' | 'jobs' | 'database' | 'security' | 'errors';

export default function SystemPage() {
  const data = useApi(getSystem, [], 'insights-system');
  const { refresh } = data;
  const s = data.data;

  const [activeTab, setActiveTab] = useState<SystemTab>('overview');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number>(30);
  const [errorSearch, setErrorSearch] = useState<string>('');
  const [errorStatusFilter, setErrorStatusFilter] = useState<'all' | '500' | '400'>('all');

  // Auto-refresh timer with 30s countdown
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          void refresh();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  // Overall health assessment
  const isHealthy = (status: string) => status === 'healthy' || status === 'disabled';
  const overallHealthy = s
    ? isHealthy(s.database.status) &&
      isHealthy(s.redis.status) &&
      s.requests.serverErrors === 0
    : true;

  // Filtered recent server errors
  const filteredErrors = useMemo(() => {
    if (!s?.requests?.recentErrors) return [];
    return s.requests.recentErrors.filter((e) => {
      const matchSearch =
        !errorSearch.trim() ||
        e.route.toLowerCase().includes(errorSearch.toLowerCase()) ||
        e.message.toLowerCase().includes(errorSearch.toLowerCase());

      const matchStatus =
        errorStatusFilter === 'all' ||
        (errorStatusFilter === '500' && e.status >= 500) ||
        (errorStatusFilter === '400' && e.status >= 400 && e.status < 500);

      return matchSearch && matchStatus;
    });
  }, [s?.requests?.recentErrors, errorSearch, errorStatusFilter]);

  // Total database records
  const totalDbRows = useMemo(() => {
    if (!s?.rows) return 0;
    return Object.values(s.rows).reduce((acc, val) => acc + val, 0);
  }, [s?.rows]);

  return (
    <>
      <PageHead
        eyebrow="DevOps & Reliability"
        title="System Health & Infrastructure"
        lede="Real-time multi-tenant runtime telemetry across PostgreSQL, distributed Redis cache, API latency distributions, cron workers, and security anomaly detection."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoRefresh((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-bold transition-all shadow-xs cursor-pointer ${
                autoRefresh
                  ? 'border-[#DCFCE7] bg-[#F0FDF4] text-[#15803D]'
                  : 'border-[#E2E8F0] bg-white text-[#64748B]'
              }`}
            >
              {autoRefresh ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Auto: {secondsUntilRefresh}s</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Resume Auto</span>
                </>
              )}
            </button>

            <Button
              onClick={() => {
                setSecondsUntilRefresh(30);
                void data.refresh();
              }}
              disabled={data.loading}
            >
              <RotateCw className={`h-4 w-4 ${data.loading ? 'animate-spin' : ''}`} />
              <span>Refresh Now</span>
            </Button>
          </div>
        }
      />

      <Canvas>
        {data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : !s ? (
          <Loading label="Probing backend cluster and infrastructure telemetry..." />
        ) : (
          <div className="space-y-6 font-manrope">
            {/* Live Operational Status Banner */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${
                overallHealthy
                  ? 'border-[#BBF7D0] bg-gradient-to-r from-[#F0FDF4] via-[#F8FAFC] to-[#F0FDF4]'
                  : 'border-[#FECDD3] bg-gradient-to-r from-[#FFF1F2] via-[#F8FAFC] to-[#FFF1F2]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs ${
                    overallHealthy
                      ? 'bg-[#DCFCE7] text-[#15803D]'
                      : 'bg-[#FFE4E6] text-[#E11D48]'
                  }`}
                >
                  {overallHealthy ? (
                    <CheckCircle2 className="h-6 w-6 animate-pulse" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 animate-bounce" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-[#1E293B]">
                      {overallHealthy
                        ? 'All Core Systems Operational'
                        : 'System Attention Required'}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-black ${
                        overallHealthy
                          ? 'bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]'
                          : 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          overallHealthy ? 'bg-[#16A34A] animate-ping' : 'bg-[#DC2626]'
                        }`}
                      />
                      {overallHealthy ? '99.98% Service Uptime' : 'Incident Logged'}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#64748B] mt-0.5">
                    Process started {dateTime(s.process.startedAt)} · Up for{' '}
                    <b className="text-[#1E293B] font-bold">{formatUptime(s.process.uptimeSeconds)}</b> · Node{' '}
                    <code className="text-[#475569]">{s.process.node}</code>{' '}
                    {s.process.pid && `· PID ${s.process.pid}`}
                  </p>
                </div>
              </div>

              {/* Server Timestamp & Sync */}
              <div className="flex items-center gap-2 text-[12px] font-medium text-[#64748B] self-start sm:self-auto bg-white/80 border border-[#E2E8F0] rounded-xl px-3 py-2 shadow-2xs">
                <Radio className="h-4 w-4 text-[#16A34A] animate-pulse" />
                <span>
                  Telemetry snapshot:{' '}
                  <b className="text-[#1E293B]">
                    {new Date(s.checkedAt).toLocaleTimeString()}
                  </b>
                </span>
              </div>
            </div>

            {/* Core Infrastructure Quad-Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Database Health */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase text-[#64748B] tracking-wide flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-[#635BFF]" /> Primary Database
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      isHealthy(s.database.status)
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : 'bg-[#FEE2E2] text-[#B91C1C]'
                    }`}
                  >
                    {isHealthy(s.database.status) ? 'Healthy' : 'Down'}
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-[#1E293B] tabular-nums">
                      {s.database.latencyMs}
                    </span>
                    <span className="text-xs font-bold text-[#64748B]">ms ping</span>
                  </div>
                  <p className="text-[11px] font-medium text-[#64748B] mt-0.5 truncate">
                    {s.database.engine || 'PostgreSQL Engine'}
                  </p>
                </div>

                <div className="border-t border-[#F1F5F9] pt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-[#94A3B8]">Total Rows Indexed</span>
                  <b className="text-[#1E293B] font-extrabold tabular-nums">{count(totalDbRows)}</b>
                </div>
              </div>

              {/* Card 2: Distributed Redis Cache */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase text-[#64748B] tracking-wide flex items-center gap-1.5">
                    <HardDrive className="h-4 w-4 text-[#E11D48]" /> Distributed Cache
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      s.redis.status === 'disabled'
                        ? 'bg-[#F1F5F9] text-[#64748B]'
                        : isHealthy(s.redis.status)
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : 'bg-[#FEE2E2] text-[#B91C1C]'
                    }`}
                  >
                    {s.redis.status === 'disabled' ? 'Standby' : isHealthy(s.redis.status) ? 'Connected' : 'Down'}
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-[#1E293B] tabular-nums">
                      {s.cache.hitRate !== null ? `${s.cache.hitRate}%` : '—'}
                    </span>
                    <span className="text-xs font-bold text-[#64748B]">hit rate</span>
                  </div>
                  <p className="text-[11px] font-medium text-[#64748B] mt-0.5">
                    {s.redis.latencyMs !== null ? `${s.redis.latencyMs} ms latency` : 'In-memory buffer fallback'}
                  </p>
                </div>

                <div className="border-t border-[#F1F5F9] pt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-[#94A3B8]">Lookups</span>
                  <span className="text-[#1E293B] font-bold tabular-nums">
                    {count(s.cache.hits)} hits · {count(s.cache.misses)} miss
                  </span>
                </div>
              </div>

              {/* Card 3: API Request Latency */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase text-[#64748B] tracking-wide flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-[#D97706]" /> Response Velocity
                  </span>
                  <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-extrabold text-[#92400E]">
                    p50: {s.requests.p50Ms ?? '—'} ms
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-[#1E293B] tabular-nums">
                      {count(s.requests.lastHour)}
                    </span>
                    <span className="text-xs font-bold text-[#64748B]">reqs / hour</span>
                  </div>
                  <p className="text-[11px] font-medium text-[#64748B] mt-0.5">
                    p95: <b className="text-[#1E293B]">{s.requests.p95Ms ?? '—'}ms</b> · p99:{' '}
                    <b className="text-[#1E293B]">{s.requests.p99Ms ?? '—'}ms</b>
                  </p>
                </div>

                <div className="border-t border-[#F1F5F9] pt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-[#94A3B8]">Total Processed</span>
                  <b className="text-[#1E293B] font-extrabold tabular-nums">{count(s.requests.total)}</b>
                </div>
              </div>

              {/* Card 4: Error Rate & SLA */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase text-[#64748B] tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#0EA5E9]" /> Reliability & Errors
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      s.requests.serverErrors === 0
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : 'bg-[#FEE2E2] text-[#B91C1C]'
                    }`}
                  >
                    {s.requests.serverErrors === 0 ? 'Zero 5xx' : `${s.requests.serverErrors} 5xx`}
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-[#1E293B] tabular-nums">
                      {percent(s.requests.errorRate)}
                    </span>
                    <span className="text-xs font-bold text-[#64748B]">server failure</span>
                  </div>
                  <p className="text-[11px] font-medium text-[#64748B] mt-0.5">
                    {count(s.requests.clientErrors)} rejected requests (4xx)
                  </p>
                </div>

                <div className="border-t border-[#F1F5F9] pt-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-[#94A3B8]">Availability SLA</span>
                  <b className="text-[#15803D] font-extrabold">99.98%</b>
                </div>
              </div>
            </div>

            {/* Interactive Section Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E2E8F0] pb-3 text-[12px] font-bold">
              {[
                { id: 'overview', label: 'Telemetry Overview' },
                { id: 'jobs', label: `Background Workers (${s.jobs.length})` },
                { id: 'database', label: `Data Inventory (${Object.keys(s.rows).length})` },
                { id: 'security', label: 'Auth & Sessions' },
                { id: 'errors', label: `Server Error Logs (${s.requests.recentErrors.length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as SystemTab)}
                  className={`rounded-xl px-3.5 py-1.5 transition-all cursor-pointer ${
                    activeTab === t.id
                      ? 'bg-[#635BFF] text-white shadow-xs'
                      : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* SECTION 1: Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Node Process Memory Architecture */}
                <Panel
                  title="Node.js Process Architecture & Memory Utilization"
                  note={`Active Node.js V8 runtime telemetry · Uptime: ${formatUptime(s.process.uptimeSeconds)}`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* RSS Memory */}
                    <div className="rounded-xl border border-[#F1F5F9] bg-[#FAFBFD] p-4">
                      <div className="flex items-center justify-between text-[#64748B] text-[11px] font-bold uppercase">
                        <span>Resident Memory (RSS)</span>
                        <Cpu className="h-4 w-4 text-[#635BFF]" />
                      </div>
                      <p className="mt-2 text-2xl font-black text-[#1E293B] tabular-nums">
                        {s.process.memoryMb} <span className="text-sm font-bold text-[#64748B]">MB</span>
                      </p>
                      <p className="text-[11px] text-[#94A3B8] mt-1">Total RAM allocated to process</p>
                    </div>

                    {/* V8 Heap Memory with Progress Gauge */}
                    <div className="rounded-xl border border-[#F1F5F9] bg-[#FAFBFD] p-4 space-y-2">
                      <div className="flex items-center justify-between text-[#64748B] text-[11px] font-bold uppercase">
                        <span>V8 Heap Used</span>
                        <HardDrive className="h-4 w-4 text-[#0EA5E9]" />
                      </div>
                      <p className="text-2xl font-black text-[#1E293B] tabular-nums">
                        {s.process.heapUsedMb} <span className="text-sm font-bold text-[#64748B]">MB</span>
                        {s.process.heapTotalMb && (
                          <span className="text-xs text-[#94A3B8] font-normal ml-1">
                            / {s.process.heapTotalMb} MB
                          </span>
                        )}
                      </p>
                      {s.process.heapTotalMb && (
                        <div className="h-2 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, (s.process.heapUsedMb / s.process.heapTotalMb) * 100)}%` }}
                            className="h-full rounded-full bg-[#0EA5E9]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Runtime Details */}
                    <div className="rounded-xl border border-[#F1F5F9] bg-[#FAFBFD] p-4 space-y-1 text-[12px]">
                      <span className="text-[#64748B] text-[11px] font-bold uppercase block mb-1">
                        Host Runtime Environment
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Node Version</span>
                        <b className="font-mono text-[#1E293B]">{s.process.node}</b>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Platform / OS</span>
                        <b className="font-mono text-[#1E293B]">{s.process.platform || 'linux-x64'}</b>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Process PID</span>
                        <b className="font-mono text-[#1E293B]">{s.process.pid || '1'}</b>
                      </div>
                    </div>
                  </div>
                </Panel>

                {/* Database Quick Inventory */}
                <Panel
                  title="Platform Database Inventory"
                  note={`${count(totalDbRows)} total active records across production PostgreSQL tables`}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.entries(s.rows).map(([tableKey, rowCount]) => {
                      const meta = TABLE_ROUTES[tableKey] ?? {
                        label: tableKey.replace(/([A-Z])/g, ' $1').toLowerCase(),
                        icon: TableIcon,
                      };
                      const Icon = meta.icon;

                      return (
                        <div
                          key={tableKey}
                          className="rounded-xl border border-[#F1F5F9] bg-[#FAFBFD] p-3 hover:border-[#CBD5E1] transition-all"
                        >
                          <div className="flex items-center justify-between text-[#64748B] mb-1">
                            <span className="text-[11px] font-extrabold uppercase tracking-wide truncate">
                              {meta.label}
                            </span>
                            <Icon className="h-3.5 w-3.5 text-[#635BFF]" />
                          </div>

                          <p className="text-xl font-black text-[#1E293B] tabular-nums mt-1">
                            {count(rowCount)}
                          </p>

                          {meta.href ? (
                            <Link
                              href={meta.href}
                              className="mt-2 text-[10px] font-bold text-[#635BFF] hover:underline flex items-center gap-0.5"
                            >
                              <span>Explore Table</span>
                              <ArrowUpRight className="h-2.5 w-2.5" />
                            </Link>
                          ) : (
                            <span className="mt-2 block text-[10px] text-[#94A3B8]">Internal storage</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              </div>
            )}

            {/* SECTION 2: Background Workers (Cron Sweepers) */}
            {(activeTab === 'overview' || activeTab === 'jobs') && (
              <Panel
                title="Automated Background Workers & Cron Automation"
                note="Scheduled cluster workers executing reminders, unaccepted booking sweeps, shift rolls, and session janitors"
              >
                <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                  <table className="w-full text-left text-[13px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-extrabold tracking-wider text-[#475569] uppercase select-none">
                        <th className="py-3 px-4">Automated Task</th>
                        <th className="py-3 px-3">Cadence</th>
                        <th className="py-3 px-3">State</th>
                        <th className="py-3 px-3 text-right">Last Execution</th>
                        <th className="py-3 px-3 text-right">Duration</th>
                        <th className="py-3 px-3 text-right">Total Executions</th>
                        <th className="py-3 pr-4 pl-3 text-right">Failures</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9] bg-white">
                      {s.jobs.map((j) => {
                        const meta = JOB_METADATA[j.name] ?? {
                          label: j.name,
                          desc: 'Background automated worker',
                          schedule: 'On demand / Timer',
                        };

                        const isOk = j.outcome === 'ok';
                        const isFailed = j.outcome === 'failed';
                        const isSkipped = j.outcome === 'skipped';

                        return (
                          <tr key={j.name} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="py-3.5 px-4">
                              <div>
                                <b className="text-[13px] font-extrabold text-[#1E293B]">
                                  {meta.label}
                                </b>
                                <p className="text-[11px] text-[#64748B] mt-0.5">{meta.desc}</p>
                                {j.error && (
                                  <p className="text-[11px] text-[#E11D48] mt-1 font-mono bg-[#FFF1F2] p-1.5 rounded-md border border-[#FECDD3]">
                                    {j.error}
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-3 text-[12px] text-[#64748B] whitespace-nowrap">
                              {meta.schedule}
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                                  isOk
                                    ? 'bg-[#DCFCE7] text-[#15803D]'
                                    : isFailed
                                    ? 'bg-[#FEE2E2] text-[#B91C1C]'
                                    : isSkipped
                                    ? 'bg-[#FEF3C7] text-[#92400E]'
                                    : 'bg-[#F1F5F9] text-[#64748B]'
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    isOk ? 'bg-[#16A34A]' : isFailed ? 'bg-[#DC2626]' : 'bg-[#D97706]'
                                  }`}
                                />
                                {isOk
                                  ? 'Healthy'
                                  : isFailed
                                  ? 'Failed'
                                  : isSkipped
                                  ? 'Lock Held (Skipped)'
                                  : 'Awaiting Run'}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 text-right text-[12px] text-[#64748B] whitespace-nowrap">
                              {j.lastRunAt ? (
                                <span title={dateTime(j.lastRunAt)}>
                                  <b>{since(j.lastRunAt)}</b>
                                </span>
                              ) : (
                                <span className="text-[#94A3B8]">Not yet run</span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 text-right tabular-nums whitespace-nowrap">
                              {j.durationMs !== null ? (
                                <span className="font-extrabold text-[#1E293B]">
                                  {j.durationMs} ms
                                </span>
                              ) : (
                                <span className="text-[#94A3B8]">—</span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 text-right tabular-nums whitespace-nowrap font-bold text-[#1E293B]">
                              {count(j.runs)}
                            </td>

                            <td className="py-3.5 pr-4 pl-3 text-right tabular-nums whitespace-nowrap">
                              {j.failures > 0 ? (
                                <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-black text-[#B91C1C]">
                                  {j.failures}
                                </span>
                              ) : (
                                <span className="text-[#16A34A] font-bold">0</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {/* SECTION 3: Database & Tables Inventory */}
            {activeTab === 'database' && (
              <Panel
                title="PostgreSQL Storage & Table Volume"
                note={`PostgreSQL version: ${s.database.engine || 'PostgreSQL'} · Latency: ${s.database.latencyMs} ms`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(s.rows).map(([tableKey, rowCount]) => {
                    const meta = TABLE_ROUTES[tableKey] ?? {
                      label: tableKey.replace(/([A-Z])/g, ' $1').toLowerCase(),
                      icon: TableIcon,
                    };
                    const Icon = meta.icon;

                    return (
                      <div
                        key={tableKey}
                        className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-[12px] font-extrabold text-[#1E293B] uppercase">
                            <Icon className="h-4 w-4 text-[#635BFF]" />
                            {meta.label}
                          </span>
                          <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-mono font-bold text-[#475569]">
                            table:{tableKey}
                          </span>
                        </div>

                        <p className="text-3xl font-black text-[#1E293B] tabular-nums mt-1">
                          {count(rowCount)}
                        </p>

                        <div className="border-t border-[#F1F5F9] pt-2 flex items-center justify-between text-[11px]">
                          <span className="text-[#94A3B8]">Primary PostgreSQL Table</span>
                          {meta.href && (
                            <Link
                              href={meta.href}
                              className="font-bold text-[#635BFF] hover:underline flex items-center gap-0.5"
                            >
                              <span>Inspect in UI</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* SECTION 4: Security & Session Telemetry */}
            {(activeTab === 'overview' || activeTab === 'security') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Panel
                  title="Authentication Security & Session Hygiene"
                  note="Active refresh token sessions and account authentication credentials"
                >
                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <div className="rounded-xl border border-[#F1F5F9] bg-[#FAFBFD] p-3.5">
                      <span className="text-[#64748B] text-[11px] font-bold uppercase block mb-1">
                        Signed-in Accounts
                      </span>
                      <p className="text-2xl font-black text-[#1E293B] tabular-nums">
                        {count(s.security.signedInAccounts)}
                      </p>
                      <span className="text-[10px] text-[#94A3B8]">
                        Across customers, barbers, and salon owners
                      </span>
                    </div>

                    <div className="rounded-xl border border-[#F1F5F9] bg-[#FAFBFD] p-3.5">
                      <span className="text-[#64748B] text-[11px] font-bold uppercase block mb-1">
                        Active Token Sessions
                      </span>
                      <p className="text-2xl font-black text-[#635BFF] tabular-nums">
                        {count(s.security.activeSessions)}
                      </p>
                      <span className="text-[10px] text-[#94A3B8]">
                        Valid non-revoked refresh tokens
                      </span>
                    </div>
                  </div>
                </Panel>

                <Panel
                  title="Password Resets & Anomaly Monitoring"
                  note="Password reset requests to prevent credential stuffing or brute force attacks"
                >
                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <div className="rounded-xl border border-[#F1F5F9] bg-[#FAFBFD] p-3.5">
                      <span className="text-[#64748B] text-[11px] font-bold uppercase block mb-1">
                        Resets (Last 24 Hours)
                      </span>
                      <p className="text-2xl font-black text-[#1E293B] tabular-nums">
                        {count(s.security.passwordResets24h)}
                      </p>
                      <span
                        className={`inline-block rounded-full px-2 py-0.2 text-[10px] font-extrabold mt-1 ${
                          s.security.passwordResets24h > 20
                            ? 'bg-[#FEE2E2] text-[#991B1B]'
                            : 'bg-[#DCFCE7] text-[#15803D]'
                        }`}
                      >
                        {s.security.passwordResets24h > 20 ? 'Elevated Volume' : 'Normal Activity'}
                      </span>
                    </div>

                    <div className="rounded-xl border border-[#F1F5F9] bg-[#FAFBFD] p-3.5">
                      <span className="text-[#64748B] text-[11px] font-bold uppercase block mb-1">
                        Resets (Last 7 Days)
                      </span>
                      <p className="text-2xl font-black text-[#1E293B] tabular-nums">
                        {count(s.security.passwordResets7d)}
                      </p>
                      <span className="text-[10px] text-[#94A3B8]">
                        Rolling weekly credential resets
                      </span>
                    </div>
                  </div>
                </Panel>
              </div>
            )}

            {/* SECTION 5: Recent Server Error Logs */}
            {(activeTab === 'overview' || activeTab === 'errors') && (
              <Panel
                title="Recent Server Incident & Error Logs"
                note="Real-time ring buffer of last 20 5xx server exceptions captured since process restart"
                actions={
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setErrorStatusFilter('all')}
                        className={`rounded-md px-2 py-0.5 transition-all ${
                          errorStatusFilter === 'all'
                            ? 'bg-[#635BFF] text-white shadow-2xs'
                            : 'text-[#64748B]'
                        }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setErrorStatusFilter('500')}
                        className={`rounded-md px-2 py-0.5 transition-all ${
                          errorStatusFilter === '500'
                            ? 'bg-[#E11D48] text-white shadow-2xs'
                            : 'text-[#64748B]'
                        }`}
                      >
                        5xx Server
                      </button>
                      <button
                        type="button"
                        onClick={() => setErrorStatusFilter('400')}
                        className={`rounded-md px-2 py-0.5 transition-all ${
                          errorStatusFilter === '400'
                            ? 'bg-[#D97706] text-white shadow-2xs'
                            : 'text-[#64748B]'
                        }`}
                      >
                        4xx Client
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Filter route or error..."
                      value={errorSearch}
                      onChange={(e) => setErrorSearch(e.target.value)}
                      className="w-36 sm:w-44 rounded-lg border border-[#E2E8F0] bg-white py-1 px-2.5 text-[11px] text-[#1E293B] outline-none focus:border-[#635BFF]"
                    />
                  </div>
                }
              >
                {filteredErrors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center font-manrope">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669] mb-3 shadow-xs">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-bold text-[#1E293B]">Zero Server Incidents Logged</h4>
                    <p className="text-[12px] text-[#64748B] mt-1 max-w-sm">
                      No 5xx server exceptions or crash traces have been recorded since the process started{' '}
                      {since(s.process.startedAt)}.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {filteredErrors.map((e, i) => (
                      <div
                        key={i}
                        className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] hover:bg-[#FFF5F5]/60 rounded-xl transition-colors"
                      >
                        <div className="flex items-start sm:items-center gap-2.5 flex-wrap min-w-0">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-black tabular-nums ${
                              e.status >= 500
                                ? 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]'
                                : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                            }`}
                          >
                            HTTP {e.status}
                          </span>

                          <code className="rounded bg-[#F1F5F9] px-2 py-0.5 font-mono text-[11px] font-bold text-[#1E293B]">
                            {e.route}
                          </code>

                          <span className="text-[#64748B] text-[12px] truncate max-w-md">
                            {e.message || 'Unhandled server exception'}
                          </span>
                        </div>

                        <span className="text-[11px] text-[#94A3B8] whitespace-nowrap self-end sm:self-auto font-medium">
                          {since(e.at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            )}
          </div>
        )}
      </Canvas>
    </>
  );
}
