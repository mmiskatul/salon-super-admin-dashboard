'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCw } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { getMoney, type InsightDays } from '@/lib/api/insights';
import { placeHref } from '@/lib/placeHref';
import { count, money } from '@/lib/format';
import { Badge, Button, Canvas, Empty, Failed, Loading, PageHead, Panel, Stat } from '@/components/ui/primitives';
import { Columns, DaysPicker } from '@/components/insights/Bits';

function Ranked({ rows }: { rows: { key: string; name: string; amount: number; count?: number }[] }) {
  if (rows.length === 0) return <Empty title="Nothing yet" />;
  return (
    <ol className="space-y-1.5 text-[13px]">
      {rows.map((r) => (
        <li key={r.key} className="flex justify-between gap-3">
          <Link href={placeHref(r.key)} className="truncate font-semibold hover:text-[#635BFF]">{r.name}</Link>
          <span className="tabular-nums font-bold">{money(r.amount)}{r.count !== undefined && <span className="ml-1.5 font-semibold text-[#94A3B8]">· {r.count}</span>}</span>
        </li>
      ))}
    </ol>
  );
}

/** Cash handled through bookings, what coupons cost, and balances still owed (gift cards, wallets, points). */
export default function MoneyPage() {
  const [days, setDays] = useState<InsightDays>(30);
  const data = useApi(() => getMoney(days), [days], 'insights-money');
  const m = data.data;
  return (
    <>
      <PageHead
        eyebrow="Insights"
        title="Money"
        lede="SalunBD is cash-only: this is the cash shops recorded as paid, what coupons gave away, and the balances still owed to customers (gift cards, wallet credit and loyalty points)."
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
        ) : !m ? (
          <Loading label="Adding up payments" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Cash recorded" value={money(m.cash.total)} sub={`${count(m.cash.payments)} payments`} tone="live" />
              <Stat label="Coupon discounts given" value={money(m.coupons.discountGiven)} sub={`${m.coupons.bookingsWithCoupon} completed bookings · ${m.coupons.redemptions} redemptions`} />
              <Stat label="Gift card balances owed" value={money(m.giftCards.outstanding)} sub={`${m.giftCards.liveCards} live cards · ${m.giftCards.expired} expired`} tone={m.giftCards.outstanding > 0 ? 'signal' : 'plain'} />
              <Stat label="Wallet credit held" value={money(m.wallets.totalBalance)} sub={`${m.wallets.withBalance} wallets · ${count(m.loyalty.pointsOutstanding)} loyalty points`} />
            </div>
            <Panel title="Cash per day" note={`Last ${days} days`} actions={<div className="flex gap-1.5">{m.cash.byMethod.map((x) => <Badge key={x.key} tone="primary">{x.key}: {x.count}</Badge>)}</div>}>
              <Columns points={m.cash.byDay.map((d) => ({ label: d.day.slice(5), value: d.amount }))} color="#16A34A" format={money} />
            </Panel>
            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="Cash by shop / barber" note="Amount · payments"><Ranked rows={m.cash.byPlace} /></Panel>
              <Panel title="Coupon cost by shop" note="Discounts given on completed bookings">
                <Ranked rows={m.coupons.byPlace} />
                {m.coupons.topCodes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">{m.coupons.topCodes.map((c) => <Badge key={c.key}>{c.key} × {c.count}</Badge>)}</div>
                )}
              </Panel>
              <Panel title="Gift card balances by shop" note="Still to be spent at the shop"><Ranked rows={m.giftCards.byShop} /></Panel>
            </div>
            <Panel title="Loyalty">
              <p className="text-[13px] font-semibold text-[#64748B]">
                <b className="text-[#1E293B]">{count(m.loyalty.pointsOutstanding)}</b> points held by <b className="text-[#1E293B]">{m.loyalty.accountsWithPoints}</b> customers. Points aren&apos;t cash and can&apos;t be paid out.
              </p>
            </Panel>
          </>
        )}
      </Canvas>
    </>
  );
}
