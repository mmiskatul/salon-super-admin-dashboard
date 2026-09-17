'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Megaphone, RotateCw, Search, Trash2 } from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { deleteBroadcast, listRecentBroadcasts, sendBroadcast } from '@/lib/api/broadcasts';
import { listTenants } from '@/lib/api/tenants';
import { count, date, since } from '@/lib/format';
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
import { Field, FormError, Modal, Select, TextArea, TextInput } from '@/components/ui/Form';

export default function BroadcastsPage() {
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const broadcastsApi = useApi(() => listRecentBroadcasts(), []);
  const tenantsApi = useApi(() => listTenants(), []);

  const tenantsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tenantsApi.data ?? []) {
      map.set(t.id, t.name);
    }
    return map;
  }, [tenantsApi.data]);

  const allBroadcasts = broadcastsApi.data ?? [];
  const needle = query.trim().toLowerCase();

  const filtered = allBroadcasts.filter((b) => {
    if (!needle) return true;
    const shopName = (b.tenantName || (b.tenantId ? tenantsMap.get(b.tenantId) : '') || '').toLowerCase();
    return (
      b.title.toLowerCase().includes(needle) ||
      b.body.toLowerCase().includes(needle) ||
      (b.tenantId && b.tenantId.toLowerCase().includes(needle)) ||
      shopName.includes(needle)
    );
  });

  const totalBroadcasts = allBroadcasts.length;
  const globalCount = allBroadcasts.filter((b) => !b.tenantId).length;
  const shopCount = allBroadcasts.filter((b) => !!b.tenantId).length;

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to retract and delete broadcast "${title}"?`)) return;
    try {
      setBusyId(id);
      await deleteBroadcast(id);
      await broadcastsApi.refresh();
    } catch (err: any) {
      alert(`Could not delete broadcast: ${err.message || err}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Operations"
        title="Platform broadcasts"
        lede="Dispatch urgent notifications and system announcements across the platform or target individual salon storefronts."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => setComposing(true)} variant="primary">
              <Megaphone size={12} />
              Send broadcast
            </Button>
            <Button onClick={broadcastsApi.refresh} disabled={broadcastsApi.loading}>
              <RotateCw size={12} className={broadcastsApi.loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        }
      />

      <Canvas>
        {broadcastsApi.error && (
          <Failed message={broadcastsApi.error} onRetry={broadcastsApi.refresh} />
        )}
        {broadcastsApi.loading && !broadcastsApi.data && (
          <Loading label="Loading system broadcasts" />
        )}

        {broadcastsApi.data && !broadcastsApi.error && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat
                label="Recent broadcasts"
                value={count(totalBroadcasts)}
                pending={broadcastsApi.loading}
              />
              <Stat
                label="Global announcements"
                value={count(globalCount)}
                tone="live"
                sub="Platform-wide delivery"
              />
              <Stat
                label="Shop-scoped alerts"
                value={count(shopCount)}
                sub="Targeted salon notifications"
              />
            </div>

            <Panel
              flush
              title={`${count(filtered.length)} broadcast${filtered.length === 1 ? '' : 's'} recorded`}
              actions={
                <label className="relative font-manrope">
                  <Search
                    size={14}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    type="text"
                    placeholder="Search broadcasts..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-60 rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 py-1.5 text-[12px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent font-manrope transition-all shadow-xs"
                  />
                </label>
              }
            >
              {filtered.length === 0 ? (
                <Empty
                  title="No broadcasts found"
                  hint="Platform announcements sent to customers, staff, or owners will appear here."
                />
              ) : (
                <Scroll>
                  <Table>
                    <thead>
                      <Tr>
                        <Th align="left">Notification</Th>
                        <Th align="left">Audience target</Th>
                        <Th align="left">Category</Th>
                        <Th align="left">Sent</Th>
                        <Th align="right">Actions</Th>
                      </Tr>
                    </thead>
                    <tbody>
                      {filtered.map((b) => {
                        const shopName = b.tenantName || (b.tenantId ? tenantsMap.get(b.tenantId) ?? b.tenantId : null);
                        const isBusy = busyId === b.id;

                        return (
                          <Tr key={b.id}>
                            <Td align="left">
                              <div className="max-w-md space-y-0.5">
                                <div className="font-medium text-ink">{b.title}</div>
                                <div className="text-xs text-ink-2 line-clamp-2">{b.body}</div>
                              </div>
                            </Td>
                            <Td align="left">
                              {b.tenantId ? (
                                <div className="flex flex-col gap-0.5">
                                  <Link
                                    href={`/shops/${b.tenantId}`}
                                    className="group inline-flex items-center gap-1 font-medium text-ink hover:text-accent"
                                  >
                                    <span>{shopName}</span>
                                    <ExternalLink
                                      size={10}
                                      className="text-ink-3 group-hover:text-accent"
                                    />
                                  </Link>
                                  <span className="font-mono text-[10px] text-ink-3">
                                    Shop scoped
                                  </span>
                                </div>
                              ) : (
                                <Badge tone="live">All platform users</Badge>
                              )}
                            </Td>
                            <Td align="left">
                              <Badge tone="plain">{b.category || 'SYSTEM'}</Badge>
                            </Td>
                            <Td align="left">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-ink-2">{since(b.createdAt)}</span>
                                <span className="text-[10px] text-ink-3">{date(b.createdAt)}</span>
                              </div>
                            </Td>
                            <Td align="right">
                              <Button
                                variant="outline"
                                onClick={() => handleDelete(b.id, b.title)}
                                disabled={isBusy}
                                className="text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEE2E2]"
                              >
                                <Trash2 size={12} />
                                Delete
                              </Button>
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

      {composing && (
        <SendBroadcastModal
          tenants={tenantsApi.data ?? []}
          onClose={() => setComposing(false)}
          onSuccess={() => {
            setComposing(false);
            broadcastsApi.refresh();
          }}
        />
      )}
    </>
  );
}

interface SendModalProps {
  tenants: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

function SendBroadcastModal({ tenants, onClose, onSuccess }: SendModalProps) {
  const [targetType, setTargetType] = useState<'ALL' | 'TENANT'>('ALL');
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? '');
  const [category, setCategory] = useState<'SYSTEM' | 'PROMOTION' | 'BOOKING' | 'REMINDER'>('SYSTEM');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const mutation = useMutation(async () => {
    if (!title.trim()) throw new Error('Broadcast title is required');
    if (!body.trim()) throw new Error('Broadcast message body is required');

    await sendBroadcast({
      title: title.trim(),
      body: body.trim(),
      category,
      tenantId: targetType === 'TENANT' ? tenantId : undefined,
    });

    onSuccess();
  });

  return (
    <Modal
      title="Dispatch platform broadcast"
      note="Send a real-time notification alert to active user feeds across web and mobile."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-3.5"
      >
        {mutation.error && <FormError message={mutation.error} />}

        <Field label="Target audience">
          <Select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as 'ALL' | 'TENANT')}
          >
            <option value="ALL">All platform users (Global broadcast)</option>
            <option value="TENANT">Specific salon shop & its users</option>
          </Select>
        </Field>

        {targetType === 'TENANT' && (
          <Field label="Select salon shop">
            <Select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id.slice(0, 8)}…)
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Notification category">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
          >
            <option value="SYSTEM">System Announcement</option>
            <option value="PROMOTION">Promotional Alert</option>
            <option value="REMINDER">General Reminder</option>
            <option value="BOOKING">Booking Notice</option>
          </Select>
        </Field>

        <Field label="Notification title" hint="Appears as headline on banners and push notifications">
          <TextInput
            placeholder="e.g. Scheduled Maintenance Window"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Field>

        <Field label="Message body" hint="Details of the announcement">
          <TextArea
            placeholder="Provide relevant information or instructions for the affected salon users..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            required
          />
        </Field>

        <div className="flex justify-end gap-2 border-t border-rule-soft pt-4">
          <Button onClick={onClose} disabled={mutation.pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.pending} variant="primary">
            {mutation.pending ? 'Dispatching…' : 'Dispatch broadcast'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
