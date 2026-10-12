'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCw, Star } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { getSafety, type InsightDays } from '@/lib/api/insights';
import { REASON_LABELS } from '@/lib/api/reports';
import { placeHref } from '@/lib/placeHref';
import { count, dateTime, since } from '@/lib/format';
import { Badge, Button, Canvas, Empty, Failed, Loading, PageHead, Panel, Stat } from '@/components/ui/primitives';
import { DaysPicker, duration } from '@/components/insights/Bits';

/** Reports, blocks, bans, bad reviews, shops that never reply, and chat responsiveness, in one place. */
export default function SafetyPage() {
  const [days, setDays] = useState<InsightDays>(30);
  const data = useApi(() => getSafety(days), [days], 'insights-safety');
  const s = data.data;
  const maxStars = Math.max(1, ...(s?.reviews.distribution.map((d) => d.count) ?? [1]));
  return (
    <>
      <PageHead
        eyebrow="Insights"
        title="Trust & safety"
        lede="Open reports, people reported or blocked again and again, banned accounts, low ratings, shops that leave reviews unanswered, and how fast shops reply to customers in chat (counts only; messages are never shown here)."
        actions={
          <>
            <DaysPicker value={days} onChange={setDays} />
            <Link href="/reports"><Button variant="primary">Open report queue</Button></Link>
            <Button onClick={data.refresh} disabled={data.loading}><RotateCw className="h-4 w-4" /> Refresh</Button>
          </>
        }
      />
      <Canvas>
        {data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : !s ? (
          <Loading label="Reading reports, blocks and reviews" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Open reports" value={count(s.reports.open)} sub={s.reports.oldestOpenDays !== null ? `Oldest waiting ${s.reports.oldestOpenDays} days` : 'All handled'} tone={s.reports.open ? 'signal' : 'live'} />
              <Stat label="Blocks" value={count(s.blocks.total)} sub={`${s.blocks.inPeriod} in this period`} />
              <Stat label="Banned accounts" value={count(s.banned.length)} />
              <Stat label="Median chat reply" value={duration(s.chat.medianReplyMinutes)} sub={`${s.chat.activeConversations} active chats · ${count(s.chat.messagesInPeriod)} messages`} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Repeat offenders" note="Accounts reported 2 or more times">
                {s.repeatOffenders.length === 0 ? (
                  <Empty title="No one reported twice" />
                ) : (
                  <ul className="space-y-1.5 text-[13px]">
                    {s.repeatOffenders.map((o) => (
                      <li key={o.userId} className="flex justify-between gap-3">
                        <Link href={`/users/${o.userId}`} className="font-semibold hover:text-[#635BFF]">{o.name ?? o.userId.slice(0, 8)}</Link>
                        <Badge tone="signal">{o.reports} reports</Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.reports.byReason.map((r) => <Badge key={r.key} tone="warning">{REASON_LABELS[r.key] ?? r.key}: {r.count}</Badge>)}
                </div>
              </Panel>
              <Panel title="Most blocked" note="Accounts blocked by 2 or more people">
                {s.blocks.mostBlocked.length === 0 ? (
                  <Empty title="No one blocked by several people" />
                ) : (
                  <ul className="space-y-1.5 text-[13px]">
                    {s.blocks.mostBlocked.map((b) => (
                      <li key={b.userId} className="flex justify-between gap-3">
                        <Link href={`/users/${b.userId}`} className="font-semibold hover:text-[#635BFF]">{b.name ?? b.userId.slice(0, 8)}</Link>
                        <Badge tone="warning">blocked by {b.blockedBy}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="Ratings" note={`${s.reviews.inPeriod} reviews · average ${s.reviews.average ?? '—'}`}>
                <ul className="space-y-1.5">
                  {[...s.reviews.distribution].reverse().map((d) => (
                    <li key={d.stars} className="flex items-center gap-2 text-[12px] font-bold">
                      <span className="inline-flex w-8 items-center gap-0.5">{d.stars}<Star size={11} aria-hidden /></span>
                      <span className="h-2 flex-1 rounded-full bg-[#F1F5F9]"><span className="block h-full rounded-full" style={{ width: `${(d.count / maxStars) * 100}%`, backgroundColor: d.stars <= 2 ? '#EF4444' : d.stars === 3 ? '#F59E0B' : '#16A34A' }} /></span>
                      <span className="w-6 text-right tabular-nums">{d.count}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Recent low ratings" note="1 or 2 stars" className="lg:col-span-2">
                {s.reviews.lowRecent.length === 0 ? (
                  <Empty title="No low ratings in this period" />
                ) : (
                  <ul className="divide-y divide-[#F1F5F9] text-[13px]">
                    {s.reviews.lowRecent.map((r) => (
                      <li key={r.id} className="py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="signal">{r.rating}★</Badge>
                          <b>{r.place ?? '—'}</b>
                          {r.replied ? <Badge tone="live">Replied</Badge> : <Badge tone="warning">No reply</Badge>}
                          <span className="text-[#94A3B8]" title={dateTime(r.createdAt)}>{since(r.createdAt)}</span>
                        </div>
                        {r.comment && <p className="mt-1 text-[#475569]">{r.comment}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Reviews left unanswered" note="Shops and barbers with the most reviews they never replied to">
                {s.reviews.unansweredByPlace.length === 0 ? (
                  <Empty title="Every review has a reply" />
                ) : (
                  <ol className="space-y-1.5 text-[13px]">
                    {s.reviews.unansweredByPlace.map((u) => (
                      <li key={u.key} className="flex justify-between gap-3">
                        <Link href={placeHref(u.key)} className="truncate font-semibold hover:text-[#635BFF]">{u.name}</Link>
                        <b className="tabular-nums">{u.count}</b>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
              <Panel title="Slowest to reply in chat" note="Median time to answer a customer's message">
                {s.chat.slowestRepliers.length === 0 ? (
                  <Empty title="No chat replies in this period" />
                ) : (
                  <ol className="space-y-1.5 text-[13px]">
                    {s.chat.slowestRepliers.map((r) => (
                      <li key={r.key} className="flex justify-between gap-3">
                        <Link href={placeHref(r.key)} className="truncate font-semibold hover:text-[#635BFF]">{r.name}</Link>
                        <span className="tabular-nums font-bold">{duration(r.medianMinutes)} <span className="text-[#94A3B8]">· {r.replies}</span></span>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
            </div>

            <Panel title="Banned accounts" note="Most recent first">
              {s.banned.length === 0 ? (
                <Empty title="No banned accounts" />
              ) : (
                <ul className="divide-y divide-[#F1F5F9] text-[13px]">
                  {s.banned.map((b) => (
                    <li key={b.userId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className="flex flex-wrap items-center gap-2">
                        <Link href={`/users/${b.userId}`} className="font-bold hover:text-[#635BFF]">{b.name ?? b.email}</Link>
                        <Badge tone="quiet">{b.role}</Badge>
                        {b.reason && <span className="text-[#64748B]">{b.reason}</span>}
                      </span>
                      <span className="text-[#94A3B8]">{b.bannedAt ? since(b.bannedAt) : ''}</span>
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
