'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Pencil, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import {
  deleteTenant,
  getTenant,
  suspendTenant,
  unsuspendTenant,
  updateTenant,
  type Tenant,
} from '@/lib/api/tenants';
import { removeReview } from '@/lib/api/bookings';
import { getShopDashboard } from '@/lib/api/shop-dashboard';
import { brandColor, count, date, dateTime, money, rating, since, shortId } from '@/lib/format';
import {
  Badge,
  Button,
  Canvas,
  Empty,
  Failed,
  Loading,
  Panel,
  Stat,
} from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { Field, FormError, Modal, TextInput } from '@/components/ui/Form';
import Mark from '@/components/ui/Mark';
import BarberDetailModal from '@/components/ui/BarberDetailModal';

const TABS = [
  'Barbers',
  'Services',
  'Bookings',
  'Reviews',
  'Payments',
  'Memberships',
  'Gift Cards',
  'Locations',
  'Hours',
  'Inventory',
  'Clients',
  'Documents',
] as const;
type Tab = (typeof TABS)[number];

export default function ShopPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('Barbers');
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const unsuspend = useMutation(unsuspendTenant);
  const [selectedBarber, setSelectedBarber] = useState<{ userId: string; name: string } | null>(null);
  const [confirmingReviewRemoval, setConfirmingReviewRemoval] = useState<string | null>(null);
  const removeReviewMutation = useMutation(removeReview);

  const shop = useApi(() => getTenant(tenantId), [tenantId]);
  const shopDashboard = useApi(() => getShopDashboard(tenantId), [tenantId]);

  const tabState = <T,>(rows: T[] | null | undefined) => ({
    data: rows ?? null,
    loading: shopDashboard.loading,
    error: shopDashboard.error,
    refresh: shopDashboard.refresh,
  });
  const staff = tabState(shopDashboard.data?.staff);
  const services = tabState(shopDashboard.data?.services);
  const bookings = tabState(shopDashboard.data?.appointments);
  const reviews = tabState(shopDashboard.data?.reviews);
  const payments = tabState(shopDashboard.data?.transactions);
  const membershipPlans = tabState(shopDashboard.data?.membershipPlans);
  const giftCards = tabState(shopDashboard.data?.giftCards);
  const locations = tabState(shopDashboard.data?.locations);
  const hours = {
    data: shopDashboard.data?.shopHours ?? null,
    loading: shopDashboard.loading,
    error: shopDashboard.error,
    refresh: shopDashboard.refresh,
  };
  const inventory = tabState(shopDashboard.data?.products);
  const clients = tabState(shopDashboard.data?.clients);
  const files = tabState(shopDashboard.data?.files);

  const tenant = shop.data;
  const colour = brandColor(tenant?.brandColor);

  const settled = (payments.data ?? []).filter((t) =>
    ['COMPLETED', 'PAID', 'SUCCEEDED', 'CAPTURED'].includes(String(t.status).toUpperCase()),
  );
  const settledTotal = settled.reduce((sum, t) => sum + Number(t.amount ?? 0), 0);

  if (shop.loading || shopDashboard.loading) {
    return (
      <Canvas>
        <Loading label="Loading shop" />
      </Canvas>
    );
  }

  if (shop.error || shopDashboard.error || !tenant) {
    return (
      <Canvas>
        <Failed
          message={shop.error ?? shopDashboard.error ?? 'That shop could not be loaded.'}
          onRetry={shop.refresh}
        />
        <Link href="/shops" className="text-[13px] text-ink-2 hover:text-ink">
          ← Back to shops
        </Link>
      </Canvas>
    );
  }

  return (
    <>
      {/* The shop's own brand colour rules the header — the one place a tenant's identity takes
          over the console's chrome, so it is unmistakable which shop is on screen. */}
      <header className="border-b border-rule bg-surface">
        <div className="h-1" style={{ backgroundColor: colour }} aria-hidden />
        <div className="px-5 py-6 sm:px-8 lg:px-10">
          <Link
            href="/shops"
            className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-ink-2 hover:text-ink"
          >
            <ArrowLeft size={13} /> All shops
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <Mark name={tenant.name} logoUrl={tenant.logoUrl} color={tenant.brandColor} size={48} />
              <div className="min-w-0">
                <h1 className="font-display text-[26px] leading-none font-extrabold tracking-[-0.03em]">
                  {tenant.name}
                </h1>
                <p className="tabular mt-2 text-[12px] text-ink-2">
                  {tenant.businessType} · joined {date(tenant.createdAt)}
                </p>
                {tenant.tagline && (
                  <p className="mt-2 max-w-[60ch] text-[13px] text-ink-2">{tenant.tagline}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {tenant.isIndividual && (
                    <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold">
                      Independent Barber
                    </span>
                  )}
                  {tenant.isOwnerStudio && (
                    <span className="rounded bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 text-[11px] font-bold">
                      Owner Studio
                    </span>
                  )}
                  {tenant.isSuspended && <Badge tone="signal">Suspended</Badge>}
                  {tenant.isListed ? (
                    <Badge tone="live">Visible to customers</Badge>
                  ) : (
                    <Badge tone="signal">Hidden from customers</Badge>
                  )}
                  {tenant.joinCode && <Badge>Join code {tenant.joinCode}</Badge>}
                  <Badge tone="quiet">{shortId(tenant.id)}</Badge>
                </div>
                {tenant.isSuspended && tenant.suspendedReason && (
                  <p className="mt-2 max-w-[60ch] text-[12px] text-signal">
                    Suspended: {tenant.suspendedReason}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap shrink-0 gap-2">
              <Button
                variant="secondary"
                onClick={() => router.push(`/owners/${tenant.id}`)}
                title="Inspect Owner Dashboard with financial & staff overview"
              >
                <ExternalLink size={12} />
                Owner Dashboard
              </Button>
              <Button onClick={() => setEditing(true)}>
                <Pencil size={12} />
                Edit shop
              </Button>
              {tenant.isSuspended ? (
                <Button
                  onClick={async () => {
                    const result = await unsuspend.mutate(tenant.id);
                    if (result) {
                      shop.setData(result);
                      await shopDashboard.refresh();
                    }
                  }}
                  disabled={unsuspend.pending}
                >
                  <ShieldCheck size={12} />
                  {unsuspend.pending ? 'Unsuspending' : 'Unsuspend'}
                </Button>
              ) : (
                <Button onClick={() => setSuspending(true)}>
                  <ShieldAlert size={12} />
                  Suspend
                </Button>
              )}
              <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
                <Trash2 size={12} />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Canvas>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <Stat label="Barbers" value={count(staff.data?.length ?? 0)} pending={staff.loading} />
          <Stat
            label="Services"
            value={count(services.data?.length ?? 0)}
            sub={
              services.data
                ? `${count(services.data.filter((s) => s.isActive !== false).length)} active`
                : undefined
            }
            pending={services.loading}
          />
          <Stat
            label="Bookings"
            value={count(bookings.data?.length ?? 0)}
            pending={bookings.loading}
          />
          <Stat
            label="Settled revenue"
            value={money(settledTotal)}
            sub={`${count(settled.length)} of ${count(payments.data?.length ?? 0)} transactions`}
            pending={payments.loading}
          />
          <Stat
            label="Rating"
            value={rating(tenant.ratingAvg)}
            sub={`${count(tenant.ratingCount)} reviews counted`}
          />
        </div>

        <Panel flush>
          <div className="flex flex-wrap gap-1 border-b border-rule-soft px-4 py-2.5">
            {TABS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setTab(name)}
                aria-pressed={tab === name}
                className={`rounded-full px-2.5 py-1 text-[12px] transition-colors ${
                  tab === name ? 'bg-primary text-white' : 'text-ink-2 hover:bg-ground hover:text-ink'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="p-4">
            {tab === 'Barbers' && (
              <Section state={staff} empty="No barbers on this shop's books." emptyHint="Barbers appear here once the owner adds them, or once one joins with the shop's code.">
                {(rows) => (
                  <Scroll>
                    <Table>
                      <thead>
                        <tr>
                          <Th>Name</Th>
                          <Th>Title</Th>
                          <Th>Specialties</Th>
                          <Th align="right">Rating</Th>
                          <Th align="right">Reviews</Th>
                          <Th align="right">Experience</Th>
                          <Th align="right">Active</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((s) => (
                          <Tr key={s.id} onClick={() => setSelectedBarber({ userId: s.userId, name: s.name })}>
                            <Td>{s.name}</Td>
                            <Td muted>{s.title ?? '—'}</Td>
                            <Td muted nowrap={false}>
                              {s.specialties.length > 0 ? s.specialties.join(', ') : '—'}
                            </Td>
                            <Td align="right" mono>{rating(s.rating)}</Td>
                            <Td align="right" mono muted>{s.reviewCount}</Td>
                            <Td align="right" mono muted>
                              {s.experienceYears ? `${s.experienceYears}y` : '—'}
                            </Td>
                            <Td align="right">
                              {s.active ? <Badge tone="live">Yes</Badge> : <Badge tone="signal">No</Badge>}
                            </Td>
                          </Tr>
                        ))}
                      </tbody>
                    </Table>
                  </Scroll>
                )}
              </Section>
            )}

            {tab === 'Services' && (
              <Section
                state={services}
                empty="This shop has no services."
                emptyHint="Customers cannot book anything until the owner adds at least one service."
              >
                {(rows) => (
                  <Scroll>
                    <Table>
                      <thead>
                        <tr>
                          <Th>Service</Th>
                          <Th align="right">Duration</Th>
                          <Th align="right">Price</Th>
                          <Th align="right">Bookable</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((s) => (
                          <Tr key={s.id}>
                            <Td nowrap={false}>
                              <span className="font-medium">{s.name}</span>
                              {s.description && (
                                <span className="mt-0.5 block max-w-[52ch] text-[12px] text-ink-2">
                                  {s.description}
                                </span>
                              )}
                            </Td>
                            <Td align="right" mono muted>{s.durationMinutes} min</Td>
                            <Td align="right" mono>{money(s.price)}</Td>
                            <Td align="right">
                              {s.isActive !== false ? (
                                <Badge tone="live">Yes</Badge>
                              ) : (
                                // Worth calling out rather than hiding: a service is retired by
                                // flipping isActive, and "my services vanished" is usually this.
                                <Badge tone="signal">Retired</Badge>
                              )}
                            </Td>
                          </Tr>
                        ))}
                      </tbody>
                    </Table>
                  </Scroll>
                )}
              </Section>
            )}

            {tab === 'Bookings' && (
              <Section state={bookings} empty="This shop has never taken a booking.">
                {(rows) => {
                  const recent = [...rows].sort(
                    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
                  );
                  return (
                    <Scroll>
                      <Table>
                        <thead>
                          <tr>
                            <Th>When</Th>
                            <Th>Service</Th>
                            <Th>Customer</Th>
                            <Th>Status</Th>
                            <Th align="right">Price</Th>
                            <Th align="right">Booked</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {recent.slice(0, 100).map((a) => (
                            <Tr key={a.id}>
                              <Td mono>{dateTime(a.startAt)}</Td>
                              <Td muted>{a.serviceName ?? '—'}</Td>
                              <Td muted>
                                {a.guestName ?? (a.customerId ? shortId(a.customerId) : '—')}
                                {a.isWalkIn && <span className="text-ink-3"> · walk-in</span>}
                              </Td>
                              <Td>
                                <StatusBadge status={a.status} />
                              </Td>
                              <Td align="right" mono>{money(a.price)}</Td>
                              <Td align="right" mono muted>{since(a.createdAt)}</Td>
                            </Tr>
                          ))}
                        </tbody>
                      </Table>
                      {recent.length > 100 && (
                        <p className="px-3 py-3 text-[12px] text-ink-2">
                          Showing the 100 most recent of {count(recent.length)} bookings.
                        </p>
                      )}
                    </Scroll>
                  );
                }}
              </Section>
            )}

            {tab === 'Reviews' && (
              <Section state={reviews} empty="No reviews for this shop yet.">
                {(rows) => (
                  <ul className="divide-y divide-rule-soft">
                    {[...rows]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((r) => (
                        <li key={r.id} className="py-3 first:pt-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="tabular text-[13px] font-semibold">{r.rating}/5</span>
                              <span className="tabular text-[11px] text-ink-3">
                                {date(r.createdAt)}
                              </span>
                              {r.replyText ? (
                                <Badge tone="live">Replied</Badge>
                              ) : (
                                <Badge tone="quiet">No reply</Badge>
                              )}
                            </div>
                            {confirmingReviewRemoval === r.id ? (
                              <div className="flex shrink-0 items-center gap-2 text-[11px]">
                                <span className="text-ink-2">Remove this review?</span>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingReviewRemoval(null)}
                                  className="text-ink-2 hover:text-ink"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={removeReviewMutation.pending}
                                  onClick={async () => {
                                    const result = await removeReviewMutation.mutate(r.id);
                                    if (result !== null) {
                                      setConfirmingReviewRemoval(null);
                                      void reviews.refresh();
                                    }
                                  }}
                                  className="font-medium text-signal hover:opacity-70"
                                >
                                  {removeReviewMutation.pending ? 'Removing…' : 'Confirm'}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmingReviewRemoval(r.id)}
                                className="shrink-0 text-ink-3 hover:text-signal"
                                title="Remove this review"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                          {removeReviewMutation.error && confirmingReviewRemoval === r.id && (
                            <p className="mt-1.5 text-[11px] text-signal">{removeReviewMutation.error}</p>
                          )}
                          {r.comment && (
                            <p className="mt-1.5 max-w-[70ch] text-[13px] leading-relaxed">{r.comment}</p>
                          )}
                          {r.replyText && (
                            <p className="mt-2 max-w-[70ch] border-l-2 border-rule pl-3 text-[12px] leading-relaxed text-ink-2">
                              {r.replyText}
                            </p>
                          )}
                        </li>
                      ))}
                  </ul>
                )}
              </Section>
            )}

            {tab === 'Payments' && (
              <Section state={payments} empty="No transactions recorded for this shop.">
                {(rows) => (
                  <Scroll>
                    <Table>
                      <thead>
                        <tr>
                          <Th>Recorded</Th>
                          <Th>Type</Th>
                          <Th>Status</Th>
                          <Th>Booking</Th>
                          <Th align="right">Amount</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...rows]
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((t) => (
                            <Tr key={t.id}>
                              <Td mono>{dateTime(t.createdAt)}</Td>
                              <Td muted>{t.type}</Td>
                              <Td>
                                <StatusBadge status={t.status} />
                              </Td>
                              <Td mono muted>{shortId(t.appointmentId)}</Td>
                              <Td align="right" mono>{money(t.amount)}</Td>
                            </Tr>
                          ))}
                      </tbody>
                    </Table>
                  </Scroll>
                )}
              </Section>
            )}

            {tab === 'Memberships' && (
              <Section
                state={membershipPlans}
                empty="This shop has no membership plans."
                emptyHint="Membership tiers a customer can subscribe to for recurring benefits — none set up yet."
              >
                {(rows) => (
                  <Scroll>
                    <Table>
                      <thead>
                        <tr>
                          <Th>Plan</Th>
                          <Th align="right">Price</Th>
                          <Th align="right">Billing</Th>
                          <Th align="right">Included bookings</Th>
                          <Th align="right">Discount</Th>
                          <Th align="right">Active</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((p) => (
                          <Tr key={p.id}>
                            <Td nowrap={false}>{p.name}</Td>
                            <Td align="right" mono>{money(p.price)}</Td>
                            <Td align="right" mono muted>
                              every {p.billingPeriodMonths} mo
                            </Td>
                            <Td align="right" mono muted>{p.includedBookings ?? '—'}</Td>
                            <Td align="right" mono muted>
                              {p.discountPercent ? `${p.discountPercent}%` : '—'}
                            </Td>
                            <Td align="right">
                              {p.active ? <Badge tone="live">Yes</Badge> : <Badge tone="signal">No</Badge>}
                            </Td>
                          </Tr>
                        ))}
                      </tbody>
                    </Table>
                  </Scroll>
                )}
              </Section>
            )}

            {tab === 'Gift Cards' && (
              <Section
                state={giftCards}
                empty="No gift cards issued by this shop."
                emptyHint="Created when the owner sells one — none have been issued yet."
              >
                {(rows) => (
                  <Scroll>
                    <Table>
                      <thead>
                        <tr>
                          <Th>Code</Th>
                          <Th align="right">Balance remaining</Th>
                          <Th align="right">Expires</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((g) => (
                          <Tr key={g.id}>
                            <Td mono>{g.code}</Td>
                            <Td align="right" mono>{money(g.balance)}</Td>
                            <Td align="right" mono muted>{g.expiresAt ? date(g.expiresAt) : 'Never'}</Td>
                          </Tr>
                        ))}
                      </tbody>
                    </Table>
                  </Scroll>
                )}
              </Section>
            )}

            {tab === 'Locations' && (
              <Section
                state={locations}
                empty="No address on file."
                emptyHint="Customers see the shop's address on its details page, so a shop with none is hard to find."
              >
                {(rows) => (
                  <ul className="divide-y divide-rule-soft">
                    {rows.map((l) => (
                      <li key={l.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3 first:pt-0">
                        <span className="text-[13px] font-medium">{l.name}</span>
                        {l.isPrimary && <Badge tone="live">Primary</Badge>}
                        <span className="text-[13px] text-ink-2">{l.address}</span>
                        <span className="tabular text-[12px] text-ink-3">{l.phone}</span>
                        {l.latitude != null && l.longitude != null && (
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${l.latitude}&mlon=${l.longitude}#map=17/${l.latitude}/${l.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[12px] text-ink-2 hover:text-ink"
                          >
                            Map <ExternalLink size={11} />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            )}

            {tab === 'Hours' && (
              <div className="space-y-6">
                {hours.loading && <Loading label="Loading shop hours and policies" />}
                {hours.error && <Failed message={hours.error} onRetry={hours.refresh} />}
                {hours.data && (
                  <>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="rounded-lg border border-rule bg-ground p-3">
                        <p className="eyebrow text-[10px]!">Buffer Before</p>
                        <p className="mt-1 font-semibold text-ink">{hours.data.bufferBeforeMin} min</p>
                      </div>
                      <div className="rounded-lg border border-rule bg-ground p-3">
                        <p className="eyebrow text-[10px]!">Buffer After</p>
                        <p className="mt-1 font-semibold text-ink">{hours.data.bufferAfterMin} min</p>
                      </div>
                      <div className="rounded-lg border border-rule bg-ground p-3">
                        <p className="eyebrow text-[10px]!">Minimum Notice</p>
                        <p className="mt-1 font-semibold text-ink">{hours.data.minNotice}</p>
                      </div>
                      <div className="rounded-lg border border-rule bg-ground p-3">
                        <p className="eyebrow text-[10px]!">Booking Window</p>
                        <p className="mt-1 font-semibold text-ink">{hours.data.bookingWindow}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-[13px] font-semibold">Weekly Operating Schedule</h3>
                      <Scroll>
                        <Table>
                          <thead>
                            <tr>
                              <Th>Day</Th>
                              <Th>Status</Th>
                              <Th align="right">Open</Th>
                              <Th align="right">Close</Th>
                            </tr>
                          </thead>
                          <tbody>
                            {(Array.isArray(hours.data.schedule) ? hours.data.schedule : []).map((d) => (
                              <Tr key={d.day}>
                                <Td><span className="font-medium">{d.day}</span></Td>
                                <Td>
                                  {d.isOpen ? <Badge tone="live">Open</Badge> : <Badge tone="quiet">Closed</Badge>}
                                </Td>
                                <Td align="right" mono muted>{d.isOpen ? d.openTime ?? '—' : '—'}</Td>
                                <Td align="right" mono muted>{d.isOpen ? d.closeTime ?? '—' : '—'}</Td>
                              </Tr>
                            ))}
                          </tbody>
                        </Table>
                      </Scroll>
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === 'Inventory' && (
              <Section state={inventory} empty="No inventory products recorded for this shop.">
                {(rows) => (
                  <Scroll>
                    <Table>
                      <thead>
                        <tr>
                          <Th>Product</Th>
                          <Th>SKU / Barcode</Th>
                          <Th align="right">Stock qty</Th>
                          <Th align="right">Reorder level</Th>
                          <Th align="right">Cost price</Th>
                          <Th align="right">Sale price</Th>
                          <Th align="right">Status</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((p) => {
                          const isLowStock = p.quantity <= p.reorderLevel;
                          return (
                            <Tr key={p.id}>
                              <Td>
                                <span className="font-medium text-ink">{p.name}</span>
                                {p.brand && <span className="ml-1 text-[11px] text-ink-3">({p.brand})</span>}
                              </Td>
                              <Td mono muted>{p.sku || p.barcode || '—'}</Td>
                              <Td align="right" mono>
                                <span className={isLowStock ? 'font-bold text-signal' : ''}>
                                  {p.quantity} {p.unit ?? ''}
                                </span>
                              </Td>
                              <Td align="right" mono muted>{p.reorderLevel}</Td>
                              <Td align="right" mono>{money(p.unitCost)}</Td>
                              <Td align="right" mono>{p.salePrice != null ? money(p.salePrice) : '—'}</Td>
                              <Td align="right">
                                {isLowStock ? (
                                  <Badge tone="signal">Low stock</Badge>
                                ) : (
                                  <Badge tone="live">In stock</Badge>
                                )}
                              </Td>
                            </Tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </Scroll>
                )}
              </Section>
            )}

            {tab === 'Clients' && (
              <Section state={clients} empty="No client CRM records registered for this shop.">
                {(rows) => (
                  <Scroll>
                    <Table>
                      <thead>
                        <tr>
                          <Th>Client name</Th>
                          <Th>Contact phone</Th>
                          <Th>Email</Th>
                          <Th>Gender</Th>
                          <Th>Allergies / Flags</Th>
                          <Th align="right">Added</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((c) => (
                          <Tr key={c.id}>
                            <Td>
                              <span className="font-medium text-ink">{c.name}</span>
                              {c.notes && (
                                <span className="block text-[11px] text-ink-3 line-clamp-1">{c.notes}</span>
                              )}
                            </Td>
                            <Td mono muted>{c.phone ?? '—'}</Td>
                            <Td muted>{c.email ?? '—'}</Td>
                            <Td muted>{c.gender ? c.gender.toLowerCase() : '—'}</Td>
                            <Td>
                              {c.allergies && c.allergies.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {c.allergies.map((a) => (
                                    <Badge key={a.id} tone="signal">
                                      {a.name} ({a.severity.toLowerCase()})
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-ink-3">None recorded</span>
                              )}
                            </Td>
                            <Td align="right" mono muted>
                              {date(c.createdAt)}
                            </Td>
                          </Tr>
                        ))}
                      </tbody>
                    </Table>
                  </Scroll>
                )}
              </Section>
            )}

            {tab === 'Documents' && (
              <Section state={files} empty="No stored documents or assets found for this shop.">
                {(rows) => (
                  <Scroll>
                    <Table>
                      <thead>
                        <tr>
                          <Th>Document name</Th>
                          <Th>Category / Kind</Th>
                          <Th align="right">File size</Th>
                          <Th align="right">Uploaded</Th>
                          <Th align="right">Link</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((f) => (
                          <Tr key={f.id}>
                            <Td>
                              <span className="font-medium text-ink">{f.name}</span>
                            </Td>
                            <Td>
                              <Badge tone="plain">{f.kind}</Badge>
                            </Td>
                            <Td align="right" mono muted>
                              {Math.round(f.sizeBytes / 1024)} KB
                            </Td>
                            <Td align="right" mono muted>
                              {date(f.createdAt)}
                            </Td>
                            <Td align="right">
                              <a
                                href={f.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                              >
                                <span>View file</span>
                                <ExternalLink size={10} />
                              </a>
                            </Td>
                          </Tr>
                        ))}
                      </tbody>
                    </Table>
                  </Scroll>
                )}
              </Section>
            )}
          </div>
        </Panel>
      </Canvas>

      {editing && (
        <EditShopDialog
          tenant={tenant}
          onClose={() => setEditing(false)}
          onSaved={(next) => {
            shop.setData(next);
            void shopDashboard.refresh();
            setEditing(false);
          }}
        />
      )}

      {confirmingDelete && (
        <DeleteShopDialog
          tenant={tenant}
          onClose={() => setConfirmingDelete(false)}
          onDeleted={() => router.push('/shops')}
        />
      )}

      {suspending && (
        <SuspendShopDialog
          tenant={tenant}
          onClose={() => setSuspending(false)}
          onSuspended={(next) => {
            shop.setData(next);
            void shopDashboard.refresh();
            setSuspending(false);
          }}
        />
      )}

      {selectedBarber && (
        <BarberDetailModal
          userId={selectedBarber.userId}
          name={selectedBarber.name}
          onClose={() => setSelectedBarber(null)}
        />
      )}
    </>
  );
}

/** Threads one tab's loading / failed / empty / loaded states through a single shape. */
function Section<T>({
  state,
  empty,
  emptyHint,
  children,
}: {
  state: { data: T[] | null; loading: boolean; error: string | null; refresh: () => Promise<void> };
  empty: string;
  emptyHint?: string;
  children: (rows: T[]) => React.ReactNode;
}) {
  if (state.loading) return <Loading />;
  if (state.error) return <Failed message={state.error} onRetry={state.refresh} />;
  if (!state.data || state.data.length === 0) return <Empty title={empty} hint={emptyHint} />;
  return <>{children(state.data)}</>;
}

/** One badge for every status string the booking and payment services write. */
function StatusBadge({ status }: { status: string }) {
  const value = String(status ?? '').toUpperCase();
  if (['COMPLETED', 'PAID', 'CONFIRMED', 'SUCCEEDED', 'CAPTURED'].includes(value)) {
    return <Badge tone="live">{value.toLowerCase()}</Badge>;
  }
  if (['CANCELLED', 'NO_SHOW', 'FAILED', 'REFUNDED'].includes(value)) {
    return <Badge tone="signal">{value.toLowerCase().replace('_', ' ')}</Badge>;
  }
  return <Badge>{value.toLowerCase().replace('_', ' ')}</Badge>;
}

function EditShopDialog({
  tenant,
  onClose,
  onSaved,
}: {
  tenant: Tenant;
  onClose: () => void;
  onSaved: (tenant: Tenant) => void;
}) {
  const [name, setName] = useState(tenant.name);
  const [contactEmail, setContactEmail] = useState(tenant.contactEmail);
  const [contactPhone, setContactPhone] = useState(tenant.contactPhone ?? '');
  const [colour, setColour] = useState(brandColor(tenant.brandColor));
  const [tagline, setTagline] = useState(tenant.tagline ?? '');
  const [isListed, setIsListed] = useState(tenant.isListed);
  const { mutate, pending, error } = useMutation(updateTenant);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next = await mutate(tenant.id, {
      name: name.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      brandColor: colour,
      tagline: tagline.trim(),
      isListed,
    });
    if (next) onSaved(next);
  }

  return (
    <Modal title="Edit shop" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Shop name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Contact email">
            <TextInput
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Contact phone">
            <TextInput value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </Field>
          <Field label="Brand colour">
            <span className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                aria-label="Brand colour"
                className="h-8.5 w-12 cursor-pointer rounded-lg border border-rule bg-surface"
              />
              <input
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                aria-label="Brand colour hex"
                className="tabular w-full rounded-lg border border-rule bg-surface px-2.5 py-2 text-[13px] focus:border-primary focus:outline-none"
              />
            </span>
          </Field>
          <Field label="Tagline">
            <TextInput value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </Field>
        </div>

        <label
          aria-label="Visible to customers"
          className="flex items-start gap-2.5 border border-rule bg-ground px-3 py-2.5"
        >
          <input
            type="checkbox"
            checked={isListed}
            onChange={(e) => setIsListed(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <span className="block text-[13px] font-medium">Visible to customers</span>
            <span className="mt-0.5 block max-w-[52ch] text-[12px] leading-relaxed text-ink-2">
              Turn this off to take the shop out of customer search and discovery without deleting
              anything. Its existing bookings are unaffected.
            </span>
          </span>
        </label>

        <div className="flex justify-end gap-2 border-t border-rule-soft pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? 'Saving' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Suspending a shop.
 *
 * Lighter than the delete dialog's typed confirmation — this is fully reversible (Unsuspend is
 * right there once it's done) and touches no other data, unlike delete. A reason is optional but
 * encouraged: it's shown on the shop page and recorded in the admin audit log either way.
 */
function SuspendShopDialog({
  tenant,
  onClose,
  onSuspended,
}: {
  tenant: Tenant;
  onClose: () => void;
  onSuspended: (next: Tenant) => void;
}) {
  const [reason, setReason] = useState('');
  const { mutate, pending, error } = useMutation(suspendTenant);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = await mutate(tenant.id, reason.trim() || undefined);
    if (result) onSuspended(result);
  }

  return (
    <Modal title={`Suspend ${tenant.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="max-w-[56ch] text-[13px] leading-relaxed">
          Blocks this shop from taking any new bookings platform-wide, immediately. Existing
          bookings, reviews, and staff records are untouched, and this can be reversed at any time.
        </p>

        <FormError message={error} />

        <Field label="Reason (optional)" hint="Shown on the shop page and recorded in the audit log.">
          <TextInput value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
        </Field>

        <div className="flex justify-end gap-2 border-t border-rule-soft pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger" disabled={pending}>
            {pending ? 'Suspending' : 'Suspend shop'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Deleting a shop.
 *
 * Typing the shop name is the confirmation rather than a plain "are you sure": DELETE /tenants/:id
 * is the single most destructive call this console can make, and the records that hang off a
 * tenant live in four other services that this delete does not touch. The dialog says so.
 */
function DeleteShopDialog({
  tenant,
  onClose,
  onDeleted,
}: {
  tenant: Tenant;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [typed, setTyped] = useState('');
  const { mutate, pending, error } = useMutation(deleteTenant);
  const armed = typed.trim() === tenant.name;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!armed) return;
    const result = await mutate(tenant.id);
    if (result !== null) onDeleted();
  }

  return (
    <Modal title={`Delete ${tenant.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="max-w-[56ch] text-[13px] leading-relaxed">
          This removes the shop record from the platform. Its bookings, transactions, reviews and
          staff records live in other services and are <strong>not</strong> deleted with it — they
          will be left pointing at a shop that no longer exists.
        </p>

        <FormError message={error} />

        <Field label="Type the shop name to confirm" hint={`Enter ${tenant.name}`}>
          <TextInput
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="tabular"
            autoFocus
          />
        </Field>

        <div className="flex justify-end gap-2 border-t border-rule-soft pt-4">
          <Button onClick={onClose}>Keep shop</Button>
          <Button type="submit" variant="danger" disabled={!armed || pending}>
            {pending ? 'Deleting' : 'Delete shop'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
