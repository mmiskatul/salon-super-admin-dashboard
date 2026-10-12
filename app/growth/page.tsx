'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCw } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { getGrowth, type InsightDays } from '@/lib/api/insights';
import { count } from '@/lib/format';
import { Badge, Button, Canvas, Empty, Failed, Loading, PageHead, Panel, Stat } from '@/components/ui/primitives';
import { Columns, DaysPicker, percent } from '@/components/insights/Bits';

function Step({ label, value, of, note }: { label: string; value: number; of?: number; note?: string }) {
  const width = of && of > 0 ? Math.max(4, (value / of) * 100) : 100;
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="font-semibold text-[#1E293B]">{label}</span>
        <span className="tabular-nums font-bold">{count(value)}{note && <span className="ml-2 text-[12px] font-semibold text-[#94A3B8]">{note}</span>}</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-[#F1F5F9]">
        <div className="h-full rounded-full bg-[#635BFF]" style={{ width: `${width}%` }} />
      </div>
    </li>
  );
}

/** Sign-ups and where people drop off, who is actually using the apps, push reach and referrals. */
export default function GrowthPage() {
  const [days, setDays] = useState<InsightDays>(30);
  const data = useApi(() => getGrowth(days), [days], 'insights-growth');
  const g = data.data;
  return (
    <>
      <PageHead
        eyebrow="Insights"
        title="Customers & growth"
        lede="New customers, where they drop off before their first booking, how many people use the apps each day, week and month, how many can get push notifications, and referrals."
        actions={
          <>
            <DaysPicker value={days} onChange={setDays} />
            <Button onClick={data.refresh} disabled={data.loading}><RotateCw className="h-4 w-4" /> Refresh</Button>
          </>
        }
      />
      <Canvas>
        {data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : !g ? (
          <Loading label="Counting customers" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Active today" value={count(g.active.day.total)} sub={`${g.active.day.customers} customers · ${g.active.day.partners} partners`} tone="live" />
              <Stat label="Active this week" value={count(g.active.week.total)} sub={`${g.active.week.customers} customers · ${g.active.week.partners} partners`} />
              <Stat label="Active this month" value={count(g.active.month.total)} sub={`${g.active.month.customers} customers · ${g.active.month.partners} partners`} />
              <Stat label="All accounts" value={count(g.totals.users)} sub={`${g.totals.customers} customers · ${g.totals.barbers} barbers · ${g.totals.owners} owners`} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="New customer funnel" note={`Customers who signed up in the last ${days} days`}>
                <ul className="space-y-3">
                  <Step label="Started signing up, still waiting for the email code" value={g.funnel.startedNotFinished} />
                  <Step label="Started but never verified (code expired)" value={g.funnel.gaveUp} />
                  <Step label="Signed up" value={g.funnel.signedUp} of={g.funnel.signedUp} />
                  <Step label="Made a first booking" value={g.funnel.firstBooking} of={g.funnel.signedUp} note={percent(g.funnel.signupToBookingRate)} />
                  <Step label="Booked again" value={g.funnel.bookedAgain} of={g.funnel.signedUp} note={percent(g.funnel.repeatRate)} />
                </ul>
                <p className="mt-4 text-[12px] font-semibold text-[#64748B]">
                  Customers who booked in this period: <b className="text-[#1E293B]">{g.bookers.firstTime}</b> first-timers and <b className="text-[#1E293B]">{g.bookers.returning}</b> returning.
                </p>
              </Panel>

              <Panel title="Push notification reach" note="Accounts with at least one device registered for push">
                <div className="grid grid-cols-2 gap-4">
                  <Stat label="Customers" value={percent(g.push.customers.percent)} sub={`${g.push.customers.withPush} of ${g.push.customers.users}`} tone={g.push.customers.withPush ? 'live' : 'signal'} />
                  <Stat label="Partners" value={percent(g.push.partners.percent)} sub={`${g.push.partners.withPush} of ${g.push.partners.users}`} tone={g.push.partners.withPush ? 'live' : 'signal'} />
                </div>
                <p className="mt-3 text-[12px] font-semibold text-[#64748B]">
                  {g.push.devices} device{g.push.devices === 1 ? '' : 's'} registered{g.push.platforms.length ? `: ${g.push.platforms.map((p) => `${p.count} ${p.key}`).join(', ')}` : ''}.
                  {g.push.devices === 0 && ' No phone can receive push yet: Android push needs Firebase (FCM) set up in the apps.'}
                </p>
              </Panel>
            </div>

            <Panel title="Sign-ups per day" note={`Last ${days} days`}>
              <Columns points={g.signupsByDay.map((d) => ({ label: d.day.slice(5), value: d.customers + d.barbers + d.owners }))} />
              <p className="mt-3 text-[12px] font-semibold text-[#64748B]">
                {g.signupsByDay.reduce((s, d) => s + d.customers, 0)} customers, {g.signupsByDay.reduce((s, d) => s + d.barbers, 0)} barbers and {g.signupsByDay.reduce((s, d) => s + d.owners, 0)} shop owners. {g.totals.unverified} accounts have not verified their email.
              </p>
            </Panel>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Referrals" note={`${g.referrals.codes} referral codes · ${g.referrals.total} referrals (${g.referrals.inPeriod} in this period)`}>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {g.referrals.byStatus.map((s) => <Badge key={s.key} tone="primary">{s.key}: {s.count}</Badge>)}
                  <Badge tone="warning">{g.referrals.referredWithoutBooking} invited people never booked</Badge>
                </div>
                {g.referrals.topReferrers.length === 0 ? (
                  <Empty title="No referrals yet" />
                ) : (
                  <ol className="space-y-1.5 text-[13px]">
                    {g.referrals.topReferrers.map((r) => (
                      <li key={r.userId} className="flex justify-between gap-3">
                        <Link href={`/users/${r.userId}`} className="font-semibold hover:text-[#635BFF]">{r.name ?? r.userId.slice(0, 8)}</Link>
                        <span className="tabular-nums font-bold">{r.count}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
              <Panel title="Referral patterns to check" note="3 or more sign-ups through one person on the same day">
                {g.referrals.suspicious.length === 0 ? (
                  <Empty title="Nothing unusual" hint="Bursts of sign-ups through one code show up here." />
                ) : (
                  <ul className="space-y-1.5 text-[13px]">
                    {g.referrals.suspicious.map((r) => (
                      <li key={`${r.userId}${r.day}`} className="flex justify-between gap-3">
                        <Link href={`/users/${r.userId}`} className="font-semibold hover:text-[#635BFF]">{r.name ?? r.userId.slice(0, 8)}</Link>
                        <span><Badge tone="warning">{r.count} on {r.day}</Badge></span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </>
        )}
      </Canvas>
    </>
  );
}
