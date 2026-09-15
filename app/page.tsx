'use client';

import Link from 'next/link';
import { ArrowUpRight, RotateCw } from 'lucide-react';
import { usePlatform } from '@/lib/usePlatform';
import { vitalityOf } from '@/lib/api/platform';
import { brandColor, compact, count, money, since } from '@/lib/format';
import { Button, Canvas, Failed, Loading, PageHead, Panel, Stat } from '@/components/ui/primitives';
import { Ranked, Split } from '@/components/chart/Chart';
import Mark from '@/components/ui/Mark';
import { VitalityTag } from '@/components/ui/Vitals';

export default function OverviewPage() {
  const platform = usePlatform();
  const { tenants, vitals, totals, loading, sweeping, swept, error, reload } = platform;

  const sweepNote = tenants
    ? sweeping
      ? `Reading ${swept} of ${tenants.length} shops`
      : `${tenants.length} shops read`
    : null;

  return (
    <>
      <PageHead
        eyebrow="Platform"
        title="Overview"
        lede="Totals across every shop on the platform. There is no cross-tenant aggregate in the backend, so these are summed from each shop in turn — the figures fill in as the sweep runs."
        actions={
          <>
            {sweepNote && (
              <span className="tabular flex items-center gap-1.5 text-[11px] text-ink-2">
                {sweeping && (
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-ink-3" aria-hidden />
                )}
                {sweepNote}
              </span>
            )}
            <Button onClick={reload} disabled={loading || sweeping}>
              <RotateCw size={12} className={sweeping ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </>
        }
      />

      <Canvas>
        {error && <Failed message={error} onRetry={reload} />}
        {loading && !error && <Loading label="Loading the shop roster" />}

        {tenants && totals && !error && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
              <Stat
                label="Shops"
                value={count(totals.tenants)}
                sub={`${count(totals.listed)} visible to customers`}
              />
              <Stat
                label="Bookings"
                value={compact(totals.appointments)}
                sub={`${count(totals.upcoming)} still upcoming`}
                pending={sweeping && totals.appointments === 0}
              />
              <Stat
                label="Settled revenue"
                value={money(totals.revenue)}
                sub="Completed transactions only"
                pending={sweeping && totals.revenue === 0}
              />
              <Stat
                label="Barbers on staff"
                value={count(totals.staff)}
                sub={`${count(totals.services)} services listed`}
                pending={sweeping && totals.staff === 0}
              />
              <Stat
                label="Never set up"
                value={count(totals.dormant)}
                tone={totals.dormant > 0 ? 'signal' : 'live'}
                sub="Signed up with no staff and no services"
                pending={sweeping && swept === 0}
              />
            </div>

            {totals.incomplete > 0 && (
              <p className="rounded-lg border border-signal/25 bg-signal-soft px-4 py-2.5 text-[12px] text-signal">
                {count(totals.incomplete)} shop{totals.incomplete === 1 ? '' : 's'} did not answer
                every request, so the totals above are short by whatever those hold. Open the shop
                to see which service is not responding.
              </p>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel
                title="How the platform is being used"
                note="Every shop, grouped by how far it has got."
              >
                <Split
                  height={10}
                  segments={[
                    { key: 'live', label: 'Taking bookings', value: totals.live, color: '#22c55e' },
                    { key: 'idle', label: 'Set up, no bookings', value: totals.idle, color: '#94a3b8' },
                    { key: 'dormant', label: 'Never set up', value: totals.dormant, color: '#ef4444' },
                  ]}
                />
                <p className="mt-4 max-w-[56ch] border-t border-rule-soft pt-3 text-[12px] leading-relaxed text-ink-2">
                  A shop counts as never set up when it has no barbers and no services. Nothing in
                  the backend records this — it is worked out from what each shop actually holds.
                </p>
              </Panel>

              <Panel title="Bookings by outcome" note="Across every shop, for all time.">
                <Split
                  height={10}
                  segments={[
                    { key: 'completed', label: 'Completed', value: totals.completed, color: '#22c55e' },
                    {
                      key: 'open',
                      label: 'Open',
                      value: Math.max(
                        0,
                        totals.appointments - totals.completed - totals.cancelled,
                      ),
                      color: '#1e293b',
                    },
                    {
                      key: 'cancelled',
                      label: 'Cancelled or no-show',
                      value: totals.cancelled,
                      color: '#ef4444',
                    },
                  ]}
                />
                <p className="mt-4 max-w-[56ch] border-t border-rule-soft pt-3 text-[12px] leading-relaxed text-ink-2">
                  {totals.reviews > 0
                    ? `${count(totals.reviews)} reviews left across the platform.`
                    : 'No reviews have been left on the platform yet.'}
                </p>
              </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel
                title="Busiest shops"
                note="By bookings taken."
                actions={
                  <Link href="/shops" className="flex items-center gap-1 text-[12px] text-ink-2 hover:text-ink">
                    All shops <ArrowUpRight size={12} />
                  </Link>
                }
              >
                <Ranked
                  format={(v) => count(v)}
                  rows={tenants
                    .map((t) => ({
                      key: t.id,
                      label: t.name,
                      value: vitals[t.id]?.appointments ?? 0,
                      color: brandColor(t.brandColor),
                    }))
                    .filter((r) => r.value > 0)
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 6)}
                />
              </Panel>

              <Panel title="Needs attention" note="Shops that signed up but never furnished themselves.">
                {(() => {
                  const dormant = tenants
                    .filter((t) => vitalityOf(vitals[t.id]) === 'dormant')
                    .slice(0, 6);
                  if (dormant.length === 0) {
                    return (
                      <p className="py-6 text-[12px] text-ink-2">
                        {sweeping
                          ? 'Still reading the roster.'
                          : 'Every shop on the platform has at least a barber or a service.'}
                      </p>
                    );
                  }
                  return (
                    <ul className="divide-y divide-[#E2E8F0]">
                      {dormant.map((t) => (
                        <li key={t.id}>
                          <Link
                            href={`/shops/${t.id}`}
                            className="flex items-center gap-3 py-2.5 hover:opacity-70"
                          >
                            <Mark name={t.name} logoUrl={t.logoUrl} color={t.brandColor} size={24} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px]">{t.name}</span>
                              <span className="tabular block text-[11px] text-ink-3">
                                signed up {since(t.createdAt)}
                              </span>
                            </span>
                            <VitalityTag vitality="dormant" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel
                title="Set up, never booked"
                note="Has a barber and a service, but no bookings yet — worth a check-in."
              >
                {(() => {
                  const idle = tenants
                    .filter((t) => vitalityOf(vitals[t.id]) === 'idle')
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 6);
                  if (idle.length === 0) {
                    return (
                      <p className="py-6 text-[12px] text-ink-2">
                        {sweeping
                          ? 'Still reading the roster.'
                          : 'Every furnished shop on the platform has taken at least one booking.'}
                      </p>
                    );
                  }
                  return (
                    <ul className="divide-y divide-[#E2E8F0]">
                      {idle.map((t) => (
                        <li key={t.id}>
                          <Link
                            href={`/shops/${t.id}`}
                            className="flex items-center gap-3 py-2.5 hover:opacity-70"
                          >
                            <Mark name={t.name} logoUrl={t.logoUrl} color={t.brandColor} size={24} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px]">{t.name}</span>
                              <span className="tabular block text-[11px] text-ink-3">
                                {count(vitals[t.id]?.staff ?? 0)} staff ·{' '}
                                {count(vitals[t.id]?.services ?? 0)} services
                              </span>
                            </span>
                            <VitalityTag vitality="idle" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </Panel>

              <Panel
                title="No barbers on staff"
                note="Has at least one service listed but nobody to perform it — cannot actually take a booking."
              >
                {(() => {
                  const staffless = tenants
                    .filter((t) => {
                      const v = vitals[t.id];
                      return v && v.staff === 0 && (v.services ?? 0) > 0;
                    })
                    .slice(0, 6);
                  if (staffless.length === 0) {
                    return (
                      <p className="py-6 text-[12px] text-ink-2">
                        {sweeping
                          ? 'Still reading the roster.'
                          : 'Every shop with a service listed has at least one barber on staff.'}
                      </p>
                    );
                  }
                  return (
                    <ul className="divide-y divide-[#E2E8F0]">
                      {staffless.map((t) => (
                        <li key={t.id}>
                          <Link
                            href={`/shops/${t.id}`}
                            className="flex items-center gap-3 py-2.5 hover:opacity-70"
                          >
                            <Mark name={t.name} logoUrl={t.logoUrl} color={t.brandColor} size={24} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px]">{t.name}</span>
                              <span className="tabular block text-[11px] text-ink-3">
                                {count(vitals[t.id]?.services ?? 0)} services, 0 staff
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </Panel>
            </div>
          </>
        )}
      </Canvas>
    </>
  );
}
