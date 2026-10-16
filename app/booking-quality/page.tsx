'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  RotateCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Scissors,
  Store,
  Users,
  Calendar,
  ExternalLink,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { getBookingQuality, type InsightDays } from '@/lib/api/insights';
import { placeHref } from '@/lib/placeHref';
import { count } from '@/lib/format';
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
import { DaysPicker, duration, Heatmap, percent } from '@/components/insights/Bits';
import { BookingQualityAnalytics } from '@/components/bookings/BookingQualityAnalytics';

export default function BookingQualityPage() {
  const [days, setDays] = useState<InsightDays>(30);
  const data = useApi(() => getBookingQuality(days), [days], 'insights-bookings');
  const b = data.data;

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'high_cancel' | 'high_noshow'>('all');

  // Filtered and sorted places
  const places = useMemo(() => {
    if (!b?.places) return [];
    const q = search.trim().toLowerCase();

    return b.places.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filterMode === 'high_cancel' && (p.cancelRate ?? 0) < 15) return false;
      if (filterMode === 'high_noshow' && (p.noShowRate ?? 0) < 10) return false;
      return true;
    });
  }, [b?.places, search, filterMode]);

  return (
    <>
      <PageHead
        eyebrow="Market Quality & Operations"
        title="Booking Quality & Punctuality"
        lede="In-depth analysis of the booking lifecycle from initial request to chair completion: response latency, acceptance and cancellation causes, session punctuality, customer strikes, and peak studio hours."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DaysPicker value={days} onChange={setDays} />
            <Button onClick={data.refresh} disabled={data.loading}>
              <RotateCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        }
      />

      <Canvas>
        {data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : !b ? (
          <Loading label="Analyzing booking conversion, punctuality, and cancellation forensics..." />
        ) : (
          <>
            {/* Executive 6-Stat KPI Strip */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 font-manrope">
              <Stat
                label="Booking Requests"
                value={count(b.funnel.requested)}
                sub="App appointments"
                pending={data.loading}
              />
              <Stat
                label="Accepted Rate"
                value={percent(b.funnel.acceptRate)}
                sub={`${b.funnel.accepted} accepted`}
                pending={data.loading}
                tone="live"
              />
              <Stat
                label="Completed Visits"
                value={percent(b.funnel.completionRate)}
                sub={`${b.funnel.completed} serviced`}
                pending={data.loading}
                tone="live"
              />
              <Stat
                label="Median Acceptance"
                value={duration(b.acceptance.medianMinutes)}
                sub={
                  b.acceptance.measured
                    ? `${percent(b.acceptance.within15min)} within 15 min`
                    : 'Recorded recently'
                }
                pending={data.loading}
              />
              <Stat
                label="Session On-Time"
                value={percent(b.sessions.onTime)}
                sub="Started within 5m"
                pending={data.loading}
                tone="live"
              />
              <Stat
                label="Overran 15+ Min"
                value={count(b.sessions.overranBy15)}
                sub="Delayed subsequent visits"
                pending={data.loading}
                tone={b.sessions.overranBy15 > 0 ? 'signal' : 'plain'}
              />
            </div>

            {/* Recharts Analytics Suite */}
            <BookingQualityAnalytics
              data={b}
              onSelectPlace={(placeKey) => {
                setSearch(placeKey);
              }}
            />

            {/* Heatmap Panel: Peak Hours */}
            <Panel
              title="Busiest Operating Hours Heatmap"
              note="Scheduled client start times by day of week and hour of day (darker purple = peak chair demand)"
            >
              <Heatmap grid={b.heatmap} />
            </Panel>

            {/* Split Forensics Panels: Reasons & Customer Strikes */}
            <div className="grid gap-6 lg:grid-cols-2 font-manrope">
              {/* Cancellation Reasons Breakdown */}
              <Panel
                title="Cancellation Reasons Forensics"
                note={`${b.cancellations.total} total cancellations · ${b.cancellations.late} late within 24h`}
              >
                {b.cancellations.reasons.length === 0 ? (
                  <Empty title="No cancellations recorded in this period" />
                ) : (
                  <div className="space-y-2">
                    {b.cancellations.reasons.map((r) => {
                      const share = b.cancellations.total
                        ? Math.round((r.count / b.cancellations.total) * 100)
                        : 0;
                      return (
                        <div
                          key={r.key}
                          className="p-3 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="font-bold text-[#1E293B] truncate">{r.key}</span>
                            <span className="font-extrabold text-[#1E293B] tabular-nums">
                              {r.count} <span className="text-[#94A3B8] font-semibold">({share}%)</span>
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#F59E0B]"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>

              {/* Customer Late Cancellation Strikes */}
              <Panel
                title="Customers with Late-Cancel Strikes"
                note={`Limit: ${b.cancellations.strikeLimit} strikes in ${b.cancellations.strikeWindowDays} days restricts to 1 concurrent booking`}
              >
                {b.cancellations.customersWithStrikes.length === 0 ? (
                  <Empty title="No clients currently near or at the strike limit" />
                ) : (
                  <div className="space-y-2">
                    {b.cancellations.customersWithStrikes.map((c) => (
                      <div
                        key={c.userId}
                        className="p-3 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between gap-3 hover:border-indigo-200 transition-colors"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/users/${c.userId}`}
                            className="font-bold text-[13px] text-[#1E293B] hover:text-[#635BFF] transition-colors truncate block"
                          >
                            {c.name || `User #${c.userId.slice(0, 8)}`}
                          </Link>
                          <p className="text-[11px] text-[#94A3B8] mt-0.5">ID: {c.userId}</p>
                        </div>
                        <div className="shrink-0">
                          {c.restricted ? (
                            <Badge tone="signal">{c.lateCancels} strikes · Restricted</Badge>
                          ) : (
                            <Badge tone="warning">{c.lateCancels} late strikes</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            {/* Venue Quality Registry Table */}
            <Panel
              title="Venue Quality & Reliability Comparison"
              note="Benchmarked no-show and cancellation rates across studios and independent stylists"
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Search venue..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1 text-[12px] rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
                    />
                  </div>

                  <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setFilterMode('all')}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        filterMode === 'all' ? 'bg-[#635BFF] text-white' : 'text-[#64748B]'
                      }`}
                    >
                      All Venues
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('high_cancel')}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        filterMode === 'high_cancel' ? 'bg-[#F59E0B] text-white' : 'text-[#64748B]'
                      }`}
                    >
                      Cancel &gt; 15%
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('high_noshow')}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        filterMode === 'high_noshow' ? 'bg-[#EF4444] text-white' : 'text-[#64748B]'
                      }`}
                    >
                      No-Show &gt; 10%
                    </button>
                  </div>
                </div>
              }
              flush
            >
              {places.length === 0 ? (
                <Empty title="No bookings recorded for this filter" hint="Try switching periods or clearing filters." />
              ) : (
                <Scroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Studio / Stylist</Th>
                        <Th align="right">Requests</Th>
                        <Th align="right">No-Shows</Th>
                        <Th align="right">No-Show Rate</Th>
                        <Th align="right">Cancelled</Th>
                        <Th align="right">Cancel Rate</Th>
                        <Th align="right">Action</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {places.map((p) => {
                        const href = placeHref(p.key);
                        const isHighCancel = (p.cancelRate ?? 0) >= 20;
                        const isHighNoShow = (p.noShowRate ?? 0) >= 15;

                        return (
                          <Tr key={p.key}>
                            <Td>
                              <Link
                                href={href}
                                className="font-bold text-[#1E293B] hover:text-[#635BFF] transition-colors"
                              >
                                {p.name}
                              </Link>
                            </Td>
                            <Td align="right" nowrap className="font-extrabold text-[#1E293B]">
                              {p.total}
                            </Td>
                            <Td align="right" nowrap className="tabular-nums text-[#64748B]">
                              {p.noShow}
                            </Td>
                            <Td align="right" nowrap>
                              <span
                                className={`font-bold tabular-nums ${
                                  isHighNoShow ? 'text-[#EF4444]' : 'text-[#64748B]'
                                }`}
                              >
                                {percent(p.noShowRate)}
                              </span>
                            </Td>
                            <Td align="right" nowrap className="tabular-nums text-[#64748B]">
                              {p.cancelled}
                            </Td>
                            <Td align="right" nowrap>
                              <span
                                className={`font-bold tabular-nums ${
                                  isHighCancel ? 'text-[#F59E0B]' : 'text-[#64748B]'
                                }`}
                              >
                                {percent(p.cancelRate)}
                              </span>
                            </Td>
                            <Td align="right" nowrap>
                              <Link
                                href={href}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#635BFF] hover:underline"
                              >
                                View <ExternalLink className="h-3 w-3" />
                              </Link>
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
    </>
  );
}
