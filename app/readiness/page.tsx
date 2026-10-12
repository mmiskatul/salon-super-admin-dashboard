'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BellRing, RotateCw } from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { getReadiness, nudgeListing, STEP_LABELS, type ListingStep, type ReadinessRow } from '@/lib/api/insights';
import { count, since } from '@/lib/format';
import { Badge, Button, Canvas, Empty, Failed, Loading, PageHead, Panel, Stat } from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { percent, StepChecks } from '@/components/insights/Bits';

type Filter = 'hidden' | 'listed' | 'all';

/** Who customers can and can't see yet, what each one is missing, and a nudge to finish. */
export default function ReadinessPage() {
  const data = useApi(getReadiness, [], 'insights-readiness');
  const nudge = useMutation(nudgeListing);
  const [filter, setFilter] = useState<Filter>('hidden');
  const [step, setStep] = useState<ListingStep | 'any'>('any');
  const [sent, setSent] = useState<Record<string, string>>({});

  const rows = useMemo(() => {
    const all = data.data?.rows ?? [];
    return all.filter((r) => (filter === 'all' ? true : filter === 'listed' ? r.listed : !r.listed)).filter((r) => (step === 'any' ? true : r.missing.includes(step)));
  }, [data.data, filter, step]);

  async function send(row: ReadinessRow) {
    const custom = row.missing.length === 0 ? window.prompt(`Message to ${row.name}:`) : null;
    if (row.missing.length === 0 && !custom) return;
    if (row.missing.length > 0 && !window.confirm(`Send ${row.name} a reminder to add: ${row.missing.map((m) => STEP_LABELS[m].toLowerCase()).join(', ')}?`)) return;
    const result = await nudge.mutate(row.kind === 'shop' ? { tenantId: row.id, message: custom ?? undefined } : { barberId: row.id, message: custom ?? undefined });
    if (result) setSent((s) => ({ ...s, [row.id]: result.pushDevices > 0 ? `Sent (in-app + push to ${result.pushDevices} device${result.pushDevices === 1 ? '' : 's'})` : 'Sent in-app (no push device)' }));
  }

  const s = data.data?.summary;
  return (
    <>
      <PageHead
        eyebrow="Insights"
        title="Shop readiness"
        lede="Customers only see a shop or barber once it has a service, upcoming working hours, a map pin and a photo. Here is who is still hidden, what each one is missing, and their bookable time for the next 7 days."
        actions={
          <Button onClick={data.refresh} disabled={data.loading}>
            <RotateCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />
      <Canvas>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Visible to customers" value={s ? `${s.listed} of ${s.total}` : '—'} pending={data.loading} tone="live" />
          <Stat label="Hidden (not complete)" value={count(s?.hidden)} pending={data.loading} tone={s && s.hidden > 0 ? 'signal' : 'plain'} />
          <Stat label="Open slots, next 7 days" value={count(s?.openSlots7d)} sub={`${count(s?.booked7d)} booked`} pending={data.loading} />
          <Stat label="Fill rate, next 7 days" value={percent(s?.fillRate7d)} sub={s ? `${s.noHoursAhead} visible with no hours ahead` : undefined} pending={data.loading} />
        </div>

        {s && (
          <Panel title="What's missing most" note="Shops and barbers missing each step">
            <div className="flex flex-wrap gap-2">
              <Button variant={step === 'any' ? 'primary' : 'outline'} onClick={() => setStep('any')}>Any step</Button>
              {(Object.keys(STEP_LABELS) as ListingStep[]).map((k) => (
                <Button key={k} variant={step === k ? 'primary' : 'outline'} onClick={() => setStep(k)}>
                  No {STEP_LABELS[k].toLowerCase()} · {s.missing[k]}
                </Button>
              ))}
            </div>
          </Panel>
        )}

        <div className="flex flex-wrap gap-2">
          {(['hidden', 'listed', 'all'] as Filter[]).map((f) => (
            <Button key={f} variant={filter === f ? 'primary' : 'outline'} onClick={() => setFilter(f)}>
              {f === 'hidden' ? 'Hidden' : f === 'listed' ? 'Visible' : 'All'}
            </Button>
          ))}
        </div>
        {nudge.error && <Failed message={nudge.error} />}

        <Panel title="Shops and barbers" note="Least complete and longest waiting first" flush>
          {data.loading ? (
            <Loading label="Checking every shop and barber" />
          ) : data.error ? (
            <Failed message={data.error} onRetry={data.refresh} />
          ) : rows.length === 0 ? (
            <Empty title="Nobody here" hint="Try another filter." />
          ) : (
            <Scroll>
              <Table>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Checklist</Th>
                    <Th>Contact</Th>
                    <Th align="right">Signed up</Th>
                    <Th align="right">Next 7 days</Th>
                    <Th align="right">Last booking</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <Tr key={`${r.kind}:${r.id}`}>
                      <Td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Link href={r.kind === 'shop' ? `/shops/${r.id}` : `/barbers/${r.id}`} className="font-bold text-[#1E293B] hover:text-[#635BFF]">{r.name}</Link>
                          <Badge tone="quiet">{r.kind === 'shop' ? 'Shop' : 'Independent'}</Badge>
                          {r.listed ? <Badge tone="live">Visible</Badge> : <Badge tone="signal">Hidden</Badge>}
                          {r.hidden && <Badge tone="warning">{r.hidden}</Badge>}
                        </div>
                        {r.address && <p className="mt-0.5 text-[12px] text-[#94A3B8]">{r.address}</p>}
                      </Td>
                      <Td className="min-w-[290px]"><StepChecks steps={r.steps} /></Td>
                      <Td>
                        <p className="text-[13px] font-semibold">{r.contactName ?? '—'}</p>
                        <p className="text-[12px] text-[#94A3B8]">{r.contactPhone ?? r.contactEmail ?? ''}</p>
                      </Td>
                      <Td align="right" nowrap>{r.daysSinceSignup} days ago</Td>
                      <Td align="right" nowrap>{r.openSlots7d} open · {r.booked7d} booked</Td>
                      <Td align="right" nowrap muted>{r.lastBookingAt ? since(r.lastBookingAt) : 'Never'}</Td>
                      <Td align="right" nowrap>
                        {sent[r.id] ? (
                          <span className="text-[12px] font-bold text-[#16A34A]">{sent[r.id]}</span>
                        ) : r.contactUserId ? (
                          <Button variant={r.missing.length ? 'primary' : 'outline'} onClick={() => void send(r)} disabled={nudge.pending}>
                            <BellRing className="h-4 w-4" /> {r.missing.length ? 'Nudge' : 'Message'}
                          </Button>
                        ) : null}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Scroll>
          )}
        </Panel>
      </Canvas>
    </>
  );
}
