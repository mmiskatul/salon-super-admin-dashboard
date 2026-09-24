'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShieldAlert,
  Scissors,
  Users,
  Calendar,
  DollarSign,
  Star,
  Clock,
  Lock,
  Unlock,
  Building2,
  Mail,
  Phone,
  RotateCw,
  ImageOff,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { getBarberCareer, getBarberDashboard, type BarberDashboardDetail } from '@/lib/api/barbers';
import { banUser, unbanUser } from '@/lib/api/users';
import { removeReview } from '@/lib/api/bookings';
import { brandColor, count, date, dateTime, money, shortId, rating } from '@/lib/format';
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
import { Field, FormError, Modal, TextInput } from '@/components/ui/Form';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Mark from '@/components/ui/Mark';
import WalletPanel from '@/components/ui/WalletPanel';

const TABS = [
  'Appointments & Bookings',
  'Connected Clients',
  'Schedule & Hours',
  'Services & Pricing',
  'Wallet & Financials',
  'Customer Reviews',
  'Work History',
  'Portfolio Gallery',
  'Account & Controls',
] as const;
type Tab = (typeof TABS)[number];

export default function BarberDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('Appointments & Bookings');
  const [banning, setBanning] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [unbanConfirm, setUnbanConfirm] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  const ban = useMutation(banUser);
  const unban = useMutation(unbanUser);
  const deleteReviewMut = useMutation(removeReview);

  const { data, loading, error, refresh } = useApi(() => getBarberDashboard(id), [id]);
  const career = useApi(() => getBarberCareer(id), [id], 'barber-career');

  if (loading && !data) {
    return (
      <Canvas>
        <Loading label="Loading barber inspection & activity hub..." />
      </Canvas>
    );
  }

  if (error || !data) {
    return (
      <Canvas>
        <Failed message={error ?? 'That barber could not be loaded.'} onRetry={refresh} />
        <Link href="/barbers" className="text-[13px] text-ink-2 hover:text-ink">
          ← Back to barbers directory
        </Link>
      </Canvas>
    );
  }

  const {
    barber,
    tenant,
    staffRecord,
    metrics,
    appointments,
    clients,
    services,
    schedule,
    workingHours,
    reviews,
    gallery,
  } = data;

  const color = brandColor(tenant?.brandColor ?? null);

  async function handleBanSubmit() {
    try {
      await ban.mutate(barber.id, banReason.trim() || undefined);
      setBanning(false);
      setBanReason('');
      refresh();
    } catch {
      // handled by useMutation
    }
  }

  async function handleUnban() {
    setUnbanConfirm(true);
  }

  async function handleUnbanConfirm() {
    try {
      await unban.mutate(barber.id);
      setUnbanConfirm(false);
      refresh();
    } catch {
      // handled by useMutation
    }
  }

  async function handleDeleteReview(reviewId: string) {
    setReviewToDelete(reviewId);
  }

  async function handleConfirmDeleteReview() {
    if (!reviewToDelete) return;
    try {
      await deleteReviewMut.mutate(reviewToDelete);
      setReviewToDelete(null);
      refresh();
    } catch {
      // handled by useMutation
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Platform / Barbers"
        title={barber.name}
        lede={`Live inspection hub for ${barber.name} (${barber.type === 'SOLO' ? 'Independent Solo' : tenant?.name ?? 'Shop Stylist'}).`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/barbers"
              className="inline-flex items-center gap-1 rounded-lg border border-rule bg-ground px-3 py-1.5 text-[12px] font-medium text-ink-2 hover:bg-ground-soft hover:text-ink"
            >
              <ArrowLeft size={13} />
              Barbers
            </Link>
            <Button onClick={refresh} disabled={loading}>
              <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        }
      />

      <Canvas>
        {/* Barber Overview Identity Banner */}
        <div className="rounded-xl border border-rule bg-surface p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              {barber.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={barber.avatarUrl}
                  alt={barber.name}
                  className="h-16 w-16 rounded-xl border border-rule object-cover shadow-xs"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-ink text-lg font-bold text-white shadow-xs">
                  {barber.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-ink">{barber.name}</h2>
                  {barber.type === 'SOLO' ? (
                    <Badge tone="live">
                      <Sparkles size={11} className="mr-1" />
                      Independent Solo
                    </Badge>
                  ) : (
                    <Badge tone="plain">
                      <Building2 size={11} className="mr-1" />
                      Shop Stylist
                    </Badge>
                  )}
                  {barber.isBanned ? (
                    <Badge tone="signal">Account Banned</Badge>
                  ) : (
                    <Badge tone="live">Active Status</Badge>
                  )}
                </div>

                <p className="text-[13px] text-ink-2">
                  {staffRecord?.title ? (
                    <span className="font-medium text-ink">{staffRecord.title} • </span>
                  ) : null}
                  {barber.businessName ? (
                    <span className="text-ink-2">Trading as {barber.businessName} • </span>
                  ) : null}
                  Joined platform on {date(barber.createdAt)}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[12px] text-ink-3">
                  <span className="flex items-center gap-1">
                    <Mail size={12} />
                    {barber.email}
                  </span>
                  {barber.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} />
                      {barber.phone}
                    </span>
                  )}
                  {tenant && (
                    <Link
                      href={`/shops/${tenant.id}`}
                      className="flex items-center gap-1 font-medium text-ink hover:underline"
                    >
                      <Mark name={tenant.name} color={color} size={14} />
                      {tenant.name}
                    </Link>
                  )}
                  {barber.address && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {barber.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Pill Controls */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              {barber.isBanned ? (
                <Button
                  variant="secondary"
                  onClick={handleUnban}
                  disabled={unban.pending}
                >
                  <Unlock size={13} className="mr-1 text-live" />
                  Unban Barber
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={() => setBanning(true)}
                  disabled={ban.pending}
                >
                  <Lock size={13} className="mr-1" />
                  Ban Account
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 8 Connected KPI Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <Stat label="Total Bookings" value={count(metrics.totalBookings)} />
          <Stat label="Clients Served" value={count(metrics.uniqueClientsCount)} tone="live" />
          <Stat label="Completed" value={count(metrics.completedBookings)} tone="live" />
          <Stat label="Upcoming" value={count(metrics.upcomingBookings)} tone="plain" />
          <Stat label="Lifetime Vol." value={money(metrics.lifetimeRevenue)} tone="live" />
          <Stat label="Wallet Bal." value={money(metrics.walletBalance)} tone="plain" />
          <Stat
            label="Rating"
            value={Number(metrics.ratingAvg) > 0 ? rating(metrics.ratingAvg) : '—'}
            tone="plain"
            sub={metrics.ratingCount > 0 ? `${metrics.ratingCount} reviews` : 'No reviews'}
          />
          <Stat label="Active Services" value={count(metrics.servicesCount)} tone="plain" />
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-rule-soft pb-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-ink text-white shadow-xs'
                  : 'bg-surface text-ink-2 hover:bg-ground hover:text-ink'
              }`}
            >
              {tab === 'Appointments & Bookings' && `📅 Appointments (${appointments.length})`}
              {tab === 'Connected Clients' && `🧑‍🤝‍🧑 Clients (${clients.length})`}
              {tab === 'Schedule & Hours' && `⏰ Schedule & Shifts`}
              {tab === 'Services & Pricing' && `💇 Services (${services.length})`}
              {tab === 'Wallet & Financials' && `💳 Digital Wallet`}
              {tab === 'Customer Reviews' && `⭐ Reviews (${reviews.length})`}
              {tab === 'Portfolio Gallery' && `🖼️ Portfolio (${gallery.length})`}
              {tab === 'Account & Controls' && `⚙️ Admin Controls`}
            </button>
          ))}
        </div>

        {/* Tab 1: Appointments & Bookings */}
        {activeTab === 'Appointments & Bookings' && (
          <Panel
            flush
            title="Appointments & Booking Ledger"
            note={`${appointments.length} total appointments linked to this barber.`}
          >
            {appointments.length === 0 ? (
              <div className="p-8">
                <Empty
                  title="No appointments recorded"
                  hint="Appointments taken either via online booking or in-shop walk-ins will appear here."
                />
              </div>
            ) : (
              <Scroll>
                <Table>
                  <thead>
                    <tr>
                      <Th>Date & Time</Th>
                      <Th>Customer / Guest</Th>
                      <Th>Service</Th>
                      <Th align="right">Duration</Th>
                      <Th align="right">Price</Th>
                      <Th align="right">Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => {
                      const isWalkIn = a.isWalkIn;
                      const customerLabel = a.guestName || (a.customerId ? shortId(a.customerId) : 'Guest');
                      return (
                        <Tr key={a.id}>
                          <Td nowrap={false}>
                            <span className="font-mono text-[12px] font-medium text-ink">
                              {dateTime(a.startAt)}
                            </span>
                            <span className="tabular block text-[10px] text-ink-3">
                              ID: {shortId(a.id)}
                            </span>
                          </Td>
                          <Td nowrap={false}>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12px] font-medium text-ink">{customerLabel}</span>
                              {isWalkIn && <Badge tone="quiet">Walk-in</Badge>}
                            </div>
                            {a.guestPhone && (
                              <span className="tabular block text-[11px] text-ink-3">
                                {a.guestPhone}
                              </span>
                            )}
                          </Td>
                          <Td muted>{a.serviceName ?? 'General Service'}</Td>
                          <Td align="right" mono muted>
                            {a.durationMinutes ? `${a.durationMinutes}m` : '—'}
                          </Td>
                          <Td align="right" mono font-semibold>
                            {money(a.price)}
                          </Td>
                          <Td align="right">
                            {a.status === 'COMPLETED' ? (
                              <Badge tone="live">Completed</Badge>
                            ) : a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS' ? (
                              <Badge tone="plain">{a.status}</Badge>
                            ) : a.status === 'CANCELLED' || a.status === 'NO_SHOW' ? (
                              <Badge tone="signal">{a.status}</Badge>
                            ) : (
                              <Badge tone="quiet">{a.status}</Badge>
                            )}
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

        {/* Tab 2: Connected Clients */}
        {activeTab === 'Connected Clients' && (
          <Panel
            flush
            title="Serviced Clients"
            note="Customers and guests who have had appointments with this barber."
          >
            {clients.length === 0 ? (
              <div className="p-8">
                <Empty
                  title="No clients recorded yet"
                  hint="Once customers book or walk into this barber's chair, they are indexed here."
                />
              </div>
            ) : (
              <Scroll>
                <Table>
                  <thead>
                    <tr>
                      <Th>Client Name</Th>
                      <Th>Phone</Th>
                      <Th>Type</Th>
                      <Th align="right">Completed Visits</Th>
                      <Th align="right">Total Spent</Th>
                      <Th align="right">Last Visit</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <Tr key={c.key}>
                        <Td nowrap={false}>
                          <span className="font-semibold text-ink text-[12px]">{c.name}</span>
                          {c.customerId && (
                            <span className="tabular block text-[10px] text-ink-3">
                              ID: {shortId(c.customerId)}
                            </span>
                          )}
                        </Td>
                        <Td muted mono>
                          {c.phone ?? '—'}
                        </Td>
                        <Td>
                          {c.isGuest ? (
                            <Badge tone="quiet">Walk-in Guest</Badge>
                          ) : (
                            <Badge tone="live">App Customer</Badge>
                          )}
                        </Td>
                        <Td align="right" mono font-semibold>
                          {c.visits}
                        </Td>
                        <Td align="right" mono muted>
                          {money(c.totalSpent)}
                        </Td>
                        <Td align="right" mono muted>
                          {c.lastVisitAt ? date(c.lastVisitAt) : '—'}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Scroll>
            )}
          </Panel>
        )}

        {/* Tab 3: Schedule & Hours */}
        {activeTab === 'Schedule & Hours' && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Weekly Working Hours */}
            <Panel
              title="Weekly Working Hours"
              note="Declared standard shift hours configured by this barber."
            >
              {!workingHours || !workingHours.schedule || workingHours.schedule.length === 0 ? (
                <div className="p-4 text-[12px] text-ink-3">
                  No standard weekly working hours have been registered yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {workingHours.schedule.map((day) => (
                    <div
                      key={day.day}
                      className="flex items-center justify-between rounded-lg border border-rule-soft bg-ground px-3 py-2 text-[12px]"
                    >
                      <span className={day.isOpen ? 'font-medium text-ink' : 'text-ink-3'}>
                        {day.day}
                      </span>
                      {day.isOpen ? (
                        <span className="tabular font-medium text-ink-2">
                          {day.startTime} – {day.endTime}
                          {day.breakTime && (
                            <span className="text-ink-3 font-normal">
                              {' '}
                              (Break: {day.breakTime}
                              {day.breakEndTime ? `–${day.breakEndTime}` : ''})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-ink-3">Closed / Off Duty</span>
                      )}
                    </div>
                  ))}

                  <div className="mt-4 border-t border-rule-soft pt-3 text-[11px] text-ink-3">
                    <p>Buffer Before: {workingHours.bufferBeforeMin ?? 0}m | Buffer After: {workingHours.bufferAfterMin ?? 0}m</p>
                    <p>Minimum Notice: {workingHours.minNotice ?? 'None'} | Window: {workingHours.bookingWindow ?? 'Standard'}</p>
                  </div>
                </div>
              )}
            </Panel>

            {/* Next 7 Days Shift Slots */}
            <Panel
              title="Next 7 Days Agenda"
              note="Upcoming calendar slots, bookings, and blocked windows."
            >
              {schedule.length === 0 ? (
                <div className="p-4 text-[12px] text-ink-3">
                  No upcoming schedule slots found for the next 7 days.
                </div>
              ) : (
                <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
                  {schedule.map((day) => (
                    <div
                      key={day.date}
                      className="rounded-lg border border-rule-soft bg-surface p-3 text-[12px]"
                    >
                      <div className="flex items-center justify-between border-b border-rule-soft pb-1.5">
                        <span className="font-semibold text-ink">{date(day.date)}</span>
                        <span className="text-[11px] text-ink-3">
                          {day.slots.length} slot{day.slots.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      {day.slots.length === 0 ? (
                        <p className="mt-2 text-[11px] text-ink-3">No active shifts/slots</p>
                      ) : (
                        <div className="mt-2 space-y-1">
                          {day.slots.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between rounded-md bg-ground px-2.5 py-1 text-[11px]"
                            >
                              <span className="tabular font-medium text-ink-2">
                                {s.startTime} – {s.endTime}
                              </span>
                              {s.appointmentId ? (
                                <Badge tone="live">Booked: {s.clientName ?? 'Customer'}</Badge>
                              ) : s.kind === 'BLOCKED' ? (
                                <Badge tone="signal">Blocked</Badge>
                              ) : (
                                <Badge tone="quiet">Open Slot</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* Tab 4: Services & Pricing */}
        {activeTab === 'Services & Pricing' && (
          <Panel
            flush
            title="Service Catalogue"
            note="Services offered by this barber (either shop-wide catalogue or solo catalogue)."
          >
            {services.length === 0 ? (
              <div className="p-8">
                <Empty
                  title="No services listed"
                  hint="Services configured by this barber or inherited from the shop catalogue will appear here."
                />
              </div>
            ) : (
              <Scroll>
                <Table>
                  <thead>
                    <tr>
                      <Th>Service Name</Th>
                      <Th>Scope</Th>
                      <Th align="right">Duration</Th>
                      <Th align="right">Price</Th>
                      <Th align="right">Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <Tr key={s.id}>
                        <Td nowrap={false}>
                          <span className="font-semibold text-ink text-[12px]">{s.name}</span>
                          {s.description && (
                            <span className="block text-[11px] text-ink-3">{s.description}</span>
                          )}
                        </Td>
                        <Td muted>
                          {s.tenantId ? (
                            <span className="text-[12px]">Shop Catalogue</span>
                          ) : (
                            <span className="text-[12px] text-primary">Solo Custom Service</span>
                          )}
                        </Td>
                        <Td align="right" mono muted>
                          {s.durationMinutes} mins
                        </Td>
                        <Td align="right" mono font-semibold>
                          {money(s.price)}
                        </Td>
                        <Td align="right">
                          {s.isActive ? (
                            <Badge tone="live">Active</Badge>
                          ) : (
                            <Badge tone="quiet">Inactive</Badge>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Scroll>
            )}
          </Panel>
        )}

        {/* Tab 5: Wallet & Financials */}
        {activeTab === 'Wallet & Financials' && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel title="Digital Wallet & Payouts" note="Current ledger balance and account payouts.">
              <WalletPanel userId={barber.id} />
            </Panel>

            <Panel
              title="Earnings Overview"
              note="Summary of booked appointments, processed earnings, and transaction velocity."
            >
              <div className="space-y-4 rounded-lg border border-rule bg-surface p-4">
                <div className="flex items-center justify-between border-b border-rule-soft pb-3">
                  <div>
                    <span className="eyebrow !text-[10px]">Lifetime Gross Volume</span>
                    <div className="text-xl font-bold font-mono text-ink">
                      {money(metrics.lifetimeRevenue)}
                    </div>
                  </div>
                  <Badge tone="live">Settled</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-lg bg-ground p-3">
                    <span className="text-[11px] text-ink-3">Completed Bookings</span>
                    <p className="text-base font-bold font-mono text-ink">
                      {metrics.completedBookings}
                    </p>
                  </div>
                  <div className="rounded-lg bg-ground p-3">
                    <span className="text-[11px] text-ink-3">Avg Ticket Size</span>
                    <p className="text-base font-bold font-mono text-ink">
                      {metrics.completedBookings > 0
                        ? money(metrics.lifetimeRevenue / metrics.completedBookings)
                        : money(0)}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-ink-3">
                  Note: Payouts and wallet balances are synchronized with the central payment ledger.
                </p>
              </div>
            </Panel>
          </div>
        )}

        {/* Tab 6: Customer Reviews */}
        {activeTab === 'Customer Reviews' && (
          <Panel
            title={`Customer Reviews (${reviews.length})`}
            note="Customer ratings and feedback left for this barber."
          >
            {reviews.length === 0 ? (
              <div className="p-8">
                <Empty
                  title="No reviews yet"
                  hint="Customer reviews written after completed appointments will be shown here."
                />
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg border border-rule-soft bg-surface p-4 shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-bold text-ink">
                            <Star size={13} className="fill-amber-400 text-amber-400" />
                            {r.rating}.0
                          </span>
                          <span className="text-[11px] text-ink-3">
                            by Customer {shortId(r.customerId)} on {date(r.createdAt)}
                          </span>
                        </div>
                        {r.comment && (
                          <p className="text-[13px] text-ink-2">{r.comment}</p>
                        )}
                        {r.replyText && (
                          <div className="mt-2 rounded-md bg-ground p-2.5 text-[12px]">
                            <span className="font-semibold text-ink block">Barber Reply:</span>
                            <span className="text-ink-2">{r.replyText}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="danger"
                        onClick={() => handleDeleteReview(r.id)}
                        disabled={deleteReviewMut.pending}
                        title="Delete this review from platform"
                      >
                        <Trash2 size={12} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}

        {/* Work history: every shop this barber has worked at, from BarberEmployment. Ratings and
            bookings are keyed by the barber, not the shop, so they carry across every move. */}
        {activeTab === 'Work History' && (
          <Panel
            title="Work History"
            note={
              career.data
                ? `${count(career.data.stats.completedBookings)} completed bookings, ${rating(career.data.stats.ratingAvg)} from ${count(career.data.stats.ratingCount)} reviews across their whole career.`
                : 'Every shop this barber has worked at, and what they earned there.'
            }
          >
            {career.error ? (
              <Failed message={career.error} onRetry={career.refresh} />
            ) : !career.data ? (
              <Loading label="Loading work history" />
            ) : career.data.experience.length === 0 ? (
              <div className="p-8">
                <Empty
                  title="No shop history"
                  hint="This barber has only worked independently so far. Joining a shop with its join code starts a new entry here."
                />
              </div>
            ) : (
              <Scroll>
                <Table>
                  <thead>
                    <tr>
                      <Th>Shop</Th>
                      <Th>Period</Th>
                      <Th>Status</Th>
                      <Th align="right">Completed bookings</Th>
                      <Th align="right">Rating</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {career.data.experience.map((stint) => (
                      <Tr key={stint.id}>
                        <Td>
                          {stint.tenantId ? (
                            <Link href={`/shops/${stint.tenantId}`} className="font-medium hover:underline">
                              {stint.shopName}
                            </Link>
                          ) : (
                            <span className="font-medium">{stint.shopName}</span>
                          )}
                          {stint.title && <span className="block text-[11px] text-ink-3">{stint.title}</span>}
                        </Td>
                        <Td mono muted>
                          {date(stint.startedAt)} – {stint.endedAt ? date(stint.endedAt) : 'present'}
                        </Td>
                        <Td>
                          {stint.current ? (
                            <Badge tone="live">Current</Badge>
                          ) : stint.endReason === 'LEFT' ? (
                            <Badge tone="quiet">Left</Badge>
                          ) : (
                            <Badge tone="warning">Removed by shop</Badge>
                          )}
                        </Td>
                        <Td align="right" mono>
                          {count(stint.completedBookings)}
                        </Td>
                        <Td align="right" mono muted>
                          {stint.ratingCount > 0 ? `${rating(stint.ratingAvg)} (${stint.ratingCount})` : '—'}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Scroll>
            )}
          </Panel>
        )}

        {/* Tab 7: Portfolio Gallery */}
        {activeTab === 'Portfolio Gallery' && (
          <Panel
            title={`Portfolio Gallery (${gallery.length})`}
            note="Public portfolio photos showcasing haircut styles, beard trims, and grooming work."
          >
            {gallery.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-rule bg-ground px-4 py-8 text-[12px] text-ink-3 justify-center">
                <ImageOff size={16} />
                No portfolio photos have been uploaded by this barber yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {gallery.map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={photo.id}
                    src={photo.imageUrl}
                    alt="Portfolio work"
                    className="aspect-square w-full rounded-lg border border-rule object-cover shadow-2xs hover:opacity-95"
                  />
                ))}
              </div>
            )}
          </Panel>
        )}

        {/* Tab 8: Account & Controls */}
        {activeTab === 'Account & Controls' && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel title="Account Details" note="Core authentication and identity credentials.">
              <div className="space-y-3 text-[13px]">
                <div className="flex justify-between border-b border-rule-soft pb-2">
                  <span className="text-ink-3">Account ID</span>
                  <span className="font-mono text-ink">{barber.id}</span>
                </div>
                <div className="flex justify-between border-b border-rule-soft pb-2">
                  <span className="text-ink-3">Email Address</span>
                  <span className="font-medium text-ink">{barber.email}</span>
                </div>
                <div className="flex justify-between border-b border-rule-soft pb-2">
                  <span className="text-ink-3">Phone</span>
                  <span className="font-mono text-ink">{barber.phone ?? 'Not provided'}</span>
                </div>
                <div className="flex justify-between border-b border-rule-soft pb-2">
                  <span className="text-ink-3">Account Role</span>
                  <span className="font-medium text-ink">{barber.role}</span>
                </div>
                <div className="flex justify-between border-b border-rule-soft pb-2">
                  <span className="text-ink-3">Operational Type</span>
                  <span className="font-medium text-ink">{barber.type}</span>
                </div>
                <div className="flex justify-between border-b border-rule-soft pb-2">
                  <span className="text-ink-3">Registered Date</span>
                  <span className="text-ink">{date(barber.createdAt)}</span>
                </div>
                {barber.isBanned && (
                  <div className="rounded-lg bg-signal/10 p-3 text-[12px] text-signal">
                    <span className="font-bold block">Account is Banned</span>
                    <span>Reason: {barber.bannedReason || 'No reason provided'}</span>
                  </div>
                )}
              </div>
            </Panel>

            <Panel title="Platform Moderation" note="Administrative disciplinary and access actions.">
              <div className="space-y-4">
                <div className="rounded-lg border border-rule-soft bg-ground p-4">
                  <h4 className="text-[13px] font-semibold text-ink">Account Suspension / Ban</h4>
                  <p className="mt-1 text-[12px] text-ink-3">
                    Banning a barber immediately blocks their credentials from signing into the barber app,
                    invalidates active JWT refresh tokens, and hides their services from customer search.
                  </p>
                  <div className="mt-3">
                    {barber.isBanned ? (
                      <Button variant="secondary" onClick={handleUnban} disabled={unban.pending}>
                        <Unlock size={13} className="mr-1 text-live" />
                        Unban Barber Account
                      </Button>
                    ) : (
                      <Button variant="danger" onClick={() => setBanning(true)} disabled={ban.pending}>
                        <Lock size={13} className="mr-1" />
                        Ban Barber Account
                      </Button>
                    )}
                  </div>
                </div>

                {tenant && (
                  <div className="rounded-lg border border-rule-soft bg-ground p-4">
                    <h4 className="text-[13px] font-semibold text-ink">Shop Affiliation</h4>
                    <p className="mt-1 text-[12px] text-ink-3">
                      This barber is currently attached to <strong className="text-ink">{tenant.name}</strong>.
                    </p>
                    <div className="mt-3">
                      <Link
                        href={`/shops/${tenant.id}`}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                      >
                        Inspect Associated Shop Dashboard →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          </div>
        )}
      </Canvas>

      {/* Ban Confirmation Modal */}
      {banning && (
        <Modal
          title={`Ban ${barber.name}`}
          note="Suspending this account immediately revokes login, invalidates all sessions, and closes upcoming booking availability."
          onClose={() => setBanning(false)}
        >
          <div className="space-y-4">
            <FormError message={ban.error} />
            <Field label="Ban Reason" hint="Optional rationale logged with this moderation action">
              <TextInput
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="e.g. Conduct violation, repeated no-shows, audit finding"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setBanning(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleBanSubmit} disabled={ban.pending}>
                <ShieldAlert size={13} className="mr-1" />
                Confirm Ban
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Unban Confirmation Dialog */}
      <ConfirmDialog
        open={unbanConfirm}
        title={`Unban ${barber.name}`}
        description={
          <p>
            Are you sure you want to lift the suspension for{' '}
            <strong className="text-[#1E293B] font-bold">{barber.name}</strong>? They will regain access to sign in to the
            barber app and their calendar availability will be restored.
          </p>
        }
        confirmLabel="Confirm Unban"
        variant="primary"
        pending={unban.pending}
        error={unban.error}
        onConfirm={handleUnbanConfirm}
        onClose={() => setUnbanConfirm(false)}
      />

      {/* Delete Review Confirmation Dialog */}
      <ConfirmDialog
        open={!!reviewToDelete}
        title="Delete customer review"
        description="Are you sure you want to permanently delete this customer review? The barber's rating aggregate will be recalculated."
        confirmLabel="Confirm Delete"
        variant="danger"
        pending={deleteReviewMut.pending}
        error={deleteReviewMut.error}
        onConfirm={handleConfirmDeleteReview}
        onClose={() => setReviewToDelete(null)}
      />
    </>
  );
}
