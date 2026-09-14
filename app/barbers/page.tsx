'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RotateCw,
  Search,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Scissors,
  Users,
  Calendar,
  DollarSign,
  Store,
  Eye,
  Star,
  Lock,
  Unlock,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { listAllBarbers, type BarberSummary } from '@/lib/api/barbers';
import { banUser, unbanUser } from '@/lib/api/users';
import { count, date, initials, money, rating, shortId, brandColor } from '@/lib/format';
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
import BarberDetailModal from '@/components/ui/BarberDetailModal';
import Mark from '@/components/ui/Mark';

type TypeFilter = 'ALL' | 'SHOP_STAFF' | 'SOLO';
type StatusFilter = 'ALL' | 'ACTIVE' | 'BANNED';

export default function BarbersDirectoryPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [quickPreview, setQuickPreview] = useState<{ userId: string; name: string } | null>(null);

  // Moderation state
  const [banningTarget, setBanningTarget] = useState<BarberSummary | null>(null);
  const [banReason, setBanReason] = useState('');

  const ban = useMutation(banUser);
  const unban = useMutation(unbanUser);

  const { data: barbers, loading, error, refresh } = useApi(() => listAllBarbers(), []);
  const rows = barbers ?? [];

  // Summary Metrics across all barbers
  const totals = useMemo(() => {
    let shopStaff = 0;
    let solo = 0;
    let banned = 0;
    let active = 0;

    for (const b of rows) {
      if (b.type === 'SOLO') solo++;
      else shopStaff++;

      if (b.isBanned) banned++;
      else active++;
    }

    return {
      total: rows.length,
      shopStaff,
      solo,
      active,
      banned,
    };
  }, [rows]);

  // Filtered rows
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((b) => {
      if (typeFilter !== 'ALL' && b.type !== typeFilter) return false;
      if (statusFilter === 'ACTIVE' && b.isBanned) return false;
      if (statusFilter === 'BANNED' && !b.isBanned) return false;

      if (!q) return true;
      const nameMatch = b.name.toLowerCase().includes(q);
      const emailMatch = b.email.toLowerCase().includes(q);
      const shopMatch = b.tenantName?.toLowerCase().includes(q);
      const idMatch = b.id.toLowerCase().includes(q);
      return nameMatch || emailMatch || shopMatch || idMatch;
    });
  }, [rows, query, typeFilter, statusFilter]);

  async function handleBanSubmit() {
    if (!banningTarget) return;
    try {
      await ban.mutate(banningTarget.id, banReason.trim() || undefined);
      setBanningTarget(null);
      setBanReason('');
      refresh();
    } catch {
      // Handled by useMutation
    }
  }

  async function handleUnban(b: BarberSummary) {
    try {
      await unban.mutate(b.id);
      refresh();
    } catch {
      // Handled by useMutation
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Platform"
        title="Barbers & Stylists"
        lede="Complete directory of all platform barbers: both shop-linked team stylists and independent solo operators, with deep live activity inspection."
        actions={
          <Button onClick={refresh} disabled={loading}>
            <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        }
      />

      <Canvas>
        {error && <Failed message={error} onRetry={refresh} />}
        {loading && !error && <Loading label="Loading platform barbers..." />}

        {!loading && !error && (
          <>
            {/* Top Stat Bar */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="Total Barbers" value={count(totals.total)} />
              <Stat label="Shop Stylists" value={count(totals.shopStaff)} tone="live" />
              <Stat label="Independent Solo" value={count(totals.solo)} tone="plain" />
              <Stat label="Active" value={count(totals.active)} tone="live" />
              <Stat
                label="Banned"
                value={count(totals.banned)}
                tone={totals.banned > 0 ? 'signal' : 'plain'}
                sub={totals.banned > 0 ? 'Access suspended' : 'No banned accounts'}
              />
            </div>

            {/* Filter & Search Panel */}
            <Panel flush>
              <div className="flex flex-col gap-3 border-b border-rule-soft p-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Segment Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="eyebrow mr-1 text-[11px]">Type:</span>
                  {(['ALL', 'SHOP_STAFF', 'SOLO'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors ${
                        typeFilter === t
                          ? 'bg-ink text-white'
                          : 'bg-ground text-ink-2 hover:bg-ground-soft hover:text-ink'
                      }`}
                    >
                      {t === 'ALL' && 'All Barbers'}
                      {t === 'SHOP_STAFF' && 'Shop-Linked'}
                      {t === 'SOLO' && 'Solo / Independent'}
                    </button>
                  ))}

                  <div className="mx-2 hidden h-4 w-px bg-rule sm:block" />

                  <span className="eyebrow mr-1 text-[11px]">Status:</span>
                  {(['ALL', 'ACTIVE', 'BANNED'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors ${
                        statusFilter === s
                          ? 'bg-ink text-white'
                          : 'bg-ground text-ink-2 hover:bg-ground-soft hover:text-ink'
                      }`}
                    >
                      {s === 'ALL' && 'All Statuses'}
                      {s === 'ACTIVE' && 'Active Only'}
                      {s === 'BANNED' && 'Banned'}
                    </button>
                  ))}
                </div>

                {/* Search Box */}
                <label className="relative min-w-[220px]">
                  <Search
                    size={13}
                    className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-3"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, shop, email, id..."
                    aria-label="Search barbers"
                    className="w-full rounded-lg border border-rule bg-surface py-[6px] pr-2.5 pl-7 text-[12px] placeholder:text-ink-3 focus:border-primary focus:outline-none"
                  />
                </label>
              </div>

              {/* Table */}
              {visible.length === 0 ? (
                <div className="p-8">
                  <Empty
                    title={rows.length === 0 ? 'No barbers registered yet' : 'No barbers match filter'}
                    hint={
                      rows.length === 0
                        ? 'Barbers appear here as soon as they register on the platform or join a shop.'
                        : 'Try adjusting your search query or filter switches above.'
                    }
                  />
                </div>
              ) : (
                <Scroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Barber / Stylist</Th>
                        <Th>Affiliation</Th>
                        <Th>Type</Th>
                        <Th align="right">Rating</Th>
                        <Th align="right">Joined</Th>
                        <Th align="right">Status</Th>
                        <Th align="right">Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((b) => {
                        const color = brandColor(b.shopBrandColor);
                        return (
                          <Tr key={b.id}>
                            {/* Barber identity */}
                            <Td nowrap={false}>
                              <Link
                                href={`/barbers/${b.id}`}
                                className="group flex items-center gap-2.5 font-medium hover:text-primary"
                              >
                                <span
                                  className="tabular inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-[11px] font-semibold text-white shadow-xs"
                                  aria-hidden
                                >
                                  {initials(b.name)}
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate font-semibold text-ink group-hover:text-primary">
                                    {b.name}
                                  </span>
                                  <span className="tabular block text-[11px] text-ink-3">
                                    {b.email !== '—' ? b.email : shortId(b.id)}
                                  </span>
                                </span>
                              </Link>
                            </Td>

                            {/* Shop Affiliation */}
                            <Td muted nowrap={false}>
                              {b.tenantId ? (
                                <Link
                                  href={`/shops/${b.tenantId}`}
                                  className="flex items-center gap-1.5 hover:text-ink"
                                >
                                  <Mark name={b.tenantName ?? 'Shop'} color={color} size={18} />
                                  <span className="truncate text-[12px] font-medium">
                                    {b.tenantName ?? shortId(b.tenantId)}
                                  </span>
                                </Link>
                              ) : (
                                <span className="flex items-center gap-1 text-ink-3 text-[12px]">
                                  <Sparkles size={12} />
                                  Independent Solo
                                </span>
                              )}
                            </Td>

                            {/* Type Pill */}
                            <Td>
                              {b.type === 'SHOP_STAFF' ? (
                                <Badge tone="plain">
                                  <Store size={10} className="mr-1" />
                                  Shop Stylist
                                </Badge>
                              ) : (
                                <Badge tone="live">
                                  <Scissors size={10} className="mr-1" />
                                  Solo Barber
                                </Badge>
                              )}
                            </Td>

                            {/* Rating */}
                            <Td align="right" mono muted>
                              {Number(b.ratingAvg) > 0 ? (
                                <span className="flex items-center justify-end gap-1 font-semibold text-ink">
                                  <Star size={11} className="fill-amber-400 text-amber-400" />
                                  {rating(b.ratingAvg)}
                                  {b.ratingCount > 0 && (
                                    <span className="text-ink-3 font-normal">({b.ratingCount})</span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-ink-3">—</span>
                              )}
                            </Td>

                            {/* Joined Date */}
                            <Td align="right" mono muted>
                              {date(b.createdAt)}
                            </Td>

                            {/* Status */}
                            <Td align="right">
                              {b.isBanned ? (
                                <Badge tone="signal">Banned</Badge>
                              ) : (
                                <Badge tone="live">Active</Badge>
                              )}
                            </Td>

                            {/* Actions */}
                            <Td align="right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/barbers/${b.id}`}
                                  className="inline-flex items-center gap-1 rounded-md border border-rule bg-ground px-2 py-1 text-[11px] font-medium text-ink-2 hover:bg-ground-soft hover:text-ink"
                                >
                                  <Eye size={12} />
                                  Inspect Hub
                                </Link>

                                {b.isBanned ? (
                                  <Button
                                    variant="secondary"
                                    onClick={() => handleUnban(b)}
                                    disabled={unban.pending}
                                    title="Unban this barber"
                                  >
                                    <Unlock size={11} className="mr-1 text-live" />
                                    Unban
                                  </Button>
                                ) : (
                                  <Button
                                    variant="danger"
                                    onClick={() => {
                                      setBanningTarget(b);
                                      setBanReason('');
                                    }}
                                    disabled={ban.pending}
                                    title="Ban this account"
                                  >
                                    <Lock size={11} />
                                  </Button>
                                )}
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
          </>
        )}
      </Canvas>

      {/* Quick Preview Modal if requested */}
      {quickPreview && (
        <BarberDetailModal
          userId={quickPreview.userId}
          name={quickPreview.name}
          onClose={() => setQuickPreview(null)}
        />
      )}

      {/* Ban Barber Modal */}
      {banningTarget && (
        <Modal
          title={`Ban ${banningTarget.name}`}
          note="Suspending this account immediately revokes login, invalidates all sessions, and closes upcoming booking availability."
          onClose={() => setBanningTarget(null)}
        >
          <div className="space-y-4">
            <FormError message={ban.error} />
            <Field label="Ban Reason" hint="Optional rationale logged with this moderation action">
              <TextInput
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="e.g. Repeated policy violations, customer complaint audit"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setBanningTarget(null)}>
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
    </>
  );
}
