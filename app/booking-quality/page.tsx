'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCw } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { getBookingQuality, type InsightDays } from '@/lib/api/insights';
import { placeHref } from '@/lib/placeHref';
import { count } from '@/lib/format';
import { Badge, Button, Canvas, Empty, Failed, Loading, PageHead, Panel, Stat } from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { Split } from '@/components/chart/Chart';
import { DaysPicker, duration, Heatmap, percent } from '@/components/insights/Bits';

/** From request to finished visit: acceptance, cancellations, no-shows, punctuality, busy hours. */
export default function BookingQualityPage() {
  const [days, setDays] = useState<InsightDays>(30);
  const data = useApi(() => getBookingQuality(days), [days], 'insights-bookings');
  const b = data.data;
  return (
    <>
      <PageHead
        eyebrow="Insights"
        title="Booking quality"
        lede="What happens to booking requests: how many are accepted and completed, how fast shops accept, why people cancel, who has late-cancel strikes, whether sessions start on time, and the busiest hours."
        actions={
          <>
            <DaysPicker value={days} onChange={setDays} />
            <Button onClick={data.refresh} disabled={data.loading}><RotateCw className="h-4 w-4" /> Refresh</Button>
          </>
        }
      />
      <Canvas>
        {data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : !b ? (
          <Loading label="Reading bookings" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Booking requests" value={count(b.funnel.requested)} sub="App bookings, not walk-ins" />
              <Stat label="Accepted" value={percent(b.funnel.acceptRate)} sub={`${b.funnel.accepted} accepted`} tone="live" />
              <Stat label="Completed" value={percent(b.funnel.completionRate)} sub={`${b.funnel.completed} of the accepted`} />
              <Stat label="Median time to accept" value={duration(b.acceptance.medianMinutes)} sub={b.acceptance.measured ? `${percent(b.acceptance.within15min)} within 15 min` : 'Recorded from 12 Oct 2026'} />
            </div>

            <Panel title="What happened to the requests" note={`Created in the last ${days} days`}>
              <Split
                segments={[
                  { key: 'c', value: b.funnel.completed, color: '#16A34A', label: 'Completed' },
                  { key: 'w', value: b.funnel.stillWaiting, color: '#635BFF', label: 'Waiting to be accepted' },
                  { key: 'a', value: Math.max(0, b.funnel.accepted - b.funnel.completed - b.funnel.noShow), color: '#38BDF8', label: 'Accepted, not done yet' },
                  { key: 'cc', value: b.funnel.cancelledByCustomer, color: '#F59E0B', label: 'Cancelled by customer' },
                  { key: 'cs', value: b.funnel.cancelledByShop, color: '#FB7185', label: 'Cancelled or declined by shop' },
                  { key: 'e', value: b.funnel.expiredUnaccepted, color: '#94A3B8', label: 'Expired, never accepted' },
                  { key: 'n', value: b.funnel.noShow, color: '#E11D48', label: 'No-show' },
                ]}
                height={14}
              />
            </Panel>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Session timing" note="From when barbers press Start and Finish (recorded from 10 Oct 2026)">
                <div className="grid grid-cols-2 gap-4">
                  <Stat label="Median start vs booked time" value={duration(b.sessions.medianLateMinutes)} sub={`${b.sessions.started} sessions · ${b.sessions.startedEarly} started early`} />
                  <Stat label="Started on time" value={percent(b.sessions.onTime)} sub="Within 5 minutes" tone="live" />
                  <Stat label="Median overrun" value={duration(b.sessions.medianOverrunMinutes)} sub={`${b.sessions.finished} finished sessions`} />
                  <Stat label="Ran 15+ min over" value={count(b.sessions.overranBy15)} tone={b.sessions.overranBy15 ? 'signal' : 'plain'} />
                </div>
              </Panel>
              <Panel title="Cancellation reasons" note={`${b.cancellations.total} cancelled · ${b.cancellations.late} late (within 24 hours of the visit)`}>
                {b.cancellations.reasons.length === 0 ? (
                  <Empty title="No cancellations" />
                ) : (
                  <ol className="space-y-1.5 text-[13px]">
                    {b.cancellations.reasons.map((r) => (
                      <li key={r.key} className="flex justify-between gap-3"><span className="truncate">{r.key}</span><b className="tabular-nums">{r.count}</b></li>
                    ))}
                  </ol>
                )}
              </Panel>
            </div>

            <Panel title="Busy hours" note="Booked start times by day and hour (darker = more bookings)">
              <Heatmap grid={b.heatmap} />
            </Panel>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Slowest to accept" note="Median minutes from request to accepted">
                {b.acceptance.slowest.length === 0 ? (
                  <Empty title="Nothing measured yet" hint="Acceptance times are recorded from 12 Oct 2026." />
                ) : (
                  <ol className="space-y-1.5 text-[13px]">
                    {b.acceptance.slowest.map((s) => (
                      <li key={s.key} className="flex justify-between gap-3">
                        <Link href={placeHref(s.key)} className="truncate font-semibold hover:text-[#635BFF]">{s.name}</Link>
                        <span className="tabular-nums font-bold">{duration(s.medianMinutes)} <span className="text-[#94A3B8]">· {s.bookings}</span></span>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
              <Panel title="Customers with late-cancel strikes" note={`${b.cancellations.strikeLimit} late cancellations in ${b.cancellations.strikeWindowDays} days limits them to 1 upcoming booking`}>
                {b.cancellations.customersWithStrikes.length === 0 ? (
                  <Empty title="No one close to the limit" />
                ) : (
                  <ul className="space-y-1.5 text-[13px]">
                    {b.cancellations.customersWithStrikes.map((c) => (
                      <li key={c.userId} className="flex justify-between gap-3">
                        <Link href={`/users/${c.userId}`} className="font-semibold hover:text-[#635BFF]">{c.name ?? c.userId.slice(0, 8)}</Link>
                        <span>{c.restricted ? <Badge tone="signal">{c.lateCancels} strikes · restricted</Badge> : <Badge tone="warning">{c.lateCancels} strikes</Badge>}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <Panel title="By shop and barber" note="No-show and cancellation rates" flush>
              {b.places.length === 0 ? (
                <Empty title="No bookings in this period" />
              ) : (
                <Scroll>
                  <Table>
                    <thead>
                      <tr><Th>Shop / barber</Th><Th align="right">Requests</Th><Th align="right">No-shows</Th><Th align="right">No-show rate</Th><Th align="right">Cancelled</Th><Th align="right">Cancel rate</Th></tr>
                    </thead>
                    <tbody>
                      {b.places.map((p) => (
                        <Tr key={p.key}>
                          <Td><Link href={placeHref(p.key)} className="font-bold hover:text-[#635BFF]">{p.name}</Link></Td>
                          <Td align="right">{p.total}</Td>
                          <Td align="right">{p.noShow}</Td>
                          <Td align="right">{percent(p.noShowRate)}</Td>
                          <Td align="right">{p.cancelled}</Td>
                          <Td align="right">{percent(p.cancelRate)}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </Scroll>
              )}
            </Panel>
          </>
        )}
      </Canvas>
    </>
  );
}
