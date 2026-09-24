'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, RotateCw, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { usePlatform } from '@/lib/usePlatform';
import { vitalityOf, type Vitality } from '@/lib/api/platform';
import { createTenant, type Tenant } from '@/lib/api/tenants';
import { useMutation } from '@/lib/useApi';
import { brandColor, count, date, money, rating, since } from '@/lib/format';
import { Button, Canvas, Empty, Failed, Loading, PageHead, Panel } from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { Field, FormError, Modal, Select, TextInput } from '@/components/ui/Form';
import Mark from '@/components/ui/Mark';
import { ceilingOf, Vitals, VitalityTag } from '@/components/ui/Vitals';

type SortKey = 'name' | 'bookings' | 'revenue' | 'newest';

const FILTERS: { key: Vitality | 'all'; label: string }[] = [
  { key: 'all', label: 'All States' },
  { key: 'live', label: 'Taking bookings' },
  { key: 'idle', label: 'No bookings' },
  { key: 'dormant', label: 'Never set up' },
  { key: 'unknown', label: 'Unreachable' },
];

export default function ShopsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tenants, vitals, loading, sweeping, swept, error, reload } = usePlatform();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Vitality | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [creating, setCreating] = useState(false);

  const ceiling = useMemo(() => ceilingOf(Object.values(vitals)), [vitals]);

  const rows = useMemo(() => {
    if (!tenants) return [];
    const needle = query.trim().toLowerCase();

    const matched = tenants.filter((t) => {
      if (filter !== 'all' && vitalityOf(vitals[t.id]) !== filter) return false;
      if (!needle) return true;
      return (
        t.name.toLowerCase().includes(needle) ||
        t.contactEmail.toLowerCase().includes(needle) ||
        t.businessType.toLowerCase().includes(needle)
      );
    });

    const sorted = [...matched];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'bookings':
          return (vitals[b.id]?.appointments ?? 0) - (vitals[a.id]?.appointments ?? 0);
        case 'revenue':
          return (vitals[b.id]?.revenue ?? 0) - (vitals[a.id]?.revenue ?? 0);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return sorted;
  }, [tenants, vitals, query, filter, sort]);

  return (
    <>
      <PageHead
        eyebrow="Platform"
        title="Shops"
        lede="Every tenant on the platform. The four bars on each row are its barbers, services, bookings and reviews — a row of flat ticks is a shop that signed up and never set itself up."
        actions={
          <>
            <Button onClick={reload} disabled={loading || sweeping}>
              <RotateCw size={12} className={sweeping ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus size={12} />
              New shop
            </Button>
          </>
        }
      />

      <Canvas>
        {error && <Failed message={error} onRetry={reload} />}
        {loading && !error && <Loading label="Loading the shop roster" />}

        {tenants && !error && (
          <Panel
            flush
            title={`${count(rows.length)} shop${rows.length === 1 ? '' : 's'}`}
            note={
              sweeping
                ? `Counts still arriving — ${swept} of ${tenants.length} shops read`
                : 'Counts cover the shop’s whole history.'
            }
            actions={
              <div className="flex flex-wrap items-center gap-2.5">
                <label className="relative">
                  <Search
                    size={14}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search shops..."
                    aria-label="Search shops"
                    className="w-[200px] rounded-lg border border-[#E2E8F0] bg-white py-2 pr-3 pl-8 text-[13px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent font-manrope transition-all"
                  />
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label="Sort shops"
                  className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent font-manrope transition-all"
                >
                  <option value="newest">Newest first</option>
                  <option value="name">Name</option>
                  <option value="bookings">Most bookings</option>
                  <option value="revenue">Most revenue</option>
                </select>
              </div>
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-3 bg-[#F8FAFC]/50">
              {/* State Filter pills */}
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    aria-pressed={filter === f.key}
                    className={`rounded-full px-3 py-1 text-[12px] font-manrope transition-all cursor-pointer ${
                      filter === f.key
                        ? 'bg-[#635BFF] text-white shadow-sm shadow-[#635BFF]/20 font-bold'
                        : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B] font-semibold'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Independent barbers aren't shops on the platform side, so they're monitored
                  separately on the Barbers page rather than mixed into this roster. */}
              <Link
                href="/barbers"
                className="text-[12px] font-semibold text-[#635BFF] hover:underline font-manrope"
              >
                Independent barbers are under Barbers →
              </Link>
            </div>

            {rows.length === 0 ? (
              <Empty
                title={tenants.length === 0 ? 'No shops on the platform yet' : 'No shops match'}
                hint={
                  tenants.length === 0
                    ? 'A shop is normally created when an owner registers with a business name. You can also add one here.'
                    : 'Clear the search or pick a different filter.'
                }
                action={
                  tenants.length === 0 ? (
                    <Button variant="primary" onClick={() => setCreating(true)}>
                      <Plus size={12} />
                      New shop
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <Scroll>
                <Table>
                  <thead>
                    <tr>
                      <Th>Shop / Studio</Th>
                      <Th>Vitals</Th>
                      <Th>State</Th>
                      <Th align="right">Barbers</Th>
                      <Th align="right">Services</Th>
                      <Th align="right">Bookings</Th>
                      <Th align="right">Revenue</Th>
                      <Th align="right">Rating</Th>
                      <Th align="right">Last booking</Th>
                      <Th align="right">Joined</Th>
                      <Th align="right">Controls</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((tenant) => {
                      const v = vitals[tenant.id];
                      const color = brandColor(tenant.brandColor);
                      return (
                        <Tr
                          key={tenant.id}
                          accent={color}
                          onClick={() => router.push(`/shops/${tenant.id}`)}
                        >
                          <Td nowrap={false}>
                            <span className="flex items-center gap-2.5">
                              <Mark
                                name={tenant.name}
                                logoUrl={tenant.logoUrl}
                                color={tenant.brandColor}
                              />
                              <span className="min-w-0">
                                <span className="block truncate font-medium">{tenant.name}</span>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  {tenant.isOwnerStudio && (
                                    <span className="rounded bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-bold">
                                      Owner Studio
                                    </span>
                                  )}
                                  {!tenant.isListed && (
                                    <span className="tabular block truncate text-[11px] text-ink-3">Hidden from customers</span>
                                  )}
                                </div>
                              </span>
                            </span>
                          </Td>
                          <Td>
                            <Vitals vitals={v} ceiling={ceiling} color={color} />
                          </Td>
                          <Td>
                            <VitalityTag vitality={vitalityOf(v)} />
                          </Td>
                          <Td align="right" mono muted={v?.staff == null}>
                            {v?.staff ?? '—'}
                          </Td>
                          <Td align="right" mono muted={v?.services == null}>
                            {v?.services ?? '—'}
                          </Td>
                          <Td align="right" mono muted={v?.appointments == null}>
                            {v?.appointments ?? '—'}
                          </Td>
                          <Td align="right" mono muted={v?.revenue == null}>
                            {v?.revenue == null ? '—' : money(v.revenue)}
                          </Td>
                          <Td align="right" mono muted>
                            {rating(tenant.ratingAvg)}
                            {tenant.ratingCount > 0 && (
                              <span className="text-ink-3"> ({tenant.ratingCount})</span>
                            )}
                          </Td>
                          <Td align="right" mono muted>
                            {v?.lastBookingAt ? since(v.lastBookingAt) : '—'}
                          </Td>
                          <Td align="right" mono muted>
                            {date(tenant.createdAt)}
                          </Td>
                          <Td align="right">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link
                                href={`/owners/${tenant.id}`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-semibold text-[#1E293B] hover:bg-[#635BFF] hover:text-white hover:border-[#635BFF] transition-all"
                                title="Open connected Owner Dashboard"
                              >
                                Owner Dashboard
                              </Link>
                            </div>
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

      {creating && (
        <NewShopDialog
          onClose={() => setCreating(false)}
          onCreated={(tenant) => {
            setCreating(false);
            void queryClient.invalidateQueries({ queryKey: ['platform-overview'] });
            router.push(`/shops/${tenant.id}`);
          }}
        />
      )}
    </>
  );
}

/**
 * Creating a shop by hand.
 *
 * This is the exception rather than the rule — a tenant is normally provisioned by service-auth
 * when an owner registers with a business name — so the dialog says so, and it deliberately does
 * not create an owner account to go with the shop. There is no endpoint that does both, and
 * pretending otherwise would leave an operator with a shop nobody can sign in to manage.
 */
function NewShopDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (tenant: Tenant) => void;
}) {
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('Barbershop');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [colour, setColour] = useState('#1e293b');
  const [tagline, setTagline] = useState('');
  const { mutate, pending, error } = useMutation(createTenant);

  function onNameChange(value: string) {
    setName(value);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const created = await mutate({
      name: name.trim(),
      businessType: businessType.trim(),
      contactEmail: contactEmail.trim(),
      ...(contactPhone.trim() ? { contactPhone: contactPhone.trim() } : {}),
      ...(colour ? { brandColor: colour } : {}),
      ...(tagline.trim() ? { tagline: tagline.trim() } : {}),
    });
    if (created) onCreated(created);
  }

  return (
    <Modal
      title="New shop"
      note="Creates the shop record only. It will have no owner account until someone registers against it, or you link one with its join code."
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Shop name">
            <TextInput value={name} onChange={(e) => onNameChange(e.target.value)} required />
          </Field>
          <Field label="Business type">
            <Select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
              <option>Barbershop</option>
              <option>Salon</option>
              <option>Spa</option>
              <option>Nail bar</option>
              <option>Other</option>
            </Select>
          </Field>
          <Field label="Contact email">
            <TextInput
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Contact phone" hint="Optional.">
            <TextInput value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </Field>
          <Field label="Brand colour" hint="Used to identify the shop throughout this console.">
            <span className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                aria-label="Brand colour"
                className="h-[34px] w-12 cursor-pointer rounded-lg border border-rule bg-surface"
              />
              <input
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                aria-label="Brand colour hex"
                className="tabular w-full rounded-lg border border-rule bg-surface px-2.5 py-2 text-[13px] focus:border-primary focus:outline-none"
              />
            </span>
          </Field>
        </div>

        <Field label="Tagline" hint="Optional. Shown to customers on the shop's page.">
          <TextInput value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </Field>

        <div className="flex justify-end gap-2 border-t border-rule-soft pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? 'Creating shop' : 'Create shop'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
