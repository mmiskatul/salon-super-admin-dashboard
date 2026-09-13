'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, LifeBuoy, RotateCw, Search, Send } from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import {
  getTicket,
  listTickets,
  replyToTicket,
  setTicketStatus,
  TICKET_STATUSES,
} from '@/lib/api/support';
import { count, dateTime, shortId, since } from '@/lib/format';
import { Badge, Button, Canvas, Empty, Failed, Loading, PageHead, Panel, Stat } from '@/components/ui/primitives';
import { FormError, TextInput } from '@/components/ui/Form';

const FILTER_STATUSES = ['ALL', 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'] as const;
type StatusFilter = (typeof FILTER_STATUSES)[number];

export default function SupportPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [directId, setDirectId] = useState('');

  const tickets = useApi(
    () => listTickets({ status: statusFilter === 'ALL' ? undefined : statusFilter }),
    [statusFilter],
  );

  const activeTicketId =
    selectedTicketId ?? (tickets.data && tickets.data.length > 0 ? tickets.data[0].id : null);

  const detailState = useApi(
    () => (activeTicketId ? getTicket(activeTicketId) : Promise.resolve(null)),
    [activeTicketId],
  );
  const ticketDetail = detailState.data;

  const send = useMutation(replyToTicket);
  const changeStatus = useMutation(setTicketStatus);

  function handleDirectSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!directId.trim()) return;
    setSelectedTicketId(directId.trim());
  }

  async function submitReply(event: React.FormEvent) {
    event.preventDefault();
    if (!ticketDetail || !reply.trim()) return;
    const message = await send.mutate(ticketDetail.id, reply.trim());
    if (message) {
      setReply('');
      await detailState.refresh();
      void tickets.refresh();
    }
  }

  async function moveStatus(status: string) {
    if (!ticketDetail) return;
    const updated = await changeStatus.mutate(ticketDetail.id, status);
    if (updated) {
      detailState.setData({ ...ticketDetail, ...updated });
      void tickets.refresh();
    }
  }

  const allTickets = tickets.data ?? [];
  const openCount = allTickets.filter((t) => t.status === 'OPEN').length;
  const pendingCount = allTickets.filter((t) => t.status === 'PENDING').length;
  const resolvedCount = allTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  const needle = searchQuery.trim().toLowerCase();
  const visible = allTickets.filter((t) => {
    if (!needle) return true;
    return (
      t.id.toLowerCase().includes(needle) ||
      t.subject.toLowerCase().includes(needle) ||
      (t.category && t.category.toLowerCase().includes(needle)) ||
      (t.tenantId && t.tenantId.toLowerCase().includes(needle)) ||
      t.userId.toLowerCase().includes(needle)
    );
  });

  return (
    <>
      <PageHead
        eyebrow="Operations"
        title="Support queue"
        lede="Platform-wide support inbox. Read customer and owner ticket threads, update status, and post official replies."
        actions={
          <Button onClick={tickets.refresh} disabled={tickets.loading}>
            <RotateCw size={12} className={tickets.loading ? 'animate-spin' : ''} />
            Refresh queue
          </Button>
        }
      />

      <Canvas>
        <div className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-4">
          <Stat label="Total in view" value={count(allTickets.length)} pending={tickets.loading} />
          <Stat label="Open tickets" value={count(openCount)} tone={openCount > 0 ? 'signal' : 'live'} />
          <Stat label="Pending responses" value={count(pendingCount)} />
          <Stat label="Resolved / Closed" value={count(resolvedCount)} tone="live" />
        </div>

        {/* Quick ID lookup bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border border-rule bg-surface p-3">
          <div className="flex items-center gap-2 text-[12px] text-ink-2">
            <Search size={14} className="text-ink-3" />
            <span>Direct ticket lookup:</span>
          </div>
          <form onSubmit={handleDirectSearch} className="flex min-w-[280px] flex-1 items-center gap-2 sm:max-w-md">
            <TextInput
              value={directId}
              onChange={(e) => setDirectId(e.target.value)}
              placeholder="Enter exact UUID ticket ID"
              className="tabular text-[12px]"
            />
            <Button type="submit" disabled={detailState.loading || !directId.trim()}>
              Open
            </Button>
          </form>
        </div>

        {detailState.error && <FormError message={detailState.error} />}

        {/* Two-pane Inbox layout */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left pane: Ticket queue */}
          <div className="space-y-3 lg:col-span-5">
            <Panel
              flush
              title={`Queue (${count(visible.length)})`}
              actions={
                <div className="flex items-center gap-1">
                  {FILTER_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`rounded-[2px] px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        statusFilter === s ? 'bg-ink text-white' : 'text-ink-2 hover:bg-ground hover:text-ink'
                      }`}
                    >
                      {s === 'ALL' ? 'All' : s.toLowerCase()}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="border-b border-rule-soft p-2.5">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter queue by subject, user, shop..."
                  aria-label="Filter queue"
                  className="w-full rounded-[3px] border border-rule bg-ground px-2.5 py-1.5 text-[12px] placeholder:text-ink-3 focus:border-ink focus:outline-none"
                />
              </div>

              {tickets.loading && !tickets.data && (
                <div className="p-6">
                  <Loading label="Reading ticket queue" />
                </div>
              )}

              {tickets.error && (
                <div className="p-4">
                  <Failed message={tickets.error} onRetry={tickets.refresh} />
                </div>
              )}

              {!tickets.loading && visible.length === 0 && (
                <div className="p-8">
                  <Empty title="No tickets in queue" hint="Tickets opened by customers or owners will appear here." />
                </div>
              )}

              <div className="max-h-[600px] divide-y divide-rule-soft overflow-y-auto">
                {visible.map((t) => {
                  const isSelected = selectedTicketId === t.id;
                  const latestSnippet = t.messages && t.messages.length > 0 ? t.messages[0].body : null;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`w-full text-left p-3 transition-colors ${
                        isSelected ? 'bg-ink/5' : 'hover:bg-ground/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-[13px] text-ink line-clamp-1">
                          {t.subject || 'Untitled ticket'}
                        </span>
                        <TicketBadge status={t.status} />
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-3">
                        <span className="rounded bg-ground px-1 py-0.5 text-ink-2 font-mono">
                          {t.category || 'General'}
                        </span>
                        <span>·</span>
                        <span>{shortId(t.userId)}</span>
                        <span>·</span>
                        <span className="tabular">{since(t.createdAt)}</span>
                      </div>

                      {latestSnippet && (
                        <p className="mt-1.5 text-[12px] text-ink-2 line-clamp-2 leading-relaxed">
                          {latestSnippet}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </Panel>
          </div>

          {/* Right pane: Selected ticket thread */}
          <div className="space-y-4 lg:col-span-7">
            {detailState.loading && !ticketDetail && (
              <Panel>
                <div className="p-10">
                  <Loading label="Opening ticket thread" />
                </div>
              </Panel>
            )}

            {!ticketDetail && !detailState.loading && (
              <Panel>
                <div className="p-12 text-center">
                  <LifeBuoy size={28} className="mx-auto text-ink-3" />
                  <p className="mt-3 text-[14px] font-semibold">Select a ticket</p>
                  <p className="mt-1 text-[12px] text-ink-2">
                    Pick a ticket from the left queue or enter a UUID above to view the conversation.
                  </p>
                </div>
              </Panel>
            )}

            {ticketDetail && (
              <>
                <Panel
                  title={ticketDetail.subject || 'Untitled ticket'}
                  note={`Ticket #${shortId(ticketDetail.id)} · Raised by ${ticketDetail.userId}`}
                  actions={
                    <div className="flex items-center gap-2">
                      <select
                        value={ticketDetail.status}
                        onChange={(e) => moveStatus(e.target.value)}
                        disabled={changeStatus.pending}
                        aria-label="Update ticket status"
                        className="rounded-[3px] border border-rule bg-surface px-2 py-1 text-[12px] font-medium focus:border-ink focus:outline-none"
                      >
                        {TICKET_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  }
                >
                  {changeStatus.error && <FormError message={changeStatus.error} />}

                  <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-rule-soft pb-3 text-[12px]">
                    <div>
                      <span className="text-ink-3">Category: </span>
                      <span className="font-medium text-ink">{ticketDetail.category || 'General'}</span>
                    </div>
                    {ticketDetail.tenantId && (
                      <div>
                        <span className="text-ink-3">Shop: </span>
                        <Link
                          href={`/shops/${ticketDetail.tenantId}`}
                          className="inline-flex items-center gap-1 font-mono text-ink hover:underline"
                        >
                          {shortId(ticketDetail.tenantId)}
                          <ExternalLink size={10} className="text-ink-3" />
                        </Link>
                      </div>
                    )}
                    <div>
                      <span className="text-ink-3">Created: </span>
                      <span className="tabular text-ink-2">{dateTime(ticketDetail.createdAt)}</span>
                    </div>
                  </div>

                  {/* Messages list */}
                  {!ticketDetail.messages || ticketDetail.messages.length === 0 ? (
                    <Empty title="No messages recorded on this ticket yet" />
                  ) : (
                    <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                      {ticketDetail.messages.map((m) => {
                        const isOperator = m.senderId !== ticketDetail.userId;
                        return (
                          <div
                            key={m.id}
                            className={`rounded-[4px] border p-3.5 text-[13px] leading-relaxed ${
                              isOperator
                                ? 'border-rule bg-ground/80'
                                : 'border-rule-soft bg-surface'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-rule-soft pb-2">
                              <span className="font-semibold text-[12px]">
                                {isOperator ? 'Platform Operator' : `User (${shortId(m.senderId)})`}
                              </span>
                              <span className="tabular font-mono text-[11px] text-ink-3">
                                {dateTime(m.createdAt)} ({since(m.createdAt)})
                              </span>
                            </div>
                            <p className="mt-2 text-ink whitespace-pre-wrap">{m.body}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Panel>

                {/* Reply composer */}
                <Panel title="Reply to ticket" note="This will be dispatched to the ticket author.">
                  <form onSubmit={submitReply} className="space-y-3">
                    <FormError message={send.error} />
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={3}
                      placeholder="Type your official operator response..."
                      aria-label="Ticket reply"
                      className="w-full rounded-[3px] border border-rule bg-surface p-2.5 text-[13px] placeholder:text-ink-3 focus:border-ink focus:outline-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-ink-3">
                        Replying as Super Admin
                      </span>
                      <Button type="submit" variant="primary" disabled={send.pending || !reply.trim()}>
                        <Send size={12} />
                        {send.pending ? 'Sending...' : 'Send response'}
                      </Button>
                    </div>
                  </form>
                </Panel>
              </>
            )}
          </div>
        </div>
      </Canvas>
    </>
  );
}

function TicketBadge({ status }: { status: string }) {
  const norm = (status || '').toUpperCase();
  switch (norm) {
    case 'OPEN':
      return <Badge tone="signal">Open</Badge>;
    case 'PENDING':
      return <Badge>Pending</Badge>;
    case 'RESOLVED':
    case 'CLOSED':
      return <Badge tone="live">{norm.toLowerCase()}</Badge>;
    default:
      return <Badge tone="quiet">{norm.toLowerCase()}</Badge>;
  }
}
