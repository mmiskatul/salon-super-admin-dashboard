'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import type { Tenant } from '@/lib/api/tenants';
import { listAppointments, type Appointment } from '@/lib/api/bookings';
import { useTenantSweep } from '@/lib/useTenantSweep';
import { brandColor, count, isoDay, money, time } from '@/lib/format';
import {
  Badge,
  Button,
  Canvas,
  Empty,
  Failed,
  Loading,
  PageHead,
  Panel,
  Stat,
} from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { Split } from '@/components/chart/Chart';
import Mark from '@/components/ui/Mark';

/**
 * One day's bookings across the whole platform.
 *
 * Narrowing to a single day first is what keeps this affordable: `GET /appointments` is per-shop,
 * so an all-time cross-tenant list would pull every appointment the platform has ever taken into
 * the browser, and no operator question needs that.
 */
export default function BookingsPage() {
  const [day, setDay] = useState(() => isoDay());

  const fetcher = useCallback(
    (tenant: Tenant) => listAppointments(tenant.id, day),
    [day],
  );
  const { tenants, rows, loading, error, failedShops, reload } = useTenantSweep<Appointment>(
    fetcher,
    [day],
  );

  const ordered = useMemo(
    () =>
      [...rows].sort(
        (a, b) => new Date(a.row.startAt).getTime() - new Date(b.row.startAt).getTime(),
      ),
    [rows],
  );

  const summary = useMemo(() => {
    let completed = 0;
    let cancelled = 0;
    let open = 0;
    let value = 0;
    for (const { row } of rows) {
      const status = String(row.status).toUpperCase();
      if (status === 'COMPLETED') completed += 1;
      else if (status === 'CANCELLED' || status === 'NO_SHOW') cancelled += 1;
      else open += 1;
      if (status !== 'CANCELLED' && status !== 'NO_SHOW') value += Number(row.price ?? 0);
    }
    return { completed, cancelled, open, value, shops: new Set(rows.map((r) => r.tenant.id)).size };
  }, [rows]);

  function shiftDay(days: number) {
    const next = new Date(`${day}T12:00:00`);
    next.setDate(next.getDate() + days);
    setDay(isoDay(next));
  }

  const isToday = day === isoDay();

  return (
    <>
      <PageHead
        eyebrow="Activity"
        title="Bookings"
        lede="Every booking on the platform for one day, gathered from each shop in turn."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => shiftDay(-1)} title="Previous day">
              <ChevronLeft size={13} />
            </Button>
            <input
              type="date"
              value={day}
              onChange={(e) => e.target.value && setDay(e.target.value)}
              aria-label="Day"
              className="tabular rounded-[3px] border border-rule bg-surface px-2.5 py-[6px] text-[12px] focus:border-ink focus:outline-none"
            />
            <Button onClick={() => shiftDay(1)} title="Next day">
              <ChevronRight size={13} />
            </Button>
            {!isToday && <Button onClick={() => setDay(isoDay())}>Today</Button>}
            <Button onClick={reload} disabled={loading}>
              <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        }
      />

      <Canvas>
        {error && <Failed message={error} onRetry={reload} />}
        {loading && !error && <Loading label={`Reading ${tenants?.length ?? 0} shops for ${day}`} />}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-4">
              <Stat
                label="Bookings"
                value={count(ordered.length)}
                sub={`${count(summary.shops)} shops active`}
              />
              <Stat label="Completed" value={count(summary.completed)} tone="live" />
              <Stat
                label="Cancelled or no-show"
                value={count(summary.cancelled)}
                tone={summary.cancelled > 0 ? 'signal' : 'plain'}
              />
              <Stat label="Booked value" value={money(summary.value)} sub="Cancellations excluded" />
            </div>

            {failedShops > 0 && (
              <p className="border border-signal/25 bg-signal-soft px-4 py-2.5 text-[12px] text-signal">
                {count(failedShops)} shop{failedShops === 1 ? '' : 's'} did not answer, so this day
                may be missing bookings.
              </p>
            )}

            {ordered.length > 0 && (
              <Panel title="The day at a glance">
                <Split
                  height={10}
                  segments={[
                    { key: 'completed', label: 'Completed', value: summary.completed, color: '#186a50' },
                    { key: 'open', label: 'Open', value: summary.open, color: '#15171b' },
                    {
                      key: 'cancelled',
                      label: 'Cancelled or no-show',
                      value: summary.cancelled,
                      color: '#b23a0e',
                    },
                  ]}
                />
              </Panel>
            )}

            <Panel flush title={`Bookings on ${day}`}>
              {ordered.length === 0 ? (
                <div className="p-4">
                  <Empty
                    title="No bookings on this day"
                    hint="Pick another date, or check the Shops screen to see which shops are set up to take bookings at all."
                  />
                </div>
              ) : (
                <Scroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th width={110}>Time</Th>
                        <Th>Shop</Th>
                        <Th>Service</Th>
                        <Th>Customer</Th>
                        <Th>Status</Th>
                        <Th align="right">Price</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordered.map(({ row, tenant }) => (
                        <Tr key={row.id} accent={brandColor(tenant.brandColor)}>
                          <Td mono>
                            {time(row.startAt)}
                            <span className="text-ink-3">–{time(row.endAt)}</span>
                          </Td>
                          <Td nowrap={false}>
                            <Link
                              href={`/shops/${tenant.id}`}
                              className="flex items-center gap-2 hover:opacity-70"
                            >
                              <Mark
                                name={tenant.name}
                                logoUrl={tenant.logoUrl}
                                color={tenant.brandColor}
                                size={20}
                              />
                              <span className="truncate">{tenant.name}</span>
                            </Link>
                          </Td>
                          <Td muted>{row.serviceName ?? '—'}</Td>
                          <Td muted>
                            {row.guestName ?? (row.customerId ? 'Registered customer' : '—')}
                            {row.isWalkIn && <span className="text-ink-3"> · walk-in</span>}
                          </Td>
                          <Td>
                            <BookingStatus status={row.status} />
                          </Td>
                          <Td align="right" mono>{money(row.price)}</Td>
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

function BookingStatus({ status }: { status: string }) {
  const value = String(status ?? '').toUpperCase();
  if (value === 'COMPLETED' || value === 'CONFIRMED') {
    return <Badge tone="live">{value.toLowerCase()}</Badge>;
  }
  if (value === 'CANCELLED' || value === 'NO_SHOW') {
    return <Badge tone="signal">{value.toLowerCase().replace('_', ' ')}</Badge>;
  }
  return <Badge>{value.toLowerCase().replace('_', ' ')}</Badge>;
}
