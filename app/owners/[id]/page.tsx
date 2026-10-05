'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Users,
  Calendar,
  DollarSign,
  Scissors,
  Copy,
  Check,
  Store,
  Clock,
  MapPin,
  Package,
  Star,
  FileText,
  Lock,
  Unlock,
  AlertTriangle,
  Mail,
  Phone,
  RotateCw,
} from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { getOwnerDashboard, type OwnerDashboardDetail } from '@/lib/api/owners';
import { suspendTenant, unsuspendTenant, updateTenant } from '@/lib/api/tenants';
import { banUser, unbanUser } from '@/lib/api/users';
import { brandColor, count, dateTime, money, shortId, since, bookingDate, bookingTime } from '@/lib/format';
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
import Mark from '@/components/ui/Mark';
import BarberDetailModal from '@/components/ui/BarberDetailModal';

const TABS = [
  'Barbers & Team',
  'Connected Clients',
  'Bookings & Agenda',
  'Services & Catalog',
  'Revenue & Transactions',
  'Locations & Hours',
  'Salon Controls',
] as const;
type Tab = (typeof TABS)[number];

export default function OwnerDashboardDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('Barbers & Team');
  const [copiedJoinCode, setCopiedJoinCode] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<{ userId: string; name: string } | null>(null);

  // Administrative Control Modals
  const [suspending, setSuspending] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [banning, setBanning] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [editingShop, setEditingShop] = useState(false);
  const [shopName, setShopName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [tagline, setTagline] = useState('');

  const suspend = useMutation(suspendTenant);
  const unsuspend = useMutation(unsuspendTenant);
  const ban = useMutation(banUser);
  const unban = useMutation(unbanUser);
  const update = useMutation(updateTenant);

  const { data, loading, error, refresh } = useApi(() => getOwnerDashboard(id), [id], 'owner-dashboard');

  function copyText(txt: string) {
    navigator.clipboard.writeText(txt);
    setCopiedJoinCode(true);
    setTimeout(() => setCopiedJoinCode(false), 2000);
  }

  if (loading && !data) {
    return (
      <Canvas>
        <Loading label="Loading owner dashboard inspection..." />
      </Canvas>
    );
  }

  if (error || !data) {
    return (
      <Canvas>
        <Failed message={error ?? 'That owner dashboard could not be loaded.'} onRetry={refresh} />
        <Link href="/owners" className="text-[13px] text-ink-2 hover:text-ink">
          ← Back to owner dashboards
        </Link>
      </Canvas>
    );
  }

  const { owner, tenant, metrics, barbers, clients, appointments, services, transactions, locations, shopHours } = data;
  const color = brandColor(tenant.brandColor);

  return (
    <>
      {/* Top Header & Breadcrumb */}
      <header className="border-b border-rule bg-surface px-5 py-6 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[12px] text-ink-3">
            <Link href="/owners" className="hover:text-ink transition-colors flex items-center gap-1">
              <ArrowLeft size={13} />
              Owner Dashboards
            </Link>
            <span>/</span>
            <span className="text-ink-2 font-medium">{owner.name}</span>
            <span>/</span>
            <span className="text-ink font-semibold">{tenant.name}</span>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Owner & Salon Identity Banner */}
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-[20px] font-bold text-white shadow-sm"
                style={{ backgroundColor: color }}
              >
                {owner.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-[24px] sm:text-[28px] font-extrabold tracking-[-0.03em] text-ink">
                    {owner.name}
                  </h1>
                  {tenant.isSuspended ? (
                    <Badge tone="signal">SHOP SUSPENDED</Badge>
                  ) : owner.isBanned ? (
                    <Badge tone="signal">OWNER BANNED</Badge>
                  ) : (
                    <Badge tone="live">ACTIVE DASHBOARD</Badge>
                  )}
                  {!tenant.isListed && <Badge tone="quiet">UNLISTED</Badge>}
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[12px] text-ink-2 mt-1">
                  <span className="flex items-center gap-1">
                    <Store size={12} className="text-ink-3" />
                    <strong className="text-ink">{tenant.name}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail size={12} className="text-ink-3" />
                    {owner.email}
                  </span>
                  {owner.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-ink-3" />
                      {owner.phone}
                    </span>
                  )}
                  <span className="text-ink-3">Joined {since(owner.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Quick Administrative Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button onClick={refresh} disabled={loading}>
                <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
                Refresh
              </Button>

              {/* View Connected Shop Management */}
              <Button
                variant="secondary"
                onClick={() => router.push(`/shops/${tenant.id}`)}
                title="Manage shop catalog, team, and inventory"
              >
                <Store size={12} />
                Shop Management
              </Button>

              {/* Edit Shop */}
              <Button
                onClick={() => {
                  setShopName(tenant.name);
                  setContactEmail(tenant.contactEmail);
                  setContactPhone(tenant.contactPhone || '');
                  setTagline(tenant.tagline || '');
                  setEditingShop(true);
                }}
              >
                <Pencil size={12} />
                Edit Shop
              </Button>

              {/* Suspend / Unsuspend Shop */}
              {tenant.isSuspended ? (
                <Button
                  variant="primary"
                  disabled={unsuspend.pending}
                  onClick={async () => {
                    const result = await unsuspend.mutate(tenant.id);
                    if (result) await refresh();
                  }}
                >
                  <Unlock size={12} />
                  Unsuspend Shop
                </Button>
              ) : (
                <Button
                  variant="danger"
                  disabled={suspend.pending}
                  onClick={() => {
                    setSuspendReason('');
                    setSuspending(true);
                  }}
                >
                  <Lock size={12} />
                  Suspend Shop
                </Button>
              )}

              {/* Ban / Unban Owner */}
              {owner.isBanned ? (
                <Button
                  variant="secondary"
                  disabled={unban.pending}
                  onClick={async () => {
                    const result = await unban.mutate(owner.id);
                    if (result) await refresh();
                  }}
                >
                  <ShieldCheck size={12} />
                  Unban Owner
                </Button>
              ) : (
                <Button
                  variant="danger"
                  disabled={ban.pending}
                  onClick={() => {
                    setBanReason('');
                    setBanning(true);
                  }}
                >
                  <ShieldAlert size={12} />
                  Ban Owner
                </Button>
              )}

              {/* Link to Shop Console */}
              <Link
                href={`/shops/${tenant.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rule bg-surface px-3 py-1.75 text-[12px] font-medium text-ink hover:bg-ground transition-colors"
              >
                <ExternalLink size={12} />
                Shop Console
              </Link>
            </div>
          </div>
        </div>

        {/* Join Code Banner */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rule-soft bg-ground p-3 text-[12px]">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-ink-3">Staff Join Code: </span>
              {tenant.joinCode ? (
                <button
                  onClick={() => copyText(tenant.joinCode!)}
                  className="font-mono font-bold text-ink inline-flex items-center gap-1.5 bg-surface border border-rule px-2.5 py-0.5 rounded hover:bg-ground transition-colors ml-1"
                  title="Click to copy join code"
                >
                  {tenant.joinCode}
                  {copiedJoinCode ? <Check size={12} className="text-live" /> : <Copy size={12} className="text-ink-3" />}
                </button>
              ) : (
                <span className="italic text-ink-3 ml-1">None generated</span>
              )}
            </div>
            <div>
              <span className="text-ink-3">User ID: </span>
              <span className="font-mono text-ink-2 ml-1" title={owner.id}>
                {shortId(owner.id)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-ink-3">Brand Color:</span>
            <span className="inline-block h-3.5 w-3.5 rounded-full border border-rule-soft" style={{ backgroundColor: color }} />
            <span className="font-mono text-ink-2 text-[11px]">{color}</span>
          </div>
        </div>
      </header>

      <Canvas>
        {/* Executive 8-Metric Connected Breakdown Bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <Stat label="Barbers & Staff" value={count(metrics.barbersCount)} tone="plain" />
          <Stat label="Connected Clients" value={count(metrics.clientsCount)} tone="plain" />
          <Stat label="Total Bookings" value={count(metrics.appointmentsCount)} tone="plain" />
          <Stat label="Upcoming Appts" value={count(metrics.upcomingAppointments)} tone="live" />
          <Stat label="Gross Revenue" value={money(metrics.revenueTotal)} tone="live" />
          <Stat label="Active Services" value={count(metrics.servicesCount)} tone="plain" />
          <Stat label="Locations" value={count(metrics.locationsCount)} tone="plain" />
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1 border-b border-rule-soft pb-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                activeTab === t
                  ? 'bg-ink text-surface font-semibold shadow-sm'
                  : 'text-ink-2 hover:bg-ground hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* TAB 1: Barbers & Staff */}
        {activeTab === 'Barbers & Team' && (
          <Panel flush title={`${barbers.length} Connected Barbers & Staff`}>
            {barbers.length === 0 ? (
              <Empty
                title="No barbers connected yet"
                hint="Share the salon's Join Code with barbers so they can join this shop roster."
              />
            ) : (
              <Scroll>
                <Table>
                  <thead>
                    <Tr>
                      <Th>Barber Name</Th>
                      <Th>Title / Role</Th>
                      <Th>Specialties</Th>
                      <Th>Rating</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Action</Th>
                    </Tr>
                  </thead>
                  <tbody>
                    {barbers.map((b) => (
                      <Tr key={b.id}>
                        <Td>
                          <div className="font-semibold text-ink text-[13px]">{b.name}</div>
                          <div className="text-[11px] font-mono text-ink-3">{shortId(b.id)}</div>
                        </Td>
                        <Td className="text-ink-2 text-[12px]">{b.title || 'Staff'}</Td>
                        <Td>
                          <div className="flex flex-wrap gap-1">
                            {b.specialties?.length ? (
                              b.specialties.map((s) => (
                                <span key={s} className="rounded bg-ground px-1.5 py-0.5 text-[10px] text-ink-2">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-ink-3 italic">None specified</span>
                            )}
                          </div>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-1 text-[12px] text-ink">
                            <Star size={12} className="text-amber-500 fill-amber-500" />
                            <span>{b.rating ? Number(b.rating).toFixed(1) : '—'}</span>
                            <span className="text-[10px] text-ink-3">({b.reviewCount ?? 0})</span>
                          </div>
                        </Td>
                        <Td>
                          {b.active ? <Badge tone="live">ACTIVE</Badge> : <Badge tone="signal">INACTIVE</Badge>}
                        </Td>
                        <Td className="text-right">
                          <button
                            onClick={() => setSelectedBarber({ userId: b.userId, name: b.name })}
                            className="inline-flex items-center gap-1 rounded bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
                          >
                            Portfolio & Schedule
                          </button>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Scroll>
            )}
          </Panel>
        )}

        {/* TAB 2: Connected Clients */}
        {activeTab === 'Connected Clients' && (
          <Panel flush title={`${clients.length} Connected Clients`}>
            {clients.length === 0 ? (
              <Empty
                title="No clients recorded yet"
                hint="Clients will appear here automatically as bookings and customer appointments are created."
              />
            ) : (
              <Scroll>
                <Table>
                  <thead>
                    <Tr>
                      <Th>Client Name</Th>
                      <Th>Phone Number</Th>
                      <Th>Email Address</Th>
                      <Th>Gender</Th>
                      <Th>Allergies & Notes</Th>
                      <Th>Registered</Th>
                    </Tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <Tr key={c.id}>
                        <Td className="font-medium text-ink text-[13px]">{c.name}</Td>
                        <Td className="text-ink-2 text-[12px]">{c.phone || '—'}</Td>
                        <Td className="text-ink-2 text-[12px]">{c.email || '—'}</Td>
                        <Td className="text-ink-2 text-[12px] capitalize">{c.gender || '—'}</Td>
                        <Td>
                          {c.allergies?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {c.allergies.map((a) => (
                                <span key={a.id} className="rounded bg-signal-soft px-1.5 py-0.5 text-[10px] font-medium text-signal">
                                  {a.name} ({a.severity})
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-ink-3">None</span>
                          )}
                        </Td>
                        <Td className="text-ink-3 text-[11px]">{since(c.createdAt)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Scroll>
            )}
          </Panel>
        )}

        {/* TAB 3: Bookings & Agenda */}
        {activeTab === 'Bookings & Agenda' && (
          <Panel flush title={`${appointments.length} Total Bookings Recorded`}>
            {appointments.length === 0 ? (
              <Empty title="No bookings found for this salon" />
            ) : (
              <Scroll>
                <Table>
                  <thead>
                    <Tr>
                      <Th>Scheduled Time</Th>
                      <Th>Customer</Th>
                      <Th>Service</Th>
                      <Th>Duration</Th>
                      <Th>Price</Th>
                      <Th>Status</Th>
                    </Tr>
                  </thead>
                  <tbody>
                    {appointments.slice(0, 50).map((a) => (
                      <Tr key={a.id}>
                        <Td>
                          <div className="font-semibold text-ink text-[12px]">
                            {bookingDate(a.startAt)}
                          </div>
                          <div className="text-[11px] text-ink-3 font-mono">
                            {bookingTime(a.startAt)} -{' '}
                            {bookingTime(a.endAt)}
                          </div>
                        </Td>
                        <Td className="text-ink text-[12px] font-medium">{a.guestName || a.customerName || (a.customerId ? 'Customer' : 'Walk-in')}</Td>
                        <Td className="text-ink-2 text-[12px]">{a.serviceName || 'Hair Service'}</Td>
                        <Td className="text-ink-3 text-[12px]">{a.durationMinutes ? `${a.durationMinutes} min` : '—'}</Td>
                        <Td className="font-semibold text-ink text-[12px] tabular">{money(a.price)}</Td>
                        <Td>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              a.status === 'COMPLETED'
                                ? 'bg-live-soft text-live'
                                : a.status === 'CONFIRMED'
                                ? 'bg-primary/10 text-primary'
                                : a.status === 'CANCELLED'
                                ? 'bg-signal-soft text-signal'
                                : 'bg-ground text-ink-2'
                            }`}
                          >
                            {a.status}
                          </span>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Scroll>
            )}
          </Panel>
        )}

        {/* TAB 4: Services & Catalog */}
        {activeTab === 'Services & Catalog' && (
          <Panel flush title={`${services.length} Catalog Services`}>
            {services.length === 0 ? (
              <Empty title="No services configured in catalog" />
            ) : (
              <Scroll>
                <Table>
                  <thead>
                    <Tr>
                      <Th>Service Name</Th>
                      <Th>Duration</Th>
                      <Th>Price</Th>
                      <Th>State</Th>
                    </Tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <Tr key={s.id}>
                        <Td>
                          <div className="font-semibold text-ink text-[13px]">{s.name}</div>
                          {s.description && <div className="text-[11px] text-ink-3">{s.description}</div>}
                        </Td>
                        <Td className="text-ink-2 text-[12px]">{s.durationMinutes} minutes</Td>
                        <Td className="font-semibold text-ink text-[13px] tabular">{money(s.price)}</Td>
                        <Td>
                          {s.isActive ? <Badge tone="live">ACTIVE</Badge> : <Badge tone="quiet">INACTIVE</Badge>}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Scroll>
            )}
          </Panel>
        )}

        {/* TAB 5: Revenue & Transactions */}
        {activeTab === 'Revenue & Transactions' && (
          <Panel flush title={`${transactions.length} Transactions Recorded`}>
            {transactions.length === 0 ? (
              <Empty title="No transactions recorded" />
            ) : (
              <Scroll>
                <Table>
                  <thead>
                    <Tr>
                      <Th>Transaction ID</Th>
                      <Th>Date</Th>
                      <Th>Type</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                    </Tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 50).map((tx) => (
                      <Tr key={tx.id}>
                        <Td className="font-mono text-[11px] text-ink-2">{shortId(tx.id)}</Td>
                        <Td className="text-[12px] text-ink-3">{dateTime(tx.createdAt)}</Td>
                        <Td className="text-[12px] text-ink font-medium">{tx.type}</Td>
                        <Td className="font-semibold text-ink text-[13px] tabular">{money(tx.amount)}</Td>
                        <Td>
                          <Badge tone={tx.status === 'COMPLETED' ? 'live' : 'plain'}>{tx.status}</Badge>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Scroll>
            )}
          </Panel>
        )}

        {/* TAB 6: Locations & Hours */}
        {activeTab === 'Locations & Hours' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Salon Locations">
              {locations.length === 0 ? (
                <p className="text-[12px] text-ink-3">No physical locations configured yet.</p>
              ) : (
                <div className="space-y-3">
                  {locations.map((l) => (
                    <div key={l.id} className="rounded-lg border border-rule bg-ground p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[13px] text-ink">{l.name}</span>
                        {l.isPrimary && <Badge tone="live">PRIMARY</Badge>}
                      </div>
                      <div className="text-[12px] text-ink-2 mt-1">{l.address}</div>
                      <div className="text-[11px] text-ink-3 mt-0.5">{l.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Operating Hours & Rules">
              {shopHours?.schedule?.length ? (
                <div className="space-y-1.5">
                  {shopHours.schedule.map((h) => (
                    <div key={h.day} className="flex items-center justify-between text-[12px] py-1 border-b border-rule-soft last:border-0">
                      <span className="font-medium text-ink capitalize">{h.day}</span>
                      <span className={h.isOpen ? 'text-ink font-mono' : 'text-ink-3 italic'}>
                        {h.isOpen ? `${h.startTime ?? h.openTime ?? '—'} - ${h.endTime ?? h.closeTime ?? '—'}` : 'Closed'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-ink-3">
                  This shop hasn&apos;t saved its opening hours yet. Each barber&apos;s own working hours still decide when
                  customers can book.
                </p>
              )}
            </Panel>
          </div>
        )}

        {/* TAB 7: Salon Controls */}
        {activeTab === 'Salon Controls' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Shop Operational Status">
              <div className="space-y-3 text-[13px]">
                <div className="flex items-center justify-between py-2 border-b border-rule-soft">
                  <span className="text-ink-2">Booking Status:</span>
                  {tenant.isSuspended ? (
                    <span className="text-signal font-bold">Suspended (Bookings Frozen)</span>
                  ) : (
                    <span className="text-live font-bold">Active & Open for Bookings</span>
                  )}
                </div>
                {tenant.suspendedReason && (
                  <div className="py-2 border-b border-rule-soft">
                    <span className="text-ink-2 block text-[11px]">Suspension Reason:</span>
                    <span className="text-signal font-medium">{tenant.suspendedReason}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-rule-soft">
                  <span className="text-ink-2">Customer Discovery:</span>
                  <span className="font-medium text-ink">{tenant.isListed ? 'Listed on Discover / Nearby' : 'Hidden'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-ink-2">Join Code:</span>
                  <span className="font-mono font-bold text-ink">{tenant.joinCode || 'None'}</span>
                </div>
              </div>
            </Panel>

            <Panel title="Owner Account Status">
              <div className="space-y-3 text-[13px]">
                <div className="flex items-center justify-between py-2 border-b border-rule-soft">
                  <span className="text-ink-2">Login Access:</span>
                  {owner.isBanned ? (
                    <span className="text-signal font-bold">Banned (Login Blocked)</span>
                  ) : (
                    <span className="text-live font-bold">Allowed</span>
                  )}
                </div>
                {owner.bannedReason && (
                  <div className="py-2 border-b border-rule-soft">
                    <span className="text-ink-2 block text-[11px]">Ban Reason:</span>
                    <span className="text-signal font-medium">{owner.bannedReason}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-rule-soft">
                  <span className="text-ink-2">Role:</span>
                  <span className="font-mono font-semibold text-ink">{owner.role}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-ink-2">Account ID:</span>
                  <span className="font-mono text-ink-3 text-[11px]">{owner.id}</span>
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* Barber Detail Modal */}
        {selectedBarber && (
          <BarberDetailModal
            userId={selectedBarber.userId}
            name={selectedBarber.name}
            onClose={() => setSelectedBarber(null)}
          />
        )}

        {/* Suspend Shop Modal */}
        {suspending && (
          <Modal title={`Suspend ${tenant.name}`} onClose={() => setSuspending(false)}>
            <div className="space-y-4">
              <p className="text-[13px] text-ink-2 leading-relaxed">
                Suspending this shop freezes all customer bookings platform-wide. Existing data remains intact.
              </p>
              <Field label="Suspension Reason (Optional)">
                <TextInput
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g., Owner requested freeze, terms violation"
                />
              </Field>
              {suspend.error && <FormError message={suspend.error} />}
              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setSuspending(false)}>Cancel</Button>
                <Button
                  variant="danger"
                  disabled={suspend.pending}
                  onClick={async () => {
                    const result = await suspend.mutate(tenant.id, suspendReason.trim() || undefined);
                    if (result) {
                      setSuspending(false);
                      await refresh();
                    }
                  }}
                >
                  {suspend.pending ? 'Suspending...' : 'Confirm Suspension'}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Ban Owner Modal */}
        {banning && (
          <Modal title={`Ban Owner: ${owner.name}`} onClose={() => setBanning(false)}>
            <div className="space-y-4">
              <p className="text-[13px] text-ink-2 leading-relaxed">
                Banning this owner disables their login credentials across the entire platform.
              </p>
              <Field label="Ban Reason (Required)">
                <TextInput
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g., Chargeback abuse, unauthorized access"
                />
              </Field>
              {ban.error && <FormError message={ban.error} />}
              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setBanning(false)}>Cancel</Button>
                <Button
                  variant="danger"
                  disabled={ban.pending || !banReason.trim()}
                  onClick={async () => {
                    const result = await ban.mutate(owner.id, banReason.trim());
                    if (result) {
                      setBanning(false);
                      await refresh();
                    }
                  }}
                >
                  {ban.pending ? 'Banning...' : 'Confirm Ban'}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Edit Shop Details Modal */}
        {editingShop && (
          <Modal title={`Edit ${tenant.name}`} onClose={() => setEditingShop(false)}>
            <div className="space-y-4">
              <Field label="Shop Name">
                <TextInput value={shopName} onChange={(e) => setShopName(e.target.value)} />
              </Field>
              <Field label="Contact Email">
                <TextInput value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </Field>
              <Field label="Contact Phone">
                <TextInput value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </Field>
              <Field label="Tagline">
                <TextInput value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Short shop motto" />
              </Field>

              {update.error && <FormError message={update.error} />}

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setEditingShop(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={update.pending}
                  onClick={async () => {
                    const result = await update.mutate(tenant.id, {
                      name: shopName.trim() || undefined,
                      contactEmail: contactEmail.trim() || undefined,
                      contactPhone: contactPhone.trim() || undefined,
                      tagline: tagline.trim() || undefined,
                    });
                    if (result) {
                      setEditingShop(false);
                      await refresh();
                    }
                  }}
                >
                  {update.pending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </Canvas>
    </>
  );
}
