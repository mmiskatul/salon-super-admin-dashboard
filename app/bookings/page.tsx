'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  Phone,
  RotateCw,
  Scissors,
  Search,
  Store,
  User,
  X,
} from 'lucide-react';
import { listTenants, type Tenant } from '@/lib/api/tenants';
import {
  cancelAppointment,
  listAppointments,
  updateAppointmentStatus,
  type Appointment,
} from '@/lib/api/bookings';
import { brandColor, count, dateTime, isoDay, money, bookingDateTime, bookingTime } from '@/lib/format';
import { useApi } from '@/lib/useApi';
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

export default function BookingsPage() {
  const [day, setDay] = useState(() => isoDay());
  const [useDateFilter, setUseDateFilter] = useState(true);
  const [shopFilter, setShopFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [selected, setSelected] = useState<{
    row: Appointment;
    tenant?: Tenant;
  } | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Load salon roster for dropdown and tenant metadata lookup with TanStack caching
  const tenantsApi = useApi(() => listTenants(), []);
  const tenants = tenantsApi.data ?? [];

  // Load appointments with TanStack caching
  const bookingsApi = useApi(
    async () => {
      try {
        const data = await listAppointments({
          tenantId: shopFilter !== 'ALL' ? shopFilter : undefined,
          date: useDateFilter ? day : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        });
        return data ?? [];
      } catch (err) {
        // Fallback: if single-query failed because backend is on legacy per-tenant mode
        if (shopFilter === 'ALL' && tenants.length > 0) {
          const results = await Promise.allSettled(
            tenants.map((t) => listAppointments(t.id, useDateFilter ? day : undefined)),
          );
          const collected: Appointment[] = [];
          for (const res of results) {
            if (res.status === 'fulfilled' && Array.isArray(res.value)) {
              collected.push(...res.value);
            }
          }
          return collected;
        }
        throw err;
      }
    },
    [shopFilter, useDateFilter, day, statusFilter, tenants],
  );

  const appointments = bookingsApi.data ?? [];
  const loading = bookingsApi.loading;
  const error = bookingsApi.error;
  const fetchBookings = bookingsApi.refresh;
  const setAppointments = (updater: Appointment[] | ((prev: Appointment[]) => Appointment[])) => {
    bookingsApi.setData(typeof updater === 'function' ? updater(appointments) : updater);
  };

  const tenantMap = useMemo(() => {
    const map = new Map<string, Tenant>();
    for (const t of tenants) {
      map.set(t.id, t);
    }
    return map;
  }, [tenants]);

  const availableTenants = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const seen = new Set<string>();
    for (const t of tenants) {
      if (t?.id && !seen.has(t.id)) {
        seen.add(t.id);
        list.push({ id: t.id, name: t.name });
      }
    }
    // Also include any salons present on the appointments list
    for (const a of appointments) {
      if (a.tenantId && !seen.has(a.tenantId)) {
        seen.add(a.tenantId);
        list.push({
          id: a.tenantId,
          name: a.tenantName || 'Salon ' + a.tenantId.slice(0, 6),
        });
      }
    }
    return list;
  }, [tenants, appointments]);

  function shiftDay(days: number) {
    const next = new Date(`${day}T12:00:00`);
    next.setDate(next.getDate() + days);
    setDay(isoDay(next));
  }

  const isToday = day === isoDay();

  // Search and client-side filtering
  const filtered = useMemo(() => {
    let result = appointments;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((a) => {
        const tenant = a.tenantId ? tenantMap.get(a.tenantId) : undefined;
        const tenantName = (a.tenantName || tenant?.name || '').toLowerCase();
        const customer = (a.customerName || a.guestName || '').toLowerCase();
        const phone = (a.customerPhone || a.guestPhone || '').toLowerCase();
        const staff = (a.staffName || '').toLowerCase();
        const service = (a.serviceName || '').toLowerCase();
        const id = a.id.toLowerCase();
        return (
          customer.includes(q) ||
          phone.includes(q) ||
          staff.includes(q) ||
          service.includes(q) ||
          tenantName.includes(q) ||
          id.includes(q)
        );
      });
    }

    return [...result].sort(
      (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
    );
  }, [appointments, searchQuery, tenantMap]);

  // Overall counts and summary metrics
  const summary = useMemo(() => {
    let completed = 0;
    let cancelled = 0;
    let open = 0;
    let value = 0;
    const activeShops = new Set<string>();

    for (const a of appointments) {
      const status = String(a.status).toUpperCase();
      if (a.tenantId) activeShops.add(a.tenantId);

      if (status === 'COMPLETED') {
        completed += 1;
        value += Number(a.price ?? 0);
      } else if (status === 'CANCELLED' || status === 'NO_SHOW') {
        cancelled += 1;
      } else {
        open += 1;
        value += Number(a.price ?? 0);
      }
    }

    return {
      completed,
      cancelled,
      open,
      value,
      shops: activeShops.size,
      total: appointments.length,
    };
  }, [appointments]);

  const handleBookingUpdated = (updatedBooking: Appointment) => {
    setAppointments((prev) =>
      prev.map((item) => (item.id === updatedBooking.id ? updatedBooking : item)),
    );
    setSelected(null);
    setActionSuccess(`Booking ${updatedBooking.id.slice(0, 8)} updated successfully`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  return (
    <>
      <PageHead
        eyebrow="Platform Operations"
        title="Bookings"
        lede="Platform-wide booking management and live operational monitor. Inspect bookings, search by customer or salon, and resolve disputes or status changes."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setUseDateFilter(true)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  useDateFilter
                    ? 'bg-[#635BFF] text-white'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                By Date
              </button>
              <button
                type="button"
                onClick={() => setUseDateFilter(false)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  !useDateFilter
                    ? 'bg-[#635BFF] text-white'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                All Records
              </button>
            </div>

            {useDateFilter && (
              <div className="flex items-center gap-1.5">
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
              </div>
            )}

            <Button onClick={fetchBookings} disabled={loading}>
              <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        }
      />

      <Canvas>
        {actionSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 animate-in fade-in duration-200">
            <CheckCircle size={16} className="text-emerald-600 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
        )}

        {/* Global KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat
            label={useDateFilter ? `Bookings (${day})` : 'Total Bookings'}
            value={count(summary.total)}
            sub={`${count(summary.shops)} shops represented`}
          />
          <Stat label="Completed" value={count(summary.completed)} tone="live" />
          <Stat
            label="In Queue / Open"
            value={count(summary.open)}
            sub="Active reservations"
          />
          <Stat
            label="Cancelled / No-Show"
            value={count(summary.cancelled)}
            tone={summary.cancelled > 0 ? 'signal' : 'plain'}
          />
        </div>

        {summary.total > 0 && (
          <Panel title="Breakdown at a glance">
            <Split
              height={10}
              segments={[
                { key: 'completed', label: 'Completed', value: summary.completed, color: '#22c55e' },
                { key: 'open', label: 'Open / Pending', value: summary.open, color: '#635bff' },
                {
                  key: 'cancelled',
                  label: 'Cancelled / No-show',
                  value: summary.cancelled,
                  color: '#ef4444',
                },
              ]}
            />
          </Panel>
        )}

        {/* Search & Filters Controls */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-xs">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, phone, barber, service, salon, or booking ID..."
              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8F9FE] pl-9 pr-8 py-2 text-[13px] text-[#1E293B] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1E293B]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Salon selector */}
            <div className="flex items-center gap-1.5">
              <Store size={14} className="text-[#64748B]" />
              <select
                value={shopFilter}
                onChange={(e) => setShopFilter(e.target.value)}
                className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[13px] font-medium text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#635BFF] transition-all"
              >
                <option value="ALL">All Salons ({availableTenants.length})</option>
                {availableTenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status selector */}
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-[#64748B]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[13px] font-medium text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#635BFF] transition-all"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="IN_QUEUE">In Queue</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error / Loading State */}
        {error && <Failed message={error} onRetry={fetchBookings} />}
        {loading && !appointments.length && !error && (
          <Loading label={useDateFilter ? `Loading bookings for ${day}...` : 'Loading all bookings...'} />
        )}

        {/* Data Table */}
        {(appointments.length > 0 || (!loading && !error)) && (
          <Panel
            flush
            title={
              useDateFilter
                ? `Bookings on ${day} (${filtered.length})`
                : `All Bookings (${filtered.length})`
            }
            note={
              searchQuery
                ? `Filtered by "${searchQuery}"`
                : shopFilter !== 'ALL'
                ? `Filtered by selected salon`
                : undefined
            }
          >
            {filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Empty
                  title="No bookings match criteria"
                  hint={
                    searchQuery || statusFilter !== 'ALL' || shopFilter !== 'ALL'
                      ? 'Try clearing the search or relaxing the filter dropdowns.'
                      : 'Pick another date or check the Shops screen to verify salon activity.'
                  }
                />
                {(searchQuery || statusFilter !== 'ALL' || shopFilter !== 'ALL') && (
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('ALL');
                        setShopFilter('ALL');
                      }}
                    >
                      Reset All Filters
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Scroll>
                <Table>
                  <thead>
                    <tr>
                      <Th width={130}>Time / Date</Th>
                      <Th>Salon</Th>
                      <Th>Service</Th>
                      <Th>Barber</Th>
                      <Th>Customer</Th>
                      <Th>Status</Th>
                      <Th align="right">Price</Th>
                      <Th align="right" width={80}>Action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => {
                      const tenant = row.tenantId ? tenantMap.get(row.tenantId) : undefined;
                      const tenantName = row.tenantName || tenant?.name || 'Independent';
                      const tenantBrand = row.tenantBrandColor || tenant?.brandColor || '#635BFF';
                      const tenantLogo = row.tenantLogoUrl || tenant?.logoUrl || null;

                      return (
                        <Tr
                          key={row.id}
                          accent={brandColor(tenantBrand)}
                          onClick={() => setSelected({ row, tenant })}
                          className="cursor-pointer hover:bg-[#F8F9FE] transition-colors"
                        >
                          <Td mono>
                            <div className="font-semibold text-[#1E293B]">
                              {bookingTime(row.startAt)}
                              <span className="text-[#94A3B8] font-normal"> – {bookingTime(row.endAt)}</span>
                            </div>
                            {!useDateFilter && (
                              <div className="text-[11px] text-[#64748B]">
                                {row.startAt.slice(0, 10)}
                              </div>
                            )}
                          </Td>
                          <Td nowrap={false}>
                            {row.tenantId ? (
                              <Link
                                href={`/shops/${row.tenantId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                              >
                                <Mark
                                  name={tenantName}
                                  logoUrl={tenantLogo}
                                  color={tenantBrand}
                                  size={22}
                                />
                                <span className="truncate font-medium text-[#1E293B]">
                                  {tenantName}
                                </span>
                              </Link>
                            ) : (
                              <span className="text-[#64748B] text-xs">Platform</span>
                            )}
                          </Td>
                          <Td muted>
                            <span className="font-medium text-[#1E293B]">
                              {row.serviceName ?? '—'}
                            </span>
                            {row.durationMinutes && (
                              <span className="block text-[11px] text-[#94A3B8]">
                                {row.durationMinutes} min
                              </span>
                            )}
                          </Td>
                          <Td muted>{row.staffName ?? '—'}</Td>
                          <Td nowrap={false}>
                            <span className="block truncate font-medium text-[#1E293B]">
                              {row.customerName ??
                                row.guestName ??
                                (row.customerId ? 'Registered User' : 'Walk-in Guest')}
                            </span>
                            <span className="tabular block text-[11px] text-[#64748B]">
                              {row.customerPhone ?? row.guestPhone ?? 'No phone recorded'}
                              {row.isWalkIn && ' · Walk-in'}
                            </span>
                          </Td>
                          <Td>
                            <BookingStatusBadge status={row.status} />
                          </Td>
                          <Td align="right" mono>
                            <span className="font-bold text-[#1E293B]">{money(row.price)}</span>
                            {row.couponCode && (
                              <span className="block text-[10px] text-emerald-600 font-semibold">
                                {row.couponCode}
                              </span>
                            )}
                          </Td>
                          <Td align="right">
                            {/* A real button, so the booking can be opened from the keyboard too (the
                                row click alone was mouse-only). */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelected({ row, tenant });
                              }}
                              className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-md border border-[#E2E8F0] bg-white text-[#635BFF] shadow-2xs hover:bg-[#635BFF] hover:text-white focus-visible:outline-2 focus-visible:outline-[#635BFF] transition-all"
                            >
                              Manage
                            </button>
                          </Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Scroll>
            )}
          </Panel>
        )}
      </Canvas>

      {/* Booking Details & Actions Modal */}
      {selected && (
        <BookingDetailModal
          row={selected.row}
          tenant={selected.tenant}
          onClose={() => setSelected(null)}
          onUpdated={handleBookingUpdated}
        />
      )}
    </>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#F1F5F9] py-2.5 last:border-b-0">
      <span className="text-[12px] font-medium text-[#64748B]">{label}</span>
      <span className="text-[13px] font-semibold text-[#1E293B] text-right">{value}</span>
    </div>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const value = String(status ?? '').toUpperCase();
  if (value === 'COMPLETED' || value === 'CONFIRMED') {
    return <Badge tone="live">{value.toLowerCase()}</Badge>;
  }
  if (value === 'CANCELLED' || value === 'NO_SHOW') {
    return <Badge tone="signal">{value.toLowerCase().replace('_', ' ')}</Badge>;
  }
  if (value === 'ONGOING' || value === 'IN_QUEUE') {
    return <Badge tone="primary">{value.toLowerCase().replace('_', ' ')}</Badge>;
  }
  if (value === 'PENDING') {
    return <Badge tone="warning">{value.toLowerCase()}</Badge>;
  }
  return <Badge tone="plain">{value.toLowerCase().replace('_', ' ')}</Badge>;
}

function BookingDetailModal({
  row,
  tenant,
  onClose,
  onUpdated,
}: {
  row: Appointment;
  tenant?: Tenant;
  onClose: () => void;
  onUpdated: (row: Appointment) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  // Must equal one of the <option> values below: it used to be a string no option had, so an admin
  // who left the select as shown saved a reason that was never on screen.
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation via support');
  // Completing settles the booking's payment and awards loyalty points; a no-show counts against the
  // customer. Both used to happen on a single click.
  const [confirming, setConfirming] = useState<'COMPLETED' | 'NO_SHOW' | null>(null);

  const customerName =
    row.customerName ??
    row.guestName ??
    (row.customerId ? 'Registered customer' : 'Walk-in Guest');

  const salonName = row.tenantName || tenant?.name || 'Platform Salon';
  const salonColor = row.tenantBrandColor || tenant?.brandColor || '#635BFF';

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    setUpdating(true);
    setModalError(null);
    try {
      let updated: Appointment;
      if (newStatus === 'CANCELLED') {
        updated = await cancelAppointment(row.id, reason ?? cancelReason);
      } else {
        updated = await updateAppointmentStatus(row.id, newStatus, reason);
      }
      onUpdated(updated);
    } catch (err) {
      setModalError((err as Error).message || 'Failed to update booking status');
      setUpdating(false);
    }
  };

  const status = String(row.status).toUpperCase();
  const isTerminal = status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW';

  return (
    <Modal wide title="Booking Details & Operations" onClose={onClose}>
      <div className="space-y-4">
        {modalError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-800">
            <AlertCircle size={15} className="text-red-600 shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        {/* Quick summary header */}
        <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#F8F9FE] border border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <Mark name={salonName} color={salonColor} size={28} />
            <div>
              <h3 className="text-sm font-bold text-[#1E293B]">{salonName}</h3>
              <p className="text-xs text-[#64748B]">Booking ID: {row.id}</p>
            </div>
          </div>
          <BookingStatusBadge status={row.status} />
        </div>

        {/* Details Grid */}
        <div className="rounded-lg border border-[#E2E8F0] p-4 bg-white space-y-0.5">
          <DetailRow
            label="Shop"
            value={
              row.tenantId ? (
                <Link
                  href={`/shops/${row.tenantId}`}
                  className="inline-flex items-center gap-1 text-[#635BFF] hover:underline"
                >
                  {salonName} <ExternalLink size={12} />
                </Link>
              ) : (
                salonName
              )
            }
          />
          <DetailRow label="Service" value={row.serviceName ?? '—'} />
          <DetailRow label="Barber / Staff" value={row.staffName ?? '—'} />
          <DetailRow label="Customer" value={customerName} />
          <DetailRow
            label="Phone"
            value={
              row.customerPhone || row.guestPhone ? (
                <a
                  href={`tel:${row.customerPhone ?? row.guestPhone}`}
                  className="inline-flex items-center gap-1 text-[#635BFF] hover:underline"
                >
                  <Phone size={12} /> {row.customerPhone ?? row.guestPhone}
                </a>
              ) : (
                '—'
              )
            }
          />
          <DetailRow
            label="Booked via"
            value={row.isWalkIn ? 'Walk-in (Reception Desk)' : 'Customer Online App'}
          />
          <DetailRow label="Start Time" value={bookingDateTime(row.startAt)} />
          <DetailRow label="End Time" value={bookingDateTime(row.endAt)} />
          {row.durationMinutes != null && (
            <DetailRow label="Duration" value={`${row.durationMinutes} min`} />
          )}
          <DetailRow label="Price" value={money(row.price)} />
          {row.couponCode && <DetailRow label="Coupon Code" value={row.couponCode} />}
          {row.discountAmount != null && Number(row.discountAmount) > 0 && (
            <DetailRow label="Discount" value={money(row.discountAmount)} />
          )}
          {row.cancellationReason && (
            <DetailRow label="Cancellation Reason" value={row.cancellationReason} />
          )}
          {row.cancelledBy && <DetailRow label="Cancelled By" value={row.cancelledBy} />}
          <DetailRow label="Created At" value={dateTime(row.createdAt)} />
        </div>

        {/* Management Actions */}
        {!isTerminal && (
          <div className="rounded-lg border border-[#E2E8F0] p-4 bg-[#F8F9FE] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Super Admin Overrides
            </h4>

            {confirming ? (
              <div className="space-y-2.5 rounded-lg border border-[#E2E8F0] bg-white p-3.5">
                <p className="text-xs font-bold text-[#1E293B]">
                  {confirming === 'COMPLETED' ? 'Mark this booking completed?' : 'Mark this booking a no-show?'}
                </p>
                <p className="text-xs text-[#64748B]">
                  {confirming === 'COMPLETED'
                    ? `This records ${money(row.price)} as paid at ${salonName} and gives ${customerName} their loyalty points.`
                    : `This records that ${customerName} did not turn up. It counts against them, and the booking cannot be reopened.`}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleStatusChange(confirming)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-[#1E293B] hover:bg-black rounded-md transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : confirming === 'COMPLETED' ? 'Mark Completed' : 'Mark No-Show'}
                  </button>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => setConfirming(null)}
                    className="px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#1E293B] rounded-md transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : showCancelPrompt ? (
              <div className="space-y-2.5 rounded-lg border border-red-200 bg-red-50/50 p-3.5">
                <p className="text-xs font-bold text-red-900">Confirm Cancellation Reason:</p>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full rounded-md border border-red-300 bg-white px-2.5 py-1.5 text-xs text-[#1E293B]"
                >
                  <option value="Customer requested cancellation via support">
                    Customer requested cancellation via support
                  </option>
                  <option value="Shop emergency closure / unavailable">
                    Shop emergency closure / unavailable
                  </option>
                  <option value="Staff member absent">Staff member absent</option>
                  <option value="Duplicate or accidental booking">
                    Duplicate or accidental booking
                  </option>
                  <option value="Other administrative intervention">
                    Other administrative intervention
                  </option>
                </select>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleStatusChange('CANCELLED', cancelReason)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => setShowCancelPrompt(false)}
                    className="px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#1E293B] rounded-md transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {status === 'PENDING' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleStatusChange('CONFIRMED')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-2xs disabled:opacity-50"
                  >
                    Confirm Booking
                  </button>
                )}

                {(status === 'PENDING' || status === 'CONFIRMED' || status === 'IN_QUEUE') && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => setConfirming('COMPLETED')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors shadow-2xs disabled:opacity-50"
                  >
                    Mark Completed
                  </button>
                )}

                <button
                  type="button"
                  disabled={updating}
                  onClick={() => setConfirming('NO_SHOW')}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors disabled:opacity-50"
                >
                  Mark No-Show
                </button>

                <button
                  type="button"
                  disabled={updating}
                  onClick={() => setShowCancelPrompt(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors disabled:opacity-50"
                >
                  Cancel Booking
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

