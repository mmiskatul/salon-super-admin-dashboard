'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RotateCw, Search, X } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { CANCEL_GROUP_LABELS, getBookingBoard, type BoardDays, type BoardRow, type CancelGroup } from '@/lib/api/insights';
import { placeHref } from '@/lib/placeHref';
import { bookingDateTime, count, dateTime, money } from '@/lib/format';
import { Badge, Button, Empty, Failed, Loading, Panel, Stat } from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Form';
import { Bars, Donut, OUTCOME_COLORS, OutcomeBar, percent, StackedColumns } from '@/components/insights/Bits';

const STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Waiting to be accepted',
  CONFIRMED: 'Accepted',
  IN_PROGRESS: 'In the chair',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
};
const STATUS_TONE: Record<string, 'live' | 'signal' | 'warning' | 'primary' | 'plain'> = {
  COMPLETED: 'live',
  CANCELLED: 'warning',
  NO_SHOW: 'signal',
  PENDING: 'plain',
  CONFIRMED: 'primary',
  IN_PROGRESS: 'primary',
};
const DAY_OPTIONS: { value: BoardDays; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '1 year' },
  { value: 0, label: 'All time' },
];

function hoursLabel(h: number | null): string {
  if (h === null) return '';
  if (h < 0) return `${Math.abs(h)} h after the start`;
  if (h < 48) return `${h} h before`;
  return `${Math.round(h / 24)} days before`;
}

function CancelCell({ row }: { row: BoardRow }) {
  const c = row.cancellation;
  if (!c) return <span className="text-[#94A3B8]">—</span>;
  const who = row.status === 'NO_SHOW' ? 'Marked no-show' : c.group ? CANCEL_GROUP_LABELS[c.group] : c.role ?? 'Unknown';
  return (
    <div className="space-y-0.5 text-[12px]">
      <div className="flex flex-wrap items-center gap-1.5">
        <b>{who}</b>
        {c.late && <Badge tone="signal">Late</Badge>}
      </div>
      {c.by && (
        <div>
          by <Link href={`/users/${c.by.id}`} className="font-semibold hover:text-[#635BFF]">{c.by.name ?? c.by.email}</Link>
          <span className="text-[#94A3B8]"> · {c.by.role.toLowerCase().replace('_', ' ')}</span>
        </div>
      )}
      {row.timeline.calledOffAt && (
        <div className="text-[#64748B]">
          {dateTime(row.timeline.calledOffAt)}
          {!row.timeline.calledOffAtExact && <span className="text-[#94A3B8]"> (approx.)</span>}
          {c.hoursBeforeStart !== null && <span className="text-[#94A3B8]"> · {hoursLabel(c.hoursBeforeStart)}</span>}
        </div>
      )}
      {c.reason && <div className="text-[#475569]">&ldquo;{c.reason}&rdquo;</div>}
    </div>
  );
}

function Timeline({ row }: { row: BoardRow }) {
  const steps = [
    { label: 'Requested', at: row.timeline.requestedAt },
    { label: 'Accepted', at: row.timeline.acceptedAt },
    { label: 'Started', at: row.timeline.startedAt },
    { label: 'Completed', at: row.timeline.completedAt },
    { label: row.status === 'NO_SHOW' ? 'Marked no-show' : 'Cancelled', at: row.timeline.calledOffAt },
  ].filter((s) => s.at);
  return (
    <ol className="space-y-2 border-l-2 border-[#E2E8F0] pl-4 text-[13px]">
      {steps.map((s) => (
        <li key={s.label} className="relative">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#635BFF]" aria-hidden />
          <b>{s.label}</b> <span className="text-[#64748B]">{dateTime(s.at)}</span>
        </li>
      ))}
      <li className="relative">
        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#94A3B8]" aria-hidden />
        <b>Booked for</b> <span className="text-[#64748B]">{bookingDateTime(row.startAt)}</span>
      </li>
    </ol>
  );
}

/** Bookings analytics and every booking: who, where, when, what happened, who cancelled and why. */
export default function BookingsBoard({ initialCancelledBy }: { initialCancelledBy?: CancelGroup }) {
  const [days, setDays] = useState<BoardDays>(30);
  const [status, setStatus] = useState('');
  const [cancelledBy, setCancelledBy] = useState<CancelGroup | ''>(initialCancelledBy ?? '');
  const [place, setPlace] = useState('');
  const [source, setSource] = useState<'' | 'app' | 'walkin'>('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<BoardRow | null>(null);

  // Search waits for a pause in typing.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const data = useApi(
    () => getBookingBoard({ days, status: status || undefined, cancelledBy: cancelledBy || undefined, place: place || undefined, source: source || undefined, q, page, pageSize: 50 }),
    [days, status, cancelledBy, place, source, q, page],
    'bookings-board',
  );
  const b = data.data;
  const filtered = !!(status || cancelledBy || place || source || q);
  const reset = () => {
    setStatus('');
    setCancelledBy('');
    setPlace('');
    setSource('');
    setSearch('');
    setQ('');
    setPage(1);
  };
  const choose = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const selectClass = 'w-full max-w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] font-semibold text-[#1E293B] sm:w-auto';
  return (
    <div className="space-y-5">
      {/* Filters */}
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-0.5" role="group" aria-label="Period">
            {DAY_OPTIONS.map((d) => (
              <button key={d.value} type="button" aria-pressed={days === d.value} onClick={() => choose(setDays)(d.value)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-bold ${days === d.value ? 'bg-[#635BFF] text-white' : 'text-[#64748B] hover:text-[#1E293B]'}`}>
                {d.label}
              </button>
            ))}
          </div>
          <select aria-label="Status" className={selectClass} value={status} onChange={(e) => choose(setStatus)(e.target.value)}>
            <option value="">Every status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <select aria-label="Who cancelled" className={selectClass} value={cancelledBy} onChange={(e) => choose(setCancelledBy)(e.target.value as CancelGroup | '')}>
            <option value="">Cancelled by anyone</option>
            {(Object.keys(CANCEL_GROUP_LABELS) as CancelGroup[]).map((g) => <option key={g} value={g}>Cancelled by: {CANCEL_GROUP_LABELS[g]}</option>)}
          </select>
          <select aria-label="Shop or barber" className={selectClass} value={place} onChange={(e) => choose(setPlace)(e.target.value)}>
            <option value="">Every shop and barber</option>
            {(b?.places ?? []).map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
            {place && !(b?.places ?? []).some((p) => p.key === place) && <option value={place}>Selected place</option>}
          </select>
          <select aria-label="Booked how" className={selectClass} value={source} onChange={(e) => choose(setSource)(e.target.value as '' | 'app' | 'walkin')}>
            <option value="">App and walk-ins</option>
            <option value="app">Booked in the app</option>
            <option value="walkin">Walk-ins</option>
          </select>
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Search bookings</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Customer, phone, shop, service, reason or reference"
              className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 pl-9 pr-3 text-[13px]" />
          </label>
          {filtered && <Button variant="outline" onClick={reset}><X className="h-4 w-4" /> Clear filters</Button>}
          <Button onClick={data.refresh} disabled={data.loading}><RotateCw className="h-4 w-4" /> Refresh</Button>
        </div>
        <p className="mt-2 text-[12px] font-semibold text-[#94A3B8]">
          {days ? `Visits from ${days} days ago onwards, upcoming ones included.` : 'Every booking ever made.'} Charts follow the period, shop, source and search; the table follows every filter.
        </p>
      </Panel>

      {data.error ? (
        <Failed message={data.error} onRetry={data.refresh} />
      ) : !b ? (
        <Loading label="Reading bookings" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Bookings" value={count(b.summary.total)} sub={`${b.summary.walkIns} walk-ins`} />
            <Stat label="Completed" value={count(b.summary.completed)} sub={percent(b.summary.completionRate)} tone="live" />
            <Stat label="Open / upcoming" value={count(b.summary.open)} />
            <Stat label="Cancelled" value={count(b.summary.cancelled)} tone={b.summary.cancelled ? 'signal' : 'plain'} />
            <Stat label="No-show" value={count(b.summary.noShow)} tone={b.summary.noShow ? 'signal' : 'plain'} />
            <Stat label="Cancel + no-show rate" value={percent(b.summary.cancelRate)} />
            <Stat label="Late cancellations" value={count(b.summary.lateCancels)} sub="Within 24 h of the visit" />
            <Stat label="Cash (completed)" value={money(b.summary.cashCompleted)} tone="live" />
          </div>

          {/* Graph 1 + 2 */}
          <div className="grid gap-5 lg:grid-cols-3">
            <Panel title="Bookings by visit day" note="What happened to each day's bookings" className="lg:col-span-2">
              <StackedColumns
                points={b.byDay.map(({ day, ...values }) => ({ label: day.slice(5), values }))}
                series={[
                  { key: 'completed', label: 'Completed', color: OUTCOME_COLORS.completed },
                  { key: 'open', label: 'Open / upcoming', color: OUTCOME_COLORS.open },
                  { key: 'cancelled', label: 'Cancelled', color: OUTCOME_COLORS.cancelled },
                  { key: 'noShow', label: 'No-show', color: OUTCOME_COLORS.noShow },
                ]}
              />
            </Panel>
            <Panel title="Completed vs cancelled" note="Share of every outcome">
              <Donut
                centre={count(b.summary.total)}
                parts={[
                  { label: 'Completed', value: b.summary.completed, color: OUTCOME_COLORS.completed },
                  { label: 'Open / upcoming', value: b.summary.open, color: OUTCOME_COLORS.open },
                  { label: 'Cancelled', value: b.summary.cancelled, color: OUTCOME_COLORS.cancelled },
                  { label: 'No-show', value: b.summary.noShow, color: OUTCOME_COLORS.noShow },
                ]}
              />
            </Panel>
          </div>

          {/* Graph 3: cancellations */}
          <div className="grid gap-5 lg:grid-cols-3">
            <Panel title="Who cancelled" note={`${b.summary.cancelled} cancellations`}>
              <Bars rows={b.cancellations.byWho.map((w) => ({ label: CANCEL_GROUP_LABELS[w.key], value: w.count, color: w.key === 'CUSTOMER' ? '#F59E0B' : w.key === 'SHOP' ? '#FB7185' : w.key === 'SYSTEM' ? '#94A3B8' : '#635BFF' }))} />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {b.cancellations.byWho.filter((w) => w.count).map((w) => (
                  <button key={w.key} type="button" onClick={() => choose(setCancelledBy)(w.key)} className="rounded-md border border-[#E2E8F0] px-2 py-1 text-[11px] font-bold text-[#635BFF] hover:bg-[#EEF2FF]">
                    Show {CANCEL_GROUP_LABELS[w.key].toLowerCase()} cancellations
                  </button>
                ))}
              </div>
            </Panel>
            <Panel title="When they cancelled" note="How long before the booked time">
              <Bars rows={b.cancellations.leadTime.map((l) => ({ label: l.label, value: l.count, color: l.key === 'after' || l.key === 'lt2h' ? '#E11D48' : l.key === 'lt24h' ? '#F59E0B' : '#16A34A' }))} />
            </Panel>
            <Panel title="Why they cancelled" note="Reasons given">
              <Bars rows={b.cancellations.reasons.map((r) => ({ label: r.key, value: r.count, color: '#F59E0B' }))} />
            </Panel>
          </div>

          {/* Graph 4: weekdays */}
          <Panel title="By day of the week" note="Completed, open, cancelled and no-show by the weekday of the visit">
            <StackedColumns
              height={140}
              points={b.weekdays.map(({ name, ...values }) => ({ label: name, values }))}
              series={[
                { key: 'completed', label: 'Completed', color: OUTCOME_COLORS.completed },
                { key: 'open', label: 'Open / upcoming', color: OUTCOME_COLORS.open },
                { key: 'cancelled', label: 'Cancelled', color: OUTCOME_COLORS.cancelled },
                { key: 'noShow', label: 'No-show', color: OUTCOME_COLORS.noShow },
              ]}
            />
          </Panel>

          {/* Comparisons */}
          <div className="grid gap-5 xl:grid-cols-5">
            <Panel title="Shops and barbers compared" note="Completed vs cancelled vs no-show for each" flush className="xl:col-span-3">
              {b.places.length === 0 ? (
                <Empty title="No bookings" />
              ) : (
                <Scroll>
                  <Table>
                    <thead><tr><Th>Shop / barber</Th><Th>Outcomes</Th><Th align="right">Bookings</Th><Th align="right">Done</Th><Th align="right">Cancelled</Th><Th align="right">No-show</Th><Th align="right">Cancel rate</Th><Th align="right">Cash</Th></tr></thead>
                    <tbody>
                      {b.places.map((p) => (
                        <Tr key={p.key}>
                          <Td><Link href={placeHref(p.key)} className="font-bold hover:text-[#635BFF]">{p.name}</Link></Td>
                          <Td className="min-w-[140px]"><OutcomeBar completed={p.completed} cancelled={p.cancelled} noShow={p.noShow} open={p.open} /></Td>
                          <Td align="right">{p.total}</Td>
                          <Td align="right">{p.completed}</Td>
                          <Td align="right">{p.cancelled}</Td>
                          <Td align="right">{p.noShow}</Td>
                          <Td align="right">{percent(p.cancelRate)}</Td>
                          <Td align="right" nowrap>{money(p.cash)}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </Scroll>
              )}
            </Panel>
            <Panel title="Services compared" note="Most booked, with how often they are called off" className="xl:col-span-2">
              <Bars rows={b.services.map((s) => ({ label: s.name, value: s.total, sub: `${s.completed} done · ${percent(s.cancelRate)} cancelled`, color: '#0EA5E9' }))} />
            </Panel>
          </div>

          {/* Every booking */}
          <Panel title={`All bookings (${count(b.table.total)})`} note={`Page ${b.table.page} of ${b.table.pages} · newest visit first · tap Details for the full timeline`} flush>
            {b.table.rows.length === 0 ? (
              <Empty title="No bookings match" hint={filtered ? 'Try clearing the filters.' : undefined} />
            ) : (
              <Scroll>
                <Table>
                  <thead>
                    <tr><Th>Ref</Th><Th>Visit</Th><Th>Where</Th><Th>Customer</Th><Th>Service</Th><Th>Status</Th><Th>Who cancelled, when, why</Th><Th align="right">Price</Th><Th /></tr>
                  </thead>
                  <tbody>
                    {b.table.rows.map((r) => (
                      <Tr key={r.id}>
                        <Td mono>{r.reference}</Td>
                        <Td nowrap>{bookingDateTime(r.startAt)}</Td>
                        <Td>
                          <Link href={placeHref(r.place.key)} className="font-bold hover:text-[#635BFF]">{r.place.name}</Link>
                          <p className="text-[12px] text-[#94A3B8]">{r.barber.name ? `Barber: ${r.barber.name}` : r.needsAssignment ? 'Any barber (not assigned yet)' : ''}</p>
                        </Td>
                        <Td>
                          {r.customer.id ? <Link href={`/users/${r.customer.id}`} className="font-semibold hover:text-[#635BFF]">{r.customer.name ?? r.customer.email}</Link> : <span className="font-semibold">{r.customer.name}</span>}
                          <p className="text-[12px] text-[#94A3B8]">{r.customer.phone ?? ''}{r.customer.guest ? ' · walk-in guest' : ''}</p>
                        </Td>
                        <Td>{r.service ?? '—'}{r.durationMinutes ? <p className="text-[12px] text-[#94A3B8]">{r.durationMinutes} min</p> : null}</Td>
                        <Td>
                          <div className="flex flex-wrap gap-1">
                            <Badge tone={STATUS_TONE[r.status] ?? 'plain'}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
                            {r.source === 'walkin' && <Badge tone="quiet">Walk-in</Badge>}
                          </div>
                        </Td>
                        <Td className="min-w-[220px]"><CancelCell row={r} /></Td>
                        <Td align="right" nowrap>
                          {money(r.price)}
                          {r.discount > 0 && <p className="text-[12px] text-[#16A34A]">-{money(r.discount)}{r.couponCode ? ` (${r.couponCode})` : ''}</p>}
                        </Td>
                        <Td align="right"><Button variant="outline" onClick={() => setOpen(r)}>Details</Button></Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Scroll>
            )}
            {b.table.pages > 1 && (
              <div className="flex items-center justify-between border-t border-[#E2E8F0] px-5 py-3 text-[13px]">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <span className="font-semibold text-[#64748B]">Page {b.table.page} of {b.table.pages}</span>
                <Button variant="outline" disabled={page >= b.table.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </Panel>
        </>
      )}

      {open && (
        <Modal title={`Booking ${open.reference}`} onClose={() => setOpen(null)}>
          <div className="space-y-4 text-[13px]">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={STATUS_TONE[open.status] ?? 'plain'}>{STATUS_LABEL[open.status] ?? open.status}</Badge>
              <Badge tone="quiet">{open.source === 'walkin' ? 'Walk-in' : 'Booked in the app'}</Badge>
              {open.rescheduledFrom && <Badge tone="warning">Rescheduled from {bookingDateTime(open.rescheduledFrom)}</Badge>}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-[#64748B]">Where</dt><dd className="font-semibold">{open.place.name} ({open.place.kind === 'shop' ? 'shop' : 'independent barber'})</dd>
              <dt className="text-[#64748B]">Barber</dt><dd className="font-semibold">{open.barber.name ?? (open.needsAssignment ? 'Not assigned yet' : '—')}</dd>
              <dt className="text-[#64748B]">Customer</dt><dd className="font-semibold">{open.customer.name ?? '—'}{open.customer.phone ? ` · ${open.customer.phone}` : ''}</dd>
              <dt className="text-[#64748B]">Service</dt><dd className="font-semibold">{open.service ?? '—'}{open.durationMinutes ? ` · ${open.durationMinutes} min` : ''}</dd>
              <dt className="text-[#64748B]">Price</dt><dd className="font-semibold">{money(open.price)}{open.discount > 0 ? ` (discount ${money(open.discount)}${open.couponCode ? `, ${open.couponCode}` : ''})` : ''}</dd>
              <dt className="text-[#64748B]">Booking id</dt><dd className="break-all font-mono text-[12px]">{open.id}</dd>
            </dl>
            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#94A3B8]">Timeline</p>
              <Timeline row={open} />
            </div>
            {open.cancellation && (
              <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3">
                <CancelCell row={open} />
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
