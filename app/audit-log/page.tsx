'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, RotateCw } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { listAdminActions } from '@/lib/api/audit';
import { count, dateTime, shortId } from '@/lib/format';
import {
  Badge,
  Button,
  Canvas,
  Empty,
  Failed,
  Loading,
  PageHead,
  Panel,
} from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';

const PAGE_SIZE = 50;
const TARGET_TYPES = ['ALL', 'Tenant', 'User', 'Review', 'Transaction'] as const;

/** Which route to jump to for a given action's target — not every target type has a detail page
 *  (User doesn't have one; the Users page has no per-account URL), so this only covers what does. */
function targetHref(action: { targetType: string; targetId: string }): string | null {
  if (action.targetType === 'Tenant') return `/shops/${action.targetId}`;
  return null;
}

function actionTone(action: string): 'signal' | 'live' | 'plain' {
  if (action.endsWith('.ban') || action.endsWith('.suspend') || action.endsWith('.remove') || action.endsWith('.delete')) {
    return 'signal';
  }
  if (action.endsWith('.unban') || action.endsWith('.unsuspend')) return 'live';
  return 'plain';
}

export default function AuditLogPage() {
  const [targetType, setTargetType] = useState<(typeof TARGET_TYPES)[number]>('ALL');
  const [page, setPage] = useState(1);

  const actions = useApi(
    () => listAdminActions({ targetType: targetType === 'ALL' ? undefined : targetType, page, limit: PAGE_SIZE }),
    [targetType, page],
  );

  const rows = actions.data?.data ?? [];
  const total = actions.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHead
        eyebrow="Operations"
        title="Audit log"
        lede="Every mutating action a platform operator has taken through this console — who did what, to which record, and when."
        actions={
          <Button onClick={actions.refresh} disabled={actions.loading}>
            <RotateCw size={12} className={actions.loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        }
      />

      <Canvas>
        {actions.error && <Failed message={actions.error} onRetry={actions.refresh} />}

        {!actions.error && (
          <Panel
            flush
            title={`${count(total)} action${total === 1 ? '' : 's'}`}
            actions={
              <div className="flex flex-wrap items-center gap-1.5 font-manrope">
                {TARGET_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTargetType(t);
                      setPage(1);
                    }}
                    className={`rounded-full px-3 py-1 text-[12px] font-manrope transition-all cursor-pointer ${
                      targetType === t
                        ? 'bg-[#635BFF] text-white shadow-sm shadow-[#635BFF]/20 font-bold'
                        : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B] font-semibold'
                    }`}
                  >
                    {t === 'ALL' ? 'All' : t}
                  </button>
                ))}
              </div>
            }
          >
            {actions.loading && !actions.data && (
              <div className="p-6">
                <Loading label="Reading the audit log" />
              </div>
            )}

            {!actions.loading && actions.data && rows.length === 0 && (
              <div className="p-8">
                <Empty
                  title="No admin actions recorded yet"
                  hint="Suspending a shop, banning an account, removing a review, or refunding a transaction as a platform operator will show up here."
                />
              </div>
            )}

            {rows.length > 0 && (
              <Scroll>
                <Table>
                  <thead>
                    <tr>
                      <Th>When</Th>
                      <Th>Operator</Th>
                      <Th>Action</Th>
                      <Th>Target</Th>
                      <Th>Details</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((a) => {
                      const href = targetHref(a);
                      const metadataEntries = a.metadata ? Object.entries(a.metadata) : [];
                      return (
                        <Tr key={a.id}>
                          <Td mono muted>{dateTime(a.createdAt)}</Td>
                          <Td nowrap={false}>{a.actorEmail}</Td>
                          <Td>
                            <Badge tone={actionTone(a.action)}>{a.action}</Badge>
                          </Td>
                          <Td mono muted nowrap={false}>
                            {href ? (
                              <Link href={href} className="inline-flex items-center gap-1 text-ink hover:underline">
                                {a.targetType} {shortId(a.targetId)}
                                <ExternalLink size={10} className="text-ink-3" />
                              </Link>
                            ) : (
                              `${a.targetType} ${shortId(a.targetId)}`
                            )}
                          </Td>
                          <Td muted nowrap={false}>
                            {metadataEntries.length === 0
                              ? '—'
                              : metadataEntries.map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Scroll>
            )}

            <div className="flex items-center justify-between border-t border-rule-soft px-4 py-2.5 text-[12px] text-ink-2">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || actions.loading}>
                  Previous
                </Button>
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || actions.loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </Panel>
        )}
      </Canvas>
    </>
  );
}
