'use client';

import { useCallback, useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { API_BASE_URL, getSession } from '@/lib/api-client';
import { count } from '@/lib/format';
import {
  Badge,
  Button,
  Canvas,
  Loading,
  PageHead,
  Panel,
  Stat,
} from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';

/**
 * Which backend each screen leans on, and what it cannot do yet.
 *
 * Two halves. The top half is live: one cheap request per backing service, through the gateway,
 * to show whether that service is answering right now — the gateway proxies by path prefix, so a
 * single dead service shows up as one prefix failing while the rest are fine, which is exactly the
 * distinction an operator needs when a panel elsewhere breaks.
 *
 * The bottom half is a written record of what the platform exposes and what this console does with
 * it, including the endpoints that do not exist. Those gaps are the reason several screens are
 * shaped the way they are, and writing them down here is what keeps that a known limitation rather
 * than a mystery for whoever picks this up next.
 */

interface Probe {
  service: string;
  /** The path prefix the gateway routes to this service, per service-gateway/src/routes.ts. */
  prefix: string;
  path: string;
  note: string;
}

const PROBES: Probe[] = [
  {
    service: 'service-auth',
    prefix: '/auth',
    path: '/auth/barbers/independent',
    note: 'Sign-in, sessions, registration',
  },
  {
    service: 'service-business',
    prefix: '/tenants',
    path: '/tenants',
    note: 'Shops, staff, catalogue, locations, files',
  },
  {
    service: 'service-booking',
    prefix: '/appointments',
    path: '/reviews?tenantId=probe',
    note: 'Bookings, schedules, reviews',
  },
  {
    service: 'service-user',
    prefix: '/profile',
    path: '/profile/bulk?ids=probe',
    note: 'Profiles, working hours, support tickets',
  },
  {
    service: 'service-payment',
    prefix: '/transactions',
    path: '/coupons/active',
    note: 'Transactions, wallets, coupons, budgeting',
  },
  {
    service: 'service-notification',
    prefix: '/notifications',
    path: '/notifications/preferences/me',
    note: 'Notifications and preferences',
  },
  {
    service: 'service-report',
    prefix: '/metrics',
    path: '/metrics/latest?tenantId=probe&metric=probe',
    note: 'Metric snapshots',
  },
];

interface ProbeResult {
  status: number | null;
  ms: number;
  reachable: boolean;
  detail: string;
}

export default function SystemPage() {
  const [results, setResults] = useState<Record<string, ProbeResult>>({});
  const [running, setRunning] = useState(true);

  const run = useCallback(async () => {
    setRunning(true);
    setResults({});
    const session = getSession();

    await Promise.all(
      PROBES.map(async (probe) => {
        const started = performance.now();
        try {
          const res = await fetch(`${API_BASE_URL}${probe.path}`, {
            headers: session ? { authorization: `Bearer ${session.accessToken}` } : {},
          });
          const ms = Math.round(performance.now() - started);
          // Any HTTP answer means the gateway reached the service. A 400/404 from a deliberately
          // bogus probe id still proves the service is up — only a network failure, a gateway 502,
          // or a 504 says otherwise.
          const reachable = res.status !== 502 && res.status !== 503 && res.status !== 504;
          setResults((prev) => ({
            ...prev,
            [probe.service]: {
              status: res.status,
              ms,
              reachable,
              detail: reachable ? `HTTP ${res.status}` : `Gateway could not reach it (${res.status})`,
            },
          }));
        } catch (err) {
          setResults((prev) => ({
            ...prev,
            [probe.service]: {
              status: null,
              ms: Math.round(performance.now() - started),
              reachable: false,
              detail: err instanceof Error ? err.message : 'Request failed',
            },
          }));
        }
      }),
    );
    setRunning(false);
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  const answered = PROBES.filter((p) => results[p.service]?.reachable).length;
  const checked = PROBES.filter((p) => results[p.service]).length;

  return (
    <>
      <PageHead
        eyebrow="Operations"
        title="API coverage"
        lede="Which services are answering right now, and what this console can and cannot do against them."
        actions={
          <Button onClick={run} disabled={running}>
            <RotateCw size={12} className={running ? 'animate-spin' : ''} />
            Re-check
          </Button>
        }
      />

      <Canvas>
        <div className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-3">
          <Stat
            label="Services answering"
            value={`${answered}/${PROBES.length}`}
            tone={answered === PROBES.length ? 'live' : 'signal'}
            pending={checked === 0}
          />
          <Stat
            label="Gateway"
            value={API_BASE_URL.replace(/^https?:\/\//, '')}
            sub="Every request on this console goes through here"
          />
          <Stat
            label="Screens wired to real data"
            value={`${count(COVERAGE.filter((c) => c.state === 'wired').length)}/${count(COVERAGE.length)}`}
            sub="Nothing on this console reads from fixtures"
            tone="live"
          />
        </div>

        <Panel
          flush
          title="Service reachability"
          note="One cheap request per service, through the gateway."
        >
          {checked === 0 ? (
            <div className="p-4">
              <Loading label="Checking services" />
            </div>
          ) : (
            <Scroll>
              <Table>
                <thead>
                  <tr>
                    <Th>Service</Th>
                    <Th>Handles</Th>
                    <Th>Probe</Th>
                    <Th align="right">Answer</Th>
                    <Th align="right">Round trip</Th>
                    <Th align="right">State</Th>
                  </tr>
                </thead>
                <tbody>
                  {PROBES.map((probe) => {
                    const result = results[probe.service];
                    return (
                      <Tr key={probe.service}>
                        <Td mono>{probe.service}</Td>
                        <Td muted nowrap={false}>{probe.note}</Td>
                        <Td mono muted>{probe.path}</Td>
                        <Td align="right" mono muted>{result?.detail ?? '—'}</Td>
                        <Td align="right" mono muted>{result ? `${result.ms} ms` : '—'}</Td>
                        <Td align="right">
                          {!result ? (
                            <Badge tone="quiet">Checking</Badge>
                          ) : result.reachable ? (
                            <Badge tone="live">Answering</Badge>
                          ) : (
                            <Badge tone="signal">No answer</Badge>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </Scroll>
          )}
        </Panel>

        <Panel flush title="What each screen reads" note="Every figure on this console comes from one of these calls.">
          <Scroll>
            <Table>
              <thead>
                <tr>
                  <Th>Screen</Th>
                  <Th>Reads</Th>
                  <Th>Writes</Th>
                  <Th align="right">State</Th>
                </tr>
              </thead>
              <tbody>
                {COVERAGE.map((row) => (
                  <Tr key={row.screen}>
                    <Td>{row.screen}</Td>
                    <Td mono muted nowrap={false}>{row.reads}</Td>
                    <Td mono muted nowrap={false}>{row.writes ?? '—'}</Td>
                    <Td align="right">
                      <Badge tone="live">Live data</Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Scroll>
        </Panel>

        <Panel
          title="What the backend does not offer yet"
          note="Each of these shapes a screen above. None is a bug in this console."
        >
          <ul className="space-y-3.5">
            {GAPS.map((gap) => (
              <li key={gap.title} className="border-l-2 border-signal/40 pl-3">
                <p className="text-[13px] font-semibold">{gap.title}</p>
                <p className="mt-1 max-w-[80ch] text-[12px] leading-relaxed text-ink-2">{gap.detail}</p>
                <p className="mt-1.5 max-w-[80ch] text-[12px] leading-relaxed text-ink-3">
                  <span className="eyebrow !inline !text-ink-3">Would need&nbsp;</span>
                  {gap.needs}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </Canvas>
    </>
  );
}

const COVERAGE: { screen: string; reads: string; writes?: string; state: 'wired' }[] = [
  {
    screen: 'Overview',
    reads: 'GET /tenants, then per shop: /staff, /catalog/services, /appointments, /reviews, /transactions',
    state: 'wired',
  },
  {
    screen: 'Shops',
    reads: 'GET /tenants + the same per-shop sweep',
    writes: 'POST /tenants',
    state: 'wired',
  },
  {
    screen: 'Shop detail',
    reads:
      'GET /tenants/:id, /staff, /catalog/services, /appointments, /reviews, /transactions, /locations, /shop-hours/:id, /inventory/products, /clients, /files',
    writes: 'PATCH /tenants/:id, DELETE /tenants/:id',
    state: 'wired',
  },
  {
    screen: 'Independent barbers',
    reads: 'GET /auth/barbers/independent, /profile/bulk, /catalog/services?ownerUserId',
    state: 'wired',
  },
  {
    screen: 'Users & accounts',
    reads: 'GET /auth/users?role&search, /wallets/:id, /wallets/:id/entries',
    state: 'wired',
  },
  {
    screen: 'Bookings',
    reads: 'GET /tenants, then GET /appointments?tenantId&date per shop',
    state: 'wired',
  },
  { screen: 'Payments', reads: 'GET /tenants, then GET /transactions?tenantId per shop', state: 'wired' },
  {
    screen: 'Coupons & offers',
    reads: 'GET /coupons',
    writes: 'POST /coupons',
    state: 'wired',
  },
  {
    screen: 'Shop subscriptions',
    reads: 'GET /subscriptions, GET /tenants',
    writes: 'PUT /subscriptions/:tenantId',
    state: 'wired',
  },
  {
    screen: 'Broadcasts',
    reads: 'GET /notifications/recent, GET /tenants',
    writes: 'POST /notifications/broadcast',
    state: 'wired',
  },
  { screen: 'Metrics', reads: 'GET /metrics/series', writes: 'POST /metrics', state: 'wired' },
  {
    screen: 'Support',
    reads: 'GET /tickets?status&category, GET /tickets/:id',
    writes: 'POST /tickets/:id/messages, PATCH /tickets/:id/status',
    state: 'wired',
  },
  { screen: 'API coverage', reads: 'One probe request per service, through the gateway', state: 'wired' },
];

const GAPS: { title: string; detail: string; needs: string }[] = [
  {
    title: 'No cross-tenant aggregate',
    detail:
      'GET /tenants is the only call that spans the platform. Every other list endpoint is scoped to one shop, so platform totals are summed in the browser by fanning out over the roster — five requests per shop. It is correct but it scales linearly with the number of shops.',
    needs: 'a reporting endpoint that returns per-tenant counts in one response.',
  },
  {
    title: 'The shop roster is unpaginated',
    detail:
      'TenantService.findAll() is a bare findMany() with no take or skip, so GET /tenants returns every shop in one response. Fine at the current size, and the reason the roster can compute totals client-side at all.',
    needs: 'page and pageSize parameters on GET /tenants before the platform passes a few hundred shops.',
  },
  {
    title: 'No metric name registry',
    detail:
      'service-report stores a free-text metric name per snapshot and exposes no way to list which names exist, so the Metrics screen has to ask for the name instead of offering a choice.',
    needs: 'a distinct-metric-names endpoint, or a fixed set of metric names in the contracts package.',
  },
  {
    title: 'Deleting a shop leaves its records behind',
    detail:
      'DELETE /tenants/:id removes the tenant row in service-business only. Bookings, transactions, reviews and staff rows live in other databases and keep pointing at a shop that no longer exists. The delete dialog warns about this, but the cleanup does not happen.',
    needs: 'a tenant-deletion event the other services subscribe to, or a documented archive-instead-of-delete policy.',
  },
];
