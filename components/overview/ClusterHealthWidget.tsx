'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Server,
  Database,
  HardDrive,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-client';

type Status = 'checking' | 'healthy' | 'degraded' | 'down' | 'disabled';

interface Health {
  api: Status;
  latencyMs: number | null;
  database: Status;
  databaseDetail: string | null;
  redis: Status;
  uptimeSeconds: number | null;
  checkedAt: Date | null;
}

const CHECKING: Health = {
  api: 'checking',
  latencyMs: null,
  database: 'checking',
  databaseDetail: null,
  redis: 'checking',
  uptimeSeconds: null,
  checkedAt: null,
};

const STYLE: Record<Status, { dot: string; text: string; bg: string; border: string; label: string }> = {
  checking: { dot: 'bg-[#CBD5E1]', text: 'text-[#94A3B8]', bg: 'bg-[#F8FAFC]', border: 'border-[#E2E8F0]', label: 'Checking…' },
  healthy: { dot: 'bg-[#10B981]', text: 'text-[#059669]', bg: 'bg-[#F0FDF4]', border: 'border-[#BBF7D0]', label: 'Healthy' },
  degraded: { dot: 'bg-[#F59E0B]', text: 'text-[#D97706]', bg: 'bg-[#FFFBEB]', border: 'border-[#FDE68A]', label: 'Degraded' },
  down: { dot: 'bg-[#F43F5E]', text: 'text-[#E11D48]', bg: 'bg-[#FFF1F2]', border: 'border-[#FECDD3]', label: 'Down' },
  disabled: { dot: 'bg-[#CBD5E1]', text: 'text-[#64748B]', bg: 'bg-[#F8FAFC]', border: 'border-[#E2E8F0]', label: 'Standby' },
};

function uptimeLabel(seconds: number | null): string {
  if (seconds === null) return '—';
  const h = Math.floor(seconds / 3600);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h >= 1) return `${h}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.max(1, Math.floor(seconds / 60))}m`;
}

/** Asks the backend's readiness check, which tries the database and Redis for real. */
async function probe(): Promise<Health> {
  const start = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${API_BASE_URL}/health/readiness`, { signal: controller.signal, cache: 'no-store' });
    const latencyMs = Math.round(performance.now() - start);
    if (!res.ok) return { ...CHECKING, api: 'down', database: 'down', redis: 'down', latencyMs, checkedAt: new Date() };
    const body = (await res.json()) as { database?: string; redis?: string; uptime?: number };
    const db = body.database ?? '';
    const redis = body.redis ?? '';
    return {
      api: latencyMs > 3000 ? 'degraded' : 'healthy',
      latencyMs,
      database: db === 'healthy' ? 'healthy' : 'down',
      databaseDetail: db === 'healthy' ? null : db || 'No answer',
      redis: redis === 'healthy' ? 'healthy' : redis === 'disabled' ? 'disabled' : 'down',
      uptimeSeconds: typeof body.uptime === 'number' ? body.uptime : null,
      checkedAt: new Date(),
    };
  } catch {
    return { ...CHECKING, api: 'down', database: 'down', redis: 'down', checkedAt: new Date() };
  } finally {
    clearTimeout(timeout);
  }
}

export default function ClusterHealthWidget() {
  const [health, setHealth] = useState<Health>(CHECKING);
  const [isPinging, setIsPinging] = useState(true);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let current = true;
    probe().then((next) => {
      if (!current) return;
      setHealth(next);
      setIsPinging(false);
    });
    return () => {
      current = false;
    };
  }, [round]);

  const recheck = () => {
    setIsPinging(true);
    setRound((r) => r + 1);
  };

  const rows: { name: string; icon: React.ComponentType<{ className?: string }>; status: Status; detail: string; subDetail?: string }[] = [
    {
      name: 'API Gateway',
      icon: Zap,
      status: health.api,
      detail: health.latencyMs !== null ? `${health.latencyMs} ms ping` : '—',
      subDetail: health.latencyMs !== null && health.latencyMs < 50 ? 'Sub-50ms velocity' : 'REST routing',
    },
    {
      name: 'PostgreSQL DB',
      icon: Database,
      status: health.database,
      detail: health.databaseDetail ?? 'Connected',
      subDetail: 'ACID transactional data',
    },
    {
      name: 'Redis Cache',
      icon: HardDrive,
      status: health.redis,
      detail: health.redis === 'disabled' ? 'Local cache mode' : 'Distributed active',
      subDetail: 'Rate limiting & sessions',
    },
    {
      name: 'Host Uptime',
      icon: Clock,
      status: health.api === 'healthy' || health.api === 'degraded' ? 'healthy' : health.api,
      detail: uptimeLabel(health.uptimeSeconds),
      subDetail: 'Continuous server boot',
    },
  ];

  const problems = rows.filter((r) => r.status === 'down' || r.status === 'degraded').length;
  const overall: Status = isPinging && !health.checkedAt ? 'checking' : health.api === 'down' ? 'down' : problems ? 'degraded' : 'healthy';
  const badge = STYLE[overall];

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs font-manrope space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-extrabold text-[#1E293B]">
              Cluster Infrastructure Telemetry
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${badge.bg} ${badge.text} border ${badge.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${badge.dot} ${overall === 'healthy' ? 'animate-ping' : ''}`} />
              {overall === 'healthy'
                ? 'All systems operational'
                : overall === 'degraded'
                ? `${problems} system alert`
                : badge.label}
            </span>
          </div>

          <p className="text-[12px] font-medium text-[#64748B] mt-0.5">
            {health.checkedAt
              ? `Real-time readiness probe executed at ${health.checkedAt.toLocaleTimeString()}`
              : 'Pinging API gateway, PostgreSQL database, and distributed cache...'}
          </p>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/system"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] font-extrabold text-[#635BFF] hover:border-[#635BFF] hover:bg-[#F5F3FF] transition-all shadow-2xs"
          >
            <span>Open System Health Console</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={recheck}
            disabled={isPinging}
            className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Probe cluster health now"
            aria-label="Probe backend cluster health again"
          >
            <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin text-[#635BFF]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Core Status Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {rows.map((row) => {
          const s = STYLE[row.status];
          const Icon = row.icon;

          return (
            <div
              key={row.name}
              className={`p-3.5 rounded-xl border ${s.border} ${s.bg} transition-all space-y-1.5`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[12px] font-extrabold text-[#1E293B]">
                  <Icon className="h-3.5 w-3.5 text-[#635BFF]" />
                  {row.name}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] font-black ${s.text} bg-white/80`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </span>
              </div>

              <div className="text-[13px] font-extrabold text-[#1E293B] truncate" title={row.detail}>
                {row.detail}
              </div>

              {row.subDetail && (
                <div className="text-[11px] text-[#64748B] font-medium truncate">
                  {row.subDetail}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
