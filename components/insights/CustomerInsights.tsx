'use client';

import Link from 'next/link';
import { useApi } from '@/lib/useApi';
import { getCustomerInsight } from '@/lib/api/insights';
import { REASON_LABELS } from '@/lib/api/reports';
import { bookingDateTime, count, money, since } from '@/lib/format';
import { Badge, Empty, Failed, Loading, Panel, Stat } from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';

const STATUS_TONE: Record<string, 'live' | 'signal' | 'warning' | 'primary' | 'plain'> = {
  COMPLETED: 'live',
  CANCELLED: 'signal',
  NO_SHOW: 'signal',
  PENDING: 'warning',
  CONFIRMED: 'primary',
  IN_PROGRESS: 'primary',
};

/** Everything about one account as a customer: bookings, strikes, places, safety, sessions, referrals. */
export default function CustomerInsights({ userId }: { userId: string }) {
  const data = useApi(() => getCustomerInsight(userId), [userId], 'insights-customer');
  if (data.loading && !data.data) return <Loading label="Loading customer activity" />;
  if (data.error) return <Failed message={data.error} onRetry={data.refresh} />;
  const c = data.data;
  if (!c) return null;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Bookings" value={count(c.bookings.total)} sub={`${c.bookings.completed} done · ${c.bookings.upcoming} upcoming`} />
        <Stat label="Spent (cash)" value={money(c.bookings.spent)} sub="On completed bookings" />
        <Stat label="Cancelled / no-show" value={`${c.bookings.cancelled} / ${c.bookings.noShow}`} sub={`${c.bookings.lateCancels} late cancellations`} tone={c.bookings.noShow ? 'signal' : 'plain'} />
        <Stat
          label="Late-cancel strikes"
          value={`${c.strikes.count} / ${c.strikes.limit}`}
          sub={c.strikes.restricted ? `Restricted to 1 upcoming booking` : `In the last ${c.strikes.windowDays} days`}
          tone={c.strikes.restricted ? 'signal' : 'plain'}
        />
      </div>

      <Panel title="Booking history" note="Newest first" flush>
        {c.bookings.recent.length === 0 ? (
          <Empty title="No bookings yet" />
        ) : (
          <Scroll>
            <Table>
              <thead><tr><Th>When</Th><Th>Where</Th><Th>Service</Th><Th>Status</Th><Th align="right">Price</Th></tr></thead>
              <tbody>
                {c.bookings.recent.map((b) => (
                  <Tr key={b.id}>
                    <Td nowrap>{bookingDateTime(b.startAt)}</Td>
                    <Td>
                      {b.tenantId ? <Link href={`/shops/${b.tenantId}`} className="font-semibold hover:text-[#635BFF]">{b.place ?? 'Shop'}</Link> : <Link href={`/barbers/${b.staffId}`} className="font-semibold hover:text-[#635BFF]">Independent barber</Link>}
                    </Td>
                    <Td>{b.service ?? '—'}</Td>
                    <Td>
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        <Badge tone={STATUS_TONE[b.status] ?? 'plain'}>{b.status.replace('_', ' ')}</Badge>
                        {b.lateCancel && <Badge tone="warning">Late</Badge>}
                        {b.reason && <span className="text-[12px] text-[#94A3B8]">{b.reason}</span>}
                      </span>
                    </Td>
                    <Td align="right">{money(b.price)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Scroll>
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Saved addresses">
          {c.addresses.length === 0 ? (
            <Empty title="None saved" />
          ) : (
            <ul className="space-y-2 text-[13px]">
              {c.addresses.map((a, i) => (
                <li key={i}><b>{a.name}</b> {a.isDefault && <Badge tone="primary">Default</Badge>}<p className="text-[#64748B]">{a.address}, {a.city}</p></li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Favourites">
          {c.favorites.length === 0 ? (
            <Empty title="No favourites" />
          ) : (
            <ul className="space-y-1.5 text-[13px]">
              {c.favorites.map((f) => (
                <li key={`${f.type}${f.id}`}>
                  <Link href={f.type === 'shop' ? `/shops/${f.id}` : `/barbers/${f.id}`} className="font-semibold hover:text-[#635BFF]">{f.name ?? f.id.slice(0, 8)}</Link>
                  <span className="ml-1.5 text-[#94A3B8]">{f.type}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Account activity">
          <ul className="space-y-1.5 text-[13px]">
            <li className="flex justify-between"><span className="text-[#64748B]">Last seen</span><b>{c.sessions.lastSeenAt ? since(c.sessions.lastSeenAt) : 'Never'}</b></li>
            <li className="flex justify-between"><span className="text-[#64748B]">Signed in on</span><b>{c.sessions.active} device{c.sessions.active === 1 ? '' : 's'}</b></li>
            <li className="flex justify-between"><span className="text-[#64748B]">Push notifications</span><b>{c.sessions.pushDevices ? `${c.sessions.pushDevices} device${c.sessions.pushDevices === 1 ? '' : 's'}` : 'Off'}</b></li>
            <li className="flex justify-between"><span className="text-[#64748B]">Wallet / points</span><b>{money(c.wallet.balance)} · {count(c.loyalty.points)} pts</b></li>
            <li className="flex justify-between"><span className="text-[#64748B]">Referral code</span><b>{c.referrals.code ?? '—'} · invited {c.referrals.invited}</b></li>
            {c.referrals.invitedBy && (
              <li className="flex justify-between"><span className="text-[#64748B]">Invited by</span><Link href={`/users/${c.referrals.invitedBy.userId}`} className="font-bold hover:text-[#635BFF]">{c.referrals.invitedBy.name ?? '—'}</Link></li>
            )}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Reports against this account" note={`Blocked by ${c.safety.blockedBy} · has blocked ${c.safety.blocked}`}>
          {c.safety.reportsAgainst.length === 0 ? (
            <Empty title="No reports" />
          ) : (
            <ul className="space-y-1.5 text-[13px]">
              {c.safety.reportsAgainst.map((r, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2"><Badge tone="warning">{REASON_LABELS[r.reason] ?? r.reason}</Badge><span>{r.targetType.toLowerCase().replace('_', ' ')}</span><Badge tone="quiet">{r.status}</Badge><span className="ml-auto text-[#94A3B8]">{since(r.createdAt)}</span></li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Reports this account sent">
          {c.safety.reportsFiled.length === 0 ? (
            <Empty title="None sent" />
          ) : (
            <ul className="space-y-1.5 text-[13px]">
              {c.safety.reportsFiled.map((r, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2"><Badge tone="primary">{REASON_LABELS[r.reason] ?? r.reason}</Badge><span>{r.targetType.toLowerCase().replace('_', ' ')}</span><Badge tone="quiet">{r.status}</Badge><span className="ml-auto text-[#94A3B8]">{since(r.createdAt)}</span></li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
