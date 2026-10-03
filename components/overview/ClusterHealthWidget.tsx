'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
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

const STYLE: Record<Status, { dot: string; text: string; label: string }> = {
  checking: { dot: 'bg-[#CBD5E1]', text: 'text-[#94A3B8]', label: 'Checking…' },
  healthy: { dot: 'bg-[#10B981]', text: 'text-[#10B981]', label: 'Healthy' },
  degraded: { dot: 'bg-[#F59E0B]', text: 'text-[#F59E0B]', label: 'Degraded' },
  down: { dot: 'bg-[#F43F5E]', text: 'text-[#F43F5E]', label: 'Down' },
  disabled: { dot: 'bg-[#CBD5E1]', text: 'text-[#94A3B8]', label: 'Not configured' },
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
    // Unreachable or timed out (a sleeping Render instance can take ~30s to wake).
    return { ...CHECKING, api: 'down', database: 'down', redis: 'down', checkedAt: new Date() };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Live health of the backend: the API itself, its database and Redis, from GET /health/readiness.
 *
 * It used to list eight "microservices" with port numbers, all probed against the same API host,
 * and showed every one as healthy (with a made-up 28ms) even when the request failed. Production
 * runs one backend, so this shows that backend and what it depends on, and a failure shows as one.
 */
export default function ClusterHealthWidget() {
  const [health, setHealth] = useState<Health>(CHECKING);
  const [isPinging, setIsPinging] = useState(true);

  // Bumping `round` runs the check again; a result for an older round (or after unmount) is dropped.
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

  const rows: { name: string; status: Status; detail: string }[] = [
    { name: 'API', status: health.api, detail: health.latencyMs !== null ? `${health.latencyMs} ms` : '—' },
    { name: 'Database', status: health.database, detail: health.databaseDetail ?? 'PostgreSQL' },
    { name: 'Redis', status: health.redis, detail: health.redis === 'disabled' ? 'REDIS_URL not set' : 'Cache & rate limits' },
    { name: 'Uptime', status: health.api === 'healthy' || health.api === 'degraded' ? 'healthy' : health.api, detail: uptimeLabel(health.uptimeSeconds) },
  ];
  const problems = rows.filter((r) => r.status === 'down' || r.status === 'degraded').length;
  const overall: Status = isPinging && !health.checkedAt ? 'checking' : health.api === 'down' ? 'down' : problems ? 'degraded' : 'healthy';
  const badge = STYLE[overall];

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm font-manrope">
      <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-[#1E293B]">Backend Health</h2>
            <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#F8FAFC] px-2.5 py-0.5 text-[11px] font-bold ${badge.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {overall === 'healthy' ? 'All systems operational' : overall === 'degraded' ? `${problems} issue${problems === 1 ? '' : 's'}` : badge.label}
            </span>
          </div>
          <p className="text-[12px] font-medium text-[#94A3B8] mt-0.5">
            {health.checkedAt ? `Checked ${health.checkedAt.toLocaleTimeString()}` : 'Checking the API, database and Redis'}
          </p>
        </div>

        <button
          type="button"
          onClick={recheck}
          disabled={isPinging}
          className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors cursor-pointer disabled:opacity-50"
          title="Check again"
          aria-label="Check backend health again"
        >
          <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin text-[#635BFF]' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
        {rows.map((row) => {
          const s = STYLE[row.status];
          return (
            <div key={row.name} className="p-3 rounded-lg border border-[#F1F5F9] bg-[#F8FAFC]">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[12px] font-bold text-[#1E293B] truncate">{row.name}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} title={s.label} />
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className={`font-semibold ${s.text}`}>{s.label}</span>
                <span className="text-[#94A3B8] truncate" title={row.detail}>{row.detail}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
