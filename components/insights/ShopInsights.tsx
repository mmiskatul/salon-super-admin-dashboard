'use client';

import Link from 'next/link';
import { useApi } from '@/lib/useApi';
import { getShopInsight } from '@/lib/api/insights';
import { date, money, since } from '@/lib/format';
import { Badge, Empty, Failed, Loading, Panel, Stat } from '@/components/ui/primitives';
import { Columns, duration, percent, StepChecks } from '@/components/insights/Bits';

/** A shop's readiness, bookable time this week, acceptance speed, reviews, revenue and team moves. */
export default function ShopInsights({ tenantId }: { tenantId: string }) {
  const data = useApi(() => getShopInsight(tenantId), [tenantId], 'insights-shop');
  if (data.loading && !data.data) return <Loading label="Loading shop insights" />;
  if (data.error) return <Failed message={data.error} onRetry={data.refresh} />;
  const s = data.data;
  if (!s) return null;
  const open = s.supply.reduce((n, d) => n + d.open, 0);
  const booked = s.supply.reduce((n, d) => n + d.booked, 0);
  const maxStars = Math.max(1, ...s.reviews.distribution.map((d) => d.count));
  return (
    <div className="space-y-5">
      <Panel
        title="Visible to customers?"
        note={s.readiness?.listed ? 'Yes: every go-live step is done' : 'No: customers can’t find or open this shop until every step is done'}
        actions={s.readiness ? (s.readiness.listed ? <Badge tone="live">Visible</Badge> : <Badge tone="signal">Hidden</Badge>) : null}>
        {s.readiness ? <StepChecks steps={s.readiness.steps} /> : <p className="text-[13px] text-[#94A3B8]">Unknown</p>}
        {s.readiness?.hidden && <p className="mt-2 text-[13px] font-semibold text-[#E11D48]">Also hidden by support: {s.readiness.hidden}</p>}
      </Panel>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Open slots, next 7 days" value={open} sub={`${booked} booked`} tone={open ? 'live' : 'signal'} />
        <Stat label="Median time to accept" value={duration(s.acceptance.medianMinutes)} sub={s.acceptance.measured ? `${percent(s.acceptance.within15min)} within 15 min` : 'Recorded from 12 Oct 2026'} />
        <Stat label="Rating" value={s.reviews.average ?? '—'} sub={`${s.reviews.count} reviews · ${s.reviews.unanswered} unanswered`} tone={s.reviews.unanswered ? 'signal' : 'plain'} />
        <Stat label="Barbers now" value={s.team.current} sub={`${s.team.joinRequests.filter((j) => j.state === 'PENDING').length} join requests waiting`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Next 7 days" note="Open time slots and bookings per day">
          <ul className="space-y-1.5 text-[13px]">
            {s.supply.map((d) => (
              <li key={d.day} className="flex items-center gap-3">
                <span className="w-24 shrink-0 font-semibold">{date(d.day)}</span>
                <span className="h-2 flex-1 rounded-full bg-[#F1F5F9]"><span className="block h-full rounded-full bg-[#16A34A]" style={{ width: `${Math.min(100, d.open * 20)}%` }} /></span>
                <span className="w-32 shrink-0 text-right tabular-nums">{d.open} open · {d.booked} booked</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Cash per week" note="Last 12 weeks">
          <Columns points={s.revenueWeekly.map((w) => ({ label: w.weekStart.slice(5), value: w.amount }))} color="#16A34A" format={money} />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Ratings">
          <ul className="space-y-1.5">
            {[...s.reviews.distribution].reverse().map((d) => (
              <li key={d.stars} className="flex items-center gap-2 text-[12px] font-bold">
                <span className="w-6">{d.stars}★</span>
                <span className="h-2 flex-1 rounded-full bg-[#F1F5F9]"><span className="block h-full rounded-full bg-[#F59E0B]" style={{ width: `${(d.count / maxStars) * 100}%` }} /></span>
                <span className="w-6 text-right tabular-nums">{d.count}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Barbers who joined or left" className="lg:col-span-2">
          {s.team.history.length === 0 ? (
            <Empty title="No team history" />
          ) : (
            <ul className="divide-y divide-[#F1F5F9] text-[13px]">
              {s.team.history.map((h, i) => (
                <li key={`${h.userId}${i}`} className="flex flex-wrap items-center gap-2 py-1.5">
                  <Link href={`/barbers/${h.userId}`} className="font-bold hover:text-[#635BFF]">{h.name ?? h.userId.slice(0, 8)}</Link>
                  {h.title && <span className="text-[#64748B]">{h.title}</span>}
                  <span className="ml-auto text-[#94A3B8]">
                    {date(h.startedAt)} → {h.endedAt ? date(h.endedAt) : <Badge tone="live">Still here</Badge>}
                    {h.endReason && <span className="ml-1.5">({h.endReason.toLowerCase().replace('_', ' ')})</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {s.team.joinRequests.length > 0 && (
            <div className="mt-3 border-t border-[#F1F5F9] pt-3">
              <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wider text-[#94A3B8]">Join requests</p>
              <ul className="space-y-1 text-[13px]">
                {s.team.joinRequests.map((j, i) => (
                  <li key={`${j.userId}${i}`} className="flex items-center gap-2">
                    <Link href={`/barbers/${j.userId}`} className="font-semibold hover:text-[#635BFF]">{j.name ?? j.userId.slice(0, 8)}</Link>
                    <Badge tone={j.state === 'APPROVED' ? 'live' : j.state === 'PENDING' ? 'warning' : 'quiet'}>{j.state.toLowerCase()}</Badge>
                    <span className="ml-auto text-[#94A3B8]">{since(j.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
