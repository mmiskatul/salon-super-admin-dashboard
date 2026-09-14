'use client';

import { useState } from 'react';
import { MapPin, RotateCw, Search } from 'lucide-react';
import { useSoloBarbers } from '@/lib/useSoloBarbers';
import { count, date, initials, money, rating, shortId } from '@/lib/format';
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
import BarberDetailModal from '@/components/ui/BarberDetailModal';

/**
 * Barbers working without a shop.
 *
 * These accounts never appear in the tenant roster — they have no tenantId at all — yet they hold
 * real appointments, catalogues and reviews of their own, which is why Appointment, Review and
 * ServiceItem each carry a nullable tenantId. A platform view built only on `GET /tenants` would
 * miss them entirely, so they get their own screen. The three-call stitch that assembles a row
 * lives in useSoloBarbers.
 */
export default function BarbersPage() {
  const { rows, loading, enriching, error, reload } = useSoloBarbers();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ userId: string; name: string } | null>(null);

  const needle = query.trim().toLowerCase();
  const visible = (rows ?? []).filter((row) => {
    if (!needle) return true;
    const name = row.profile?.name?.toLowerCase() ?? '';
    const business = row.profile?.businessName?.toLowerCase() ?? '';
    return name.includes(needle) || business.includes(needle) || row.id.includes(needle);
  });

  const withCatalogue = (rows ?? []).filter((r) => (r.services ?? 0) > 0).length;
  const withoutCatalogue = (rows ?? []).filter((r) => r.services === 0).length;

  return (
    <>
      <PageHead
        eyebrow="Platform"
        title="Independent barbers"
        lede="Barbers operating without a shop. They take bookings and hold their own service list, but never appear in the shop roster."
        actions={
          <Button onClick={reload} disabled={loading}>
            <RotateCw size={12} className={loading || enriching ? 'animate-spin' : ''} />
            Refresh
          </Button>
        }
      />

      <Canvas>
        {error && <Failed message={error} onRetry={reload} />}
        {loading && !error && <Loading label="Loading independent barbers" />}

        {rows && !error && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="Independent barbers" value={count(rows.length)} />
              <Stat
                label="With a service list"
                value={count(withCatalogue)}
                tone="live"
                pending={enriching && withCatalogue === 0}
              />
              <Stat
                label="Nothing to book"
                value={count(withoutCatalogue)}
                tone={withoutCatalogue > 0 ? 'signal' : 'plain'}
                sub="No services, so customers cannot book them"
                pending={enriching && withoutCatalogue === 0}
              />
            </div>

            <Panel
              flush
              title={`${count(visible.length)} barber${visible.length === 1 ? '' : 's'}`}
              note={enriching ? 'Names and service lists still arriving.' : undefined}
              actions={
                <label className="relative">
                  <Search
                    size={13}
                    className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-3"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search barbers"
                    aria-label="Search barbers"
                    className="w-[170px] rounded-lg border border-rule bg-surface py-[6px] pr-2.5 pl-7 text-[12px] placeholder:text-ink-3 focus:border-primary focus:outline-none"
                  />
                </label>
              }
            >
              {visible.length === 0 ? (
                <div className="p-4">
                  <Empty
                    title={
                      rows.length === 0
                        ? 'No independent barbers on the platform'
                        : 'No barbers match'
                    }
                    hint={
                      rows.length === 0
                        ? 'A barber becomes independent by registering without joining a shop. Once one does, they appear here.'
                        : 'Clear the search to see everyone.'
                    }
                  />
                </div>
              ) : (
                <Scroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Barber</Th>
                        <Th>Trading as</Th>
                        <Th>Based</Th>
                        <Th align="right">Services</Th>
                        <Th align="right">Catalogue value</Th>
                        <Th align="right">Rating</Th>
                        <Th align="right">Joined</Th>
                        <Th align="right">Bookable</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((row) => (
                        <Tr
                          key={row.id}
                          onClick={() =>
                            setSelected({ userId: row.id, name: row.profile?.name ?? shortId(row.id) })
                          }
                        >
                          <Td nowrap={false}>
                            <span className="flex items-center gap-2.5">
                              <span
                                className="tabular inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-ink text-[9px] font-semibold text-white"
                                aria-hidden
                              >
                                {row.profile ? initials(row.profile.name) : '··'}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate">
                                  {row.profile?.name ?? (
                                    <span className="text-ink-3">Loading name…</span>
                                  )}
                                </span>
                                <span className="tabular block text-[11px] text-ink-3">
                                  {shortId(row.id)}
                                </span>
                              </span>
                            </span>
                          </Td>
                          <Td muted>{row.profile?.businessName ?? '—'}</Td>
                          <Td muted nowrap={false}>
                            {row.profile?.address ? (
                              <span className="flex items-start gap-1.5">
                                <MapPin size={12} className="mt-0.5 shrink-0 text-ink-3" />
                                <span className="max-w-[32ch]">{row.profile.address}</span>
                              </span>
                            ) : (
                              '—'
                            )}
                          </Td>
                          <Td align="right" mono muted={row.services == null}>
                            {row.services ?? '—'}
                          </Td>
                          <Td align="right" mono muted>
                            {row.catalogueValue == null ? '—' : money(row.catalogueValue)}
                          </Td>
                          <Td align="right" mono muted>
                            {row.profile ? (
                              <>
                                {rating(row.profile.ratingAvg)}
                                {row.profile.ratingCount > 0 && (
                                  <span className="text-ink-3"> ({row.profile.ratingCount})</span>
                                )}
                              </>
                            ) : (
                              '—'
                            )}
                          </Td>
                          <Td align="right" mono muted>
                            {row.profile ? date(row.profile.createdAt) : '—'}
                          </Td>
                          <Td align="right">
                            {row.services == null ? (
                              <Badge tone="quiet">Checking</Badge>
                            ) : row.services > 0 ? (
                              <Badge tone="live">Yes</Badge>
                            ) : (
                              <Badge tone="signal">No services</Badge>
                            )}
                          </Td>
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
        <BarberDetailModal
          userId={selected.userId}
          name={selected.name}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
