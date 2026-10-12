'use client';

import { useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { getSystem, type JobRun } from '@/lib/api/insights';
import { count, dateTime, since } from '@/lib/format';
import { Badge, Button, Canvas, Empty, Failed, Loading, PageHead, Panel, Stat } from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { percent } from '@/components/insights/Bits';

const JOB_LABELS: Record<string, string> = {
  'reminder-sweep': 'Booking reminders (every few minutes)',
  'expire-sweep': 'Close past and unaccepted bookings',
  'working-hours-roll': 'Roll working hours forward (daily)',
  'token-cleanup': 'Remove expired sign-in sessions (3 AM daily)',
};

function uptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}

function JobBadge({ job }: { job: JobRun }) {
  if (!job.outcome) return <Badge tone="quiet">Not run since restart</Badge>;
  if (job.outcome === 'failed') return <Badge tone="signal">Failed</Badge>;
  if (job.outcome === 'skipped') return <Badge tone="warning">Skipped (another server ran it)</Badge>;
  return <Badge tone="live">OK</Badge>;
}

/** Is everything up, how fast is it, are the background jobs running, anything odd with sign-ins. */
export default function SystemPage() {
  const data = useApi(getSystem, [], 'insights-system');
  const { refresh } = data;
  // Live page: refresh every 30 seconds while it's open.
  useEffect(() => {
    const t = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(t);
  }, [refresh]);
  const s = data.data;
  const healthy = (status: string) => status === 'healthy' || status === 'disabled';
  return (
    <>
      <PageHead
        eyebrow="Insights"
        title="System health"
        lede="The database and Redis, how fast the API answers, errors, the background jobs and sign-in security. Request numbers count since the server last restarted (every deploy restarts it). Refreshes every 30 seconds."
        actions={<Button onClick={data.refresh} disabled={data.loading}><RotateCw className="h-4 w-4" /> Refresh</Button>}
      />
      <Canvas>
        {data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : !s ? (
          <Loading label="Checking the system" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Database" value={healthy(s.database.status) ? 'Healthy' : 'Down'} sub={`${s.database.latencyMs} ms`} tone={healthy(s.database.status) ? 'live' : 'signal'} />
              <Stat label="Redis" value={s.redis.status === 'disabled' ? 'Not set up' : healthy(s.redis.status) ? 'Healthy' : 'Down'} sub={s.redis.latencyMs !== null ? `${s.redis.latencyMs} ms` : s.redis.status} tone={healthy(s.redis.status) ? 'live' : 'signal'} />
              <Stat label="Response time" value={s.requests.p50Ms !== null ? `${s.requests.p50Ms} ms` : '—'} sub={`95% under ${s.requests.p95Ms ?? '—'} ms · 99% under ${s.requests.p99Ms ?? '—'} ms`} />
              <Stat label="Server errors" value={percent(s.requests.errorRate)} sub={`${s.requests.serverErrors} of ${count(s.requests.total)} requests`} tone={s.requests.serverErrors ? 'signal' : 'live'} />
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Up for" value={uptime(s.process.uptimeSeconds)} sub={`Since ${dateTime(s.process.startedAt)}`} />
              <Stat label="Requests, last hour" value={count(s.requests.lastHour)} sub={`${s.requests.clientErrors} rejected (4xx) since restart`} />
              <Stat label="Cache hit rate" value={percent(s.cache.hitRate)} sub={`${count(s.cache.hits)} hits · ${count(s.cache.misses)} misses`} />
              <Stat label="Memory" value={`${s.process.memoryMb} MB`} sub={`${s.process.heapUsedMb} MB heap · Node ${s.process.node}`} />
            </div>

            <Panel title="Background jobs" note="When each one last ran on this server" flush>
              <Scroll>
                <Table>
                  <thead><tr><Th>Job</Th><Th>Status</Th><Th align="right">Last run</Th><Th align="right">Took</Th><Th align="right">Runs</Th><Th align="right">Failures</Th></tr></thead>
                  <tbody>
                    {s.jobs.map((j) => (
                      <Tr key={j.name}>
                        <Td><b>{JOB_LABELS[j.name] ?? j.name}</b>{j.error && j.outcome === 'failed' && <p className="text-[12px] text-[#E11D48]">{j.error}</p>}</Td>
                        <Td><JobBadge job={j} /></Td>
                        <Td align="right" muted>{j.lastRunAt ? since(j.lastRunAt) : '—'}</Td>
                        <Td align="right">{j.durationMs !== null ? `${j.durationMs} ms` : '—'}</Td>
                        <Td align="right">{j.runs}</Td>
                        <Td align="right">{j.failures}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Scroll>
            </Panel>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Sign-in security">
                <div className="grid grid-cols-2 gap-4">
                  <Stat label="Password resets, 24 h" value={count(s.security.passwordResets24h)} sub={`${s.security.passwordResets7d} in 7 days`} tone={s.security.passwordResets24h > 20 ? 'signal' : 'plain'} />
                  <Stat label="Signed-in accounts" value={count(s.security.signedInAccounts)} sub={`${s.security.activeSessions} active sessions`} />
                </div>
              </Panel>
              <Panel title="Data size" note="Rows in the main tables">
                <ul className="grid grid-cols-2 gap-2 text-[13px]">
                  {Object.entries(s.rows).map(([k, v]) => (
                    <li key={k} className="flex justify-between rounded-md bg-[#F8FAFC] px-3 py-2"><span className="capitalize text-[#64748B]">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span><b className="tabular-nums">{count(v)}</b></li>
                  ))}
                </ul>
              </Panel>
            </div>

            <Panel title="Recent server errors" note="Last 20 since restart">
              {s.requests.recentErrors.length === 0 ? (
                <Empty title="No server errors since the last restart" />
              ) : (
                <ul className="divide-y divide-[#F1F5F9] text-[13px]">
                  {s.requests.recentErrors.map((e, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-2 py-2">
                      <Badge tone="signal">{e.status}</Badge>
                      <code className="text-[12px]">{e.route}</code>
                      <span className="text-[#64748B]">{e.message}</span>
                      <span className="ml-auto text-[#94A3B8]">{since(e.at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </>
        )}
      </Canvas>
    </>
  );
}
