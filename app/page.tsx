'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, Megaphone, RotateCw } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { getOverview, type InsightDays } from '@/lib/api/insights';
import { placeHref } from '@/lib/placeHref';
import { count, money } from '@/lib/format';
import { Button, Canvas, Failed, Loading, PageHead, Panel, Stat } from '@/components/ui/primitives';
import ClusterHealthWidget from '@/components/overview/ClusterHealthWidget';
import { Bars, Columns, DaysPicker, Donut, OUTCOME_COLORS, percent, StackedColumns } from '@/components/insights/Bits';

function Kpi({ label, value, sub, href, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; href?: string; tone?: 'plain' | 'signal' | 'live' }) {
  const body = <Stat label={label} value={value} sub={sub} tone={tone} />;
  return href ? <Link href={href} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-[#635BFF]">{body}</Link> : body;
}

function MiniList({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <ul className="space-y-1.5 text-[13px]">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center justify-between gap-3 rounded-md bg-[#F8FAFC] px-3 py-2">
          <span className="font-semibold text-[#64748B]">{r.label}</span>
          <b className="tabular-nums text-[#1E293B]">{r.value}</b>
        </li>
      ))}
    </ul>
  );
}

/** The whole system on one page: people, places, bookings, money, engagement, today and health. */
export default function OverviewPage() {
  const [days, setDays] = useState<InsightDays>(30);
  const data = useApi(() => getOverview(days), [days], 'overview-whole-system');
  const o = data.data;
  const shortDay = (d: string) => d.slice(5);

  return (
    <>
      <PageHead
        eyebrow="Command centre"
        title="Platform overview"
        lede="Everything on SalunBD in one place: every customer, shop owner and barber, what was booked and what happened to it, the cash recorded, how people use the apps, and what needs your attention."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DaysPicker value={days} onChange={setDays} />
            <Link href="/broadcasts">
              <Button variant="outline"><Megaphone className="h-4 w-4" /> Broadcast</Button>
            </Link>
            <Button onClick={data.refresh} disabled={data.loading}><RotateCw className="h-4 w-4" /> Refresh</Button>
          </div>
        }
      />
      <Canvas>
        {data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : !o ? (
          <Loading label="Reading the whole system" />
        ) : (
          <>
            {(o.attention.openReports > 0 || o.attention.openTickets > 0 || o.attention.hiddenListings > 0) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[13px] font-semibold text-[#92400E]">
                <AlertTriangle className="h-4 w-4" aria-hidden />
                <span>Needs attention:</span>
                {o.attention.openReports > 0 && <Link href="/reports" className="underline">{o.attention.openReports} open report{o.attention.openReports === 1 ? '' : 's'}</Link>}
                {o.attention.openTickets > 0 && <Link href="/support" className="underline">{o.attention.openTickets} support ticket{o.attention.openTickets === 1 ? '' : 's'}</Link>}
                {o.attention.hiddenListings > 0 && <Link href="/readiness" className="underline">{o.attention.hiddenListings} shop{o.attention.hiddenListings === 1 ? '' : 's'}/barbers hidden (setup not finished)</Link>}
              </div>
            )}

            {/* Headline numbers */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Kpi label="All accounts" value={count(o.people.total)} sub={`+${o.people.newInPeriod} in ${days} days`} href="/users" />
              <Kpi label="Customers" value={count(o.people.customers)} sub={`+${o.people.newCustomers} new`} href="/growth" />
              <Kpi label="Partners" value={count(o.people.owners + o.people.shopBarbers + o.people.independentBarbers)} sub={`+${o.people.newPartners} new`} href="/barbers" />
              <Kpi label="Active this week" value={count(o.active.week.total)} sub={`${o.active.day.total} today`} tone="live" href="/growth" />
              <Kpi label="Visible places" value={`${o.places.shopsVisible + o.places.barbersVisible}`} sub={`of ${o.places.shops + o.places.independentBarbers}`} href="/readiness" />
              <Kpi label={`Bookings, ${days}d`} value={count(o.bookings.total)} sub={`${percent(o.bookings.completionRate)} completed`} href="/bookings" />
              <Kpi label={`Cash, ${days}d`} value={money(o.money.cash)} sub={`${o.money.payments} payments`} tone="live" href="/money" />
              <Kpi label="Rating" value={o.engagement.averageRating ?? '—'} sub={`${o.engagement.reviews} reviews`} href="/safety" />
            </div>

            {/* Today, live */}
            <Panel title="Today" note="Bookings for today across every shop and barber" actions={<Link href="/bookings" className="inline-flex items-center gap-1 text-[12px] font-bold text-[#635BFF]">Open bookings <ArrowUpRight className="h-3.5 w-3.5" /></Link>}>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <MiniList rows={[{ label: 'Booked for today', value: o.today.total }]} />
                <MiniList rows={[{ label: 'Waiting', value: o.today.waiting }]} />
                <MiniList rows={[{ label: 'In the chair now', value: o.today.inChair }]} />
                <MiniList rows={[{ label: 'Done', value: o.today.done }]} />
                <MiniList rows={[{ label: 'Cancelled / no-show', value: o.today.cancelled }]} />
              </div>
            </Panel>

            {/* People */}
            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="Who is on SalunBD" note={`${count(o.people.total)} accounts`}>
                <Donut
                  centre={count(o.people.total)}
                  parts={[
                    { label: 'Customers', value: o.people.customers, color: '#635BFF' },
                    { label: 'Shop owners', value: o.people.owners, color: '#0EA5E9' },
                    { label: 'Barbers in a shop', value: o.people.shopBarbers, color: '#16A34A' },
                    { label: 'Independent barbers', value: o.people.independentBarbers, color: '#F59E0B' },
                    { label: 'Admins', value: o.people.admins, color: '#94A3B8' },
                  ]}
                />
                <p className="mt-3 text-[12px] font-semibold text-[#64748B]">{o.people.unverified} haven&apos;t verified their email · {o.people.banned} banned</p>
              </Panel>
              <Panel title="New sign-ups per day" note={`Last ${days} days`} className="lg:col-span-2">
                <StackedColumns
                  points={o.signups.map((s) => ({ label: shortDay(s.day), values: { customers: s.customers, partners: s.partners } }))}
                  series={[{ key: 'customers', label: 'Customers', color: '#635BFF' }, { key: 'partners', label: 'Partners (owners & barbers)', color: '#F59E0B' }]}
                />
              </Panel>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="People using the apps" note="Signed in at least once in the period">
                <MiniList rows={[
                  { label: 'Today', value: `${o.active.day.total} (${o.active.day.customers} customers · ${o.active.day.partners} partners)` },
                  { label: 'Last 7 days', value: `${o.active.week.total} (${o.active.week.customers} · ${o.active.week.partners})` },
                  { label: 'Last 30 days', value: `${o.active.month.total} (${o.active.month.customers} · ${o.active.month.partners})` },
                ]} />
              </Panel>
              <Panel title="Shops and barbers" note={`${o.places.newShops} new shops in ${days} days`}>
                <MiniList rows={[
                  { label: 'Shops', value: `${o.places.shops} (${o.places.shopsVisible} visible${o.places.shopsSuspended ? `, ${o.places.shopsSuspended} suspended` : ''})` },
                  { label: 'Independent barbers', value: `${o.places.independentBarbers} (${o.places.barbersVisible} visible)` },
                  { label: 'Active services', value: o.places.activeServices },
                  { label: 'Barbers working in shops', value: o.places.teamMembers },
                ]} />
              </Panel>
              <Panel title="Where customers are" note="City of their saved addresses">
                <Bars rows={o.engagement.customersByCity.map((c) => ({ label: c.key, value: c.count }))} />
              </Panel>
            </div>

            {/* Bookings */}
            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="Bookings made per day" note="Coloured by what has happened to them since" className="lg:col-span-2" actions={<Link href="/bookings" className="text-[12px] font-bold text-[#635BFF]">All bookings</Link>}>
                <StackedColumns
                  points={o.bookings.byDay.map(({ day, ...values }) => ({ label: shortDay(day), values }))}
                  series={[
                    { key: 'completed', label: 'Completed', color: OUTCOME_COLORS.completed },
                    { key: 'upcoming', label: 'Open / upcoming', color: OUTCOME_COLORS.open },
                    { key: 'cancelled', label: 'Cancelled', color: OUTCOME_COLORS.cancelled },
                    { key: 'noShow', label: 'No-show', color: OUTCOME_COLORS.noShow },
                  ]}
                />
              </Panel>
              <Panel title="Outcomes" note={`${count(o.bookings.total)} bookings · ${o.bookings.app} in the app · ${o.bookings.walkIns} walk-ins`}>
                <Donut
                  centre={count(o.bookings.total)}
                  parts={[
                    { label: 'Completed', value: o.bookings.completed, color: OUTCOME_COLORS.completed },
                    { label: 'Open / upcoming', value: o.bookings.open, color: OUTCOME_COLORS.open },
                    { label: 'Cancelled', value: o.bookings.cancelled, color: OUTCOME_COLORS.cancelled },
                    { label: 'No-show', value: o.bookings.noShow, color: OUTCOME_COLORS.noShow },
                  ]}
                />
              </Panel>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="Who cancelled" note={`${percent(o.bookings.cancelRate)} of bookings cancelled or no-show`}>
                <Bars rows={[
                  { label: 'Customer', value: o.bookings.cancelledBy.customer, color: '#F59E0B', href: '/bookings?cancelledBy=CUSTOMER' },
                  { label: 'Shop / barber', value: o.bookings.cancelledBy.shop, color: '#FB7185', href: '/bookings?cancelledBy=SHOP' },
                  { label: 'System (not accepted / time passed)', value: o.bookings.cancelledBy.system, color: '#94A3B8', href: '/bookings?cancelledBy=SYSTEM' },
                  { label: 'SalunBD admin', value: o.bookings.cancelledBy.admin, color: '#635BFF', href: '/bookings?cancelledBy=ADMIN' },
                ]} />
              </Panel>
              <Panel title="Busiest shops and barbers" note="Bookings made in the period">
                <Bars rows={o.top.places.map((p) => ({ label: p.name, value: p.bookings, href: placeHref(p.key) }))} />
              </Panel>
              <Panel title="Most booked services">
                <Bars rows={o.top.services.map((s) => ({ label: s.name, value: s.bookings, color: '#0EA5E9' }))} />
              </Panel>
            </div>

            {/* Money */}
            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="Cash per day" note="Payments shops recorded as paid (SalunBD is cash-only)" className="lg:col-span-2" actions={<Link href="/money" className="text-[12px] font-bold text-[#635BFF]">Money</Link>}>
                <Columns points={o.money.byDay.map((d) => ({ label: shortDay(d.day), value: d.amount }))} color="#16A34A" format={money} />
              </Panel>
              <Panel title="Money at a glance">
                <MiniList rows={[
                  { label: `Cash, last ${days} days`, value: money(o.money.cash) },
                  { label: 'Average payment', value: money(o.money.averageTicket) },
                  { label: 'Cash, all time', value: money(o.money.allTime) },
                  { label: 'Coupon discounts given', value: money(o.money.couponDiscounts) },
                  { label: 'Gift card balances owed', value: money(o.money.giftCardsOwed) },
                ]} />
              </Panel>
            </div>

            {/* Engagement */}
            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="Ratings" note={`${o.engagement.reviews} reviews · ${o.engagement.unansweredReviews} without a reply`}>
                <Bars rows={o.engagement.ratingDistribution.map((r) => ({ label: `${r.stars} stars`, value: r.count, color: r.stars <= 2 ? '#EF4444' : r.stars === 3 ? '#F59E0B' : '#16A34A' }))} />
              </Panel>
              <Panel title="App activity" note={`Last ${days} days`}>
                <MiniList rows={[
                  { label: 'Chat messages', value: count(o.engagement.chatMessages) },
                  { label: 'Notifications sent', value: count(o.engagement.notificationsSent) },
                  { label: 'Favourites added', value: count(o.engagement.favoritesAdded) },
                  { label: 'Saved customer addresses (all)', value: count(o.engagement.savedAddresses) },
                ]} />
              </Panel>
              <Panel title="Most active customers" note="Bookings made in the period">
                <Bars rows={o.top.customers.map((c) => ({ label: c.name ?? c.userId.slice(0, 8), value: c.bookings, href: `/users/${c.userId}`, color: '#635BFF' }))} />
              </Panel>
            </div>

            <ClusterHealthWidget />
          </>
        )}
      </Canvas>
    </>
  );
}
