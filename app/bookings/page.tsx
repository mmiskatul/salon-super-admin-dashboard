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
import { Modal } from '@/components/ui/Form';
import { dateTime } from '@/lib/format';

/**
 * One day's bookings across the whole platform.
 *
 * Narrowing to a single day first is what keeps this affordable: `GET /appointments` is per-shop,
 * so an all-time cross-tenant list would pull every appointment the platform has ever taken into
 * the browser, and no operator question needs that.
 */
export default function BookingsPage() {
  const [day, setDay] = useState(() => isoDay());
  const [selected, setSelected] = useState<{ row: Appointment; tenant: Tenant } | null>(null);

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
              className="tabular rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[13px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent font-manrope transition-all shadow-xs"
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
              <p className="rounded-lg border border-signal/25 bg-signal-soft px-4 py-2.5 text-[12px] text-signal">
                {count(failedShops)} shop{failedShops === 1 ? '' : 's'} did not answer, so this day
                may be missing bookings.
              </p>
            )}

            {ordered.length > 0 && (
              <Panel title="The day at a glance">
                <Split
                  height={10}
                  segments={[
                    { key: 'completed', label: 'Completed', value: summary.completed, color: '#22c55e' },
                    { key: 'open', label: 'Open', value: summary.open, color: '#1e293b' },
                    {
                      key: 'cancelled',
                      label: 'Cancelled or no-show',
                      value: summary.cancelled,
                      color: '#ef4444',
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
                        <Th>Barber</Th>
                        <Th>Customer</Th>
                        <Th>Status</Th>
                        <Th align="right">Price</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordered.map(({ row, tenant }) => (
                        <Tr
                          key={row.id}
                          accent={brandColor(tenant.brandColor)}
                          onClick={() => setSelected({ row, tenant })}
                          className="cursor-pointer"
                        >
                          <Td mono>
                            {time(row.startAt)}
                            <span className="text-ink-3">–{time(row.endAt)}</span>
                          </Td>
                          <Td nowrap={false}>
                            <Link
                              href={`/shops/${tenant.id}`}
                              onClick={(e) => e.stopPropagation()}
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
                          <Td muted>{row.staffName ?? '—'}</Td>
                          <Td nowrap={false}>
                            <span className="block truncate">
                              {row.customerName ?? row.guestName ?? (row.customerId ? 'Registered customer' : '—')}
                            </span>
                            <span className="tabular block text-[11px] text-ink-3">
                              {row.customerPhone ?? '—'}
                              {row.isWalkIn && ' · walk-in'}
                            </span>
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

      {selected && (
        <BookingDetailModal
          row={selected.row}
          tenant={selected.tenant}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-rule-soft py-2 last:border-b-0">
      <span className="text-[12px] text-ink-2">{label}</span>
      <span className="text-[13px] font-medium text-ink text-right">{value}</span>
    </div>
  );
}

function BookingDetailModal({
  row,
  tenant,
  onClose,
}: {
  row: Appointment;
  tenant: Tenant;
  onClose: () => void;
}) {
  const customerName = row.customerName ?? row.guestName ?? (row.customerId ? 'Registered customer' : '—');
  return (
    <Modal title="Booking detail" onClose={onClose}>
      <div className="space-y-0.5">
        <DetailRow
          label="Shop"
          value={
            <Link href={`/shops/${tenant.id}`} className="text-primary hover:underline">
              {tenant.name}
            </Link>
          }
        />
        <DetailRow label="Service" value={row.serviceName ?? '—'} />
        <DetailRow label="Barber" value={row.staffName ?? '—'} />
        <DetailRow label="Customer" value={customerName} />
        <DetailRow label="Phone" value={row.customerPhone ?? '—'} />
        <DetailRow label="Booked via" value={row.isWalkIn ? 'Walk-in (desk)' : 'Self-booked'} />
        <DetailRow label="Starts" value={dateTime(row.startAt)} />
        <DetailRow label="Ends" value={dateTime(row.endAt)} />
        {row.durationMinutes != null && <DetailRow label="Duration" value={`${row.durationMinutes} min`} />}
        <DetailRow label="Status" value={<BookingStatus status={row.status} />} />
        <DetailRow label="Price" value={money(row.price)} />
        {row.couponCode && <DetailRow label="Coupon" value={row.couponCode} />}
        {row.discountAmount != null && Number(row.discountAmount) > 0 && (
          <DetailRow label="Discount" value={money(row.discountAmount)} />
        )}
        {row.cancellationReason && <DetailRow label="Cancellation reason" value={row.cancellationReason} />}
        {row.cancelledBy && <DetailRow label="Cancelled by" value={row.cancelledBy} />}
        <DetailRow label="Recorded" value={dateTime(row.createdAt)} />
      </div>
    </Modal>
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
