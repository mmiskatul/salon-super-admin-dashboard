'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Ban, Check, Flag, RotateCw, Trash2, X } from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import {
  listReports,
  resolveReport,
  REASON_LABELS,
  REPORT_STATUSES,
  TARGET_LABELS,
  type ContentReport,
  type ReportPerson,
  type ReportStatus,
} from '@/lib/api/reports';
import { banUser } from '@/lib/api/users';
import { count, dateTime, since } from '@/lib/format';
import { Badge, Button, Canvas, Empty, Failed, Loading, PageHead, Panel, Stat } from '@/components/ui/primitives';

function Person({ person, fallback }: { person: ReportPerson | null; fallback: string }) {
  if (!person) return <span className="text-[#94A3B8]">{fallback}</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Link href={`/users/${person.id}`} className="font-bold text-[#1E293B] hover:text-[#635BFF]">
        {person.name || person.email || person.id.slice(0, 8)}
      </Link>
      {person.role && <Badge tone="quiet">{person.role}</Badge>}
      {person.isBanned && <Badge tone="signal">Banned</Badge>}
    </span>
  );
}

export default function ReportsPage() {
  const [status, setStatus] = useState<ReportStatus>('OPEN');
  const reports = useApi(() => listReports(status), [status], 'reports');
  const resolve = useMutation(resolveReport);
  const ban = useMutation(banUser);
  const list = reports.data ?? [];

  async function act(report: ContentReport, body: { status: 'ACTIONED' | 'DISMISSED'; removeContent?: boolean }) {
    const done = await resolve.mutate(report.id, body);
    if (done) await reports.refresh();
  }

  async function banAndAction(report: ContentReport) {
    if (!report.reportedUser) return;
    const reason = window.prompt(`Ban ${report.reportedUser.name || report.reportedUser.email}? Reason (shown in the audit log):`, REASON_LABELS[report.reason] ?? report.reason);
    if (reason === null) return;
    const banned = await ban.mutate(report.reportedUser.id, reason || undefined);
    if (banned) await act(report, { status: 'ACTIONED', removeContent: report.targetType !== 'USER' });
  }

  return (
    <>
      <PageHead
        eyebrow="Operations"
        title="Reports"
        lede="Reviews, messages, photos and accounts people reported from the apps. Review every open report: dismiss it, take the content down, or ban the account."
        actions={
          <Button onClick={reports.refresh} disabled={reports.loading}>
            <RotateCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />
      <Canvas>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Stat label={`${status.toLowerCase()} reports`} value={count(list.length)} pending={reports.loading} tone={status === 'OPEN' && list.length > 0 ? 'signal' : 'live'} />
        </div>

        <div className="flex flex-wrap gap-2">
          {REPORT_STATUSES.map((s) => (
            <Button key={s} variant={s === status ? 'primary' : 'outline'} onClick={() => setStatus(s)}>
              {s === 'OPEN' ? 'Open' : s === 'ACTIONED' ? 'Actioned' : 'Dismissed'}
            </Button>
          ))}
        </div>

        {(resolve.error || ban.error) && <Failed message={resolve.error || ban.error || ''} />}

        <Panel title="Report queue" note="Newest first" flush>
          {reports.loading ? (
            <Loading label="Reading reports" />
          ) : reports.error ? (
            <Failed message={reports.error} onRetry={reports.refresh} />
          ) : list.length === 0 ? (
            <Empty title={status === 'OPEN' ? 'Nothing to review' : 'No reports here'} hint="Reports sent from the apps appear here." />
          ) : (
            <ul className="divide-y divide-[#F1F5F9]">
              {list.map((r) => (
                <li key={r.id} className="space-y-2 px-5 py-4 text-[13px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Flag className="h-4 w-4 text-[#E11D48]" />
                    <Badge tone="primary">{TARGET_LABELS[r.targetType]}</Badge>
                    <Badge tone="warning">{REASON_LABELS[r.reason] ?? r.reason}</Badge>
                    <span className="text-[#94A3B8]" title={dateTime(r.createdAt)}>{since(r.createdAt)}</span>
                  </div>
                  {r.targetType !== 'USER' && (
                    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[#1E293B]">
                      {r.content === null ? (
                        <span className="text-[#94A3B8]">Already removed</span>
                      ) : r.targetType === 'GALLERY_PHOTO' ? (
                        <a href={r.content} target="_blank" rel="noreferrer" className="font-semibold text-[#635BFF]">Open photo</a>
                      ) : (
                        r.content
                      )}
                    </div>
                  )}
                  {r.details && <p className="text-[#475569]">&ldquo;{r.details}&rdquo;</p>}
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-[#64748B]">
                    <span>Reported: <Person person={r.reportedUser} fallback="unknown" /></span>
                    <span>By: <Person person={r.reporter} fallback="unknown" /></span>
                  </div>
                  {r.status === 'OPEN' ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button variant="outline" disabled={resolve.pending} onClick={() => act(r, { status: 'DISMISSED' })}>
                        <X className="h-4 w-4" /> Dismiss
                      </Button>
                      {r.targetType !== 'USER' && r.content !== null && (
                        <Button variant="danger" disabled={resolve.pending} onClick={() => act(r, { status: 'ACTIONED', removeContent: true })}>
                          <Trash2 className="h-4 w-4" /> Remove content
                        </Button>
                      )}
                      {r.targetType === 'USER' && (
                        <Button variant="secondary" disabled={resolve.pending} onClick={() => act(r, { status: 'ACTIONED' })}>
                          <Check className="h-4 w-4" /> Mark handled
                        </Button>
                      )}
                      {r.reportedUser && !r.reportedUser.isBanned && (
                        <Button variant="danger" disabled={ban.pending || resolve.pending} onClick={() => banAndAction(r)}>
                          <Ban className="h-4 w-4" /> Ban account{r.targetType !== 'USER' ? ' and remove' : ''}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[12px] text-[#94A3B8]">
                      {r.status === 'ACTIONED' ? 'Actioned' : 'Dismissed'}
                      {r.resolvedAt ? ` ${since(r.resolvedAt)}` : ''}
                      {r.resolutionNote ? ` · ${r.resolutionNote}` : ''}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </Canvas>
    </>
  );
}
