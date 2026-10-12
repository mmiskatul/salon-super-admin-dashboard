'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RotateCw, Search } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import {
  getLogins,
  LOGIN_METHOD_LABELS,
  LOGIN_ROLE_COLORS,
  LOGIN_ROLE_LABELS,
  PLATFORM_LABELS,
  type InsightDays,
  type LoginMethod,
  type LoginRole,
} from '@/lib/api/insights';
import { count, date } from '@/lib/format';
import { Badge, Button, Canvas, Empty, Failed, Loading, PageHead, Panel, Stat } from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { Bars, Columns, DaysPicker, Donut, Heatmap, StackedColumns } from '@/components/insights/Bits';

const ROLES = Object.keys(LOGIN_ROLE_LABELS) as LoginRole[];
const ROLE_ONE: Record<string, string> = { CUSTOMER: 'Customer', BARBER: 'Barber', OWNER: 'Shop owner', STAFF: 'Shop staff', SUPER_ADMIN: 'Admin' };
const METHOD_COLORS: Record<string, string> = { PASSWORD: '#635BFF', GOOGLE: '#16A34A', SIGN_UP: '#F59E0B' };
const PLATFORM_COLORS: Record<string, string> = { ANDROID: '#16A34A', IOS: '#0F172A', WEB: '#0EA5E9', UNKNOWN: '#CBD5E1' };

/** Times on this page are Bangladesh time, wherever the console is opened. */
function bdTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit', hour12: true });
}
function bdDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return `${d.toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short' })}, ${bdTime(value)}`;
}
/** "12 Oct" from a YYYY-MM-DD day. */
function dayLabel(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });
}
function dayLong(day: string, today: string): string {
  const label = new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  if (day === today) return `today (${label})`;
  const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  return day === yesterday ? `yesterday (${label})` : label;
}
function change(now: number, before: number): string {
  if (!before) return now ? 'none yesterday' : 'same as yesterday';
  const diff = now - before;
  if (!diff) return 'same as yesterday';
  return `${diff > 0 ? '+' : ''}${diff} vs yesterday (${before})`;
}
const hourLabel = (h: number) => (h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`);

/**
 * Daily logins: how many people use SalunBD each day, and exactly who and when. A person counts
 * once per Bangladesh day, whether they signed in or opened an app they were already signed in to.
 */
export default function LoginsPage() {
  const [days, setDays] = useState<InsightDays>(30);
  const [day, setDay] = useState<string>('');
  const [role, setRole] = useState<LoginRole | ''>('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const data = useApi(() => getLogins({ days, day: day || undefined, role, q, page, pageSize: 50 }), [days, day, role, q, page], 'logins');
  const d = data.data;
  const pick = (next: string) => {
    setDay(next);
    setPage(1);
    document.getElementById('who')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <PageHead
        eyebrow="People"
        title="Daily logins"
        lede="How many people use SalunBD each day, who they are and when. Someone counts once a day: when they sign in, or when they open an app they're already signed in to. Times are Bangladesh time."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DaysPicker value={days} onChange={setDays} />
            <Button onClick={data.refresh} disabled={data.loading}><RotateCw className="h-4 w-4" /> Refresh</Button>
          </div>
        }
      />
      <Canvas>
        {data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : !d ? (
          <Loading label="Loading logins" />
        ) : (
          <>
            {(!d.trackingSince || d.trackingSince > d.series[0].day) && (
              <p className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3 text-[13px] font-semibold text-[#92400E]">
                {d.trackingSince
                  ? `Recording started on ${dayLabel(d.trackingSince)}, so earlier days are empty. Averages only use the days since then.`
                  : 'Recording has just started. The first numbers appear as soon as someone signs in or opens an app.'}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Active today" value={count(d.summary.activeToday)} sub={change(d.summary.activeToday, d.summary.activeYesterday)} tone="live" />
              <Stat label="Signed in today" value={count(d.summary.signedInToday)} sub={change(d.summary.signedInToday, d.summary.signedInYesterday)} />
              <Stat
                label="Online now"
                value={count(d.summary.onlineNow)}
                sub={d.summary.onlineByRole.length ? d.summary.onlineByRole.map((r) => `${r.count} ${(ROLE_ONE[r.key] ?? r.key).toLowerCase()}`).join(' · ') : 'Used an app in the last 15 minutes'}
              />
              <Stat label="New accounts today" value={count(d.summary.newToday)} sub="Signed up and used the app today" />
              <Stat label={`Different people, ${days} days`} value={count(d.summary.uniqueActive)} sub="Each person counted once" />
              <Stat label="Average per day" value={d.summary.averageActive ?? '—'} sub={`${d.summary.averageSignedIn ?? '—'} signed in per day`} />
              <Stat label="Busiest day" value={d.summary.peak ? count(d.summary.peak.active) : '—'} sub={d.summary.peak ? dayLabel(d.summary.peak.day) : 'No data yet'} />
              <Stat label={`Sign-ins, ${days} days`} value={count(d.summary.signIns)} sub="Email, Google and new accounts" />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Panel title="Active people per day" note="By type of account">
                <StackedColumns
                  points={d.series.map((s) => ({ label: dayLabel(s.day), values: s.byRole }))}
                  series={ROLES.map((r) => ({ key: r, label: LOGIN_ROLE_LABELS[r], color: LOGIN_ROLE_COLORS[r] }))}
                />
              </Panel>
              <Panel title="New and returning" note="New = the account was made that day">
                <StackedColumns
                  points={d.series.map((s) => ({ label: dayLabel(s.day), values: { returning: s.returning, newUsers: s.newUsers } }))}
                  series={[
                    { key: 'returning', label: 'Returning', color: '#635BFF' },
                    { key: 'newUsers', label: 'New', color: '#F59E0B' },
                  ]}
                />
              </Panel>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="How they signed in" note={`${days} days`}>
                <Donut
                  size={140}
                  centre={count(d.summary.signIns)}
                  parts={d.methods.map((m) => ({ label: LOGIN_METHOD_LABELS[m.key as LoginMethod] ?? m.key, value: m.count, color: METHOD_COLORS[m.key] ?? '#CBD5E1' }))}
                />
              </Panel>
              <Panel title="Phone or computer" note="Sign-ins by device">
                <Donut
                  size={140}
                  parts={d.platforms.map((p) => ({ label: PLATFORM_LABELS[p.key] ?? p.key, value: p.count, color: PLATFORM_COLORS[p.key] ?? '#CBD5E1' }))}
                />
              </Panel>
              <Panel title="Who signed in" note="Sign-ins by account type">
                <Bars rows={d.signInRoles.map((r) => ({ label: LOGIN_ROLE_LABELS[r.key as LoginRole] ?? r.key, value: r.count, color: LOGIN_ROLE_COLORS[r.key as LoginRole] }))} format={count} />
              </Panel>
            </div>

            <Panel title="When people sign in" note={`Weekday and hour, Bangladesh time, last ${days} days`}>
              <Heatmap grid={d.weekHours} unit="sign-in" />
            </Panel>

            <Panel title="Day by day" note="Choose a day to see everyone who was active on it" flush>
              <div className="max-h-[440px] overflow-y-auto">
              <Scroll>
                <Table>
                  <thead>
                    <tr>
                      <Th>Day</Th>
                      <Th align="right">Active</Th>
                      <Th align="right">Signed in</Th>
                      <Th align="right">New</Th>
                      <Th align="right">Returning</Th>
                      {ROLES.map((r) => <Th key={r} align="right">{LOGIN_ROLE_LABELS[r]}</Th>)}
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {[...d.series].reverse().map((s) => (
                      <Tr key={s.day}>
                        <Td nowrap><b>{dayLabel(s.day)}</b>{s.day === d.today && <span className="ml-2"><Badge tone="live">Today</Badge></span>}</Td>
                        <Td align="right"><b>{count(s.active)}</b></Td>
                        <Td align="right">{count(s.signedIn)}</Td>
                        <Td align="right">{count(s.newUsers)}</Td>
                        <Td align="right">{count(s.returning)}</Td>
                        {ROLES.map((r) => <Td key={r} align="right" muted>{s.byRole[r] ? count(s.byRole[r]) : '·'}</Td>)}
                        <Td align="right">
                          {s.day === d.day.day ? (
                            <span className="text-[12px] font-bold text-[#635BFF]">Showing below</span>
                          ) : (
                            <button type="button" onClick={() => pick(s.day)} disabled={!s.active} className="text-[12px] font-bold text-[#635BFF] hover:underline disabled:text-[#CBD5E1] disabled:no-underline">
                              See who
                            </button>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </Scroll>
              </div>
            </Panel>

            <section id="who" className="space-y-5">
              <Panel
                title={`Who was active ${dayLong(d.day.day, d.today)}`}
                note={`${count(d.day.active)} ${d.day.active === 1 ? 'person' : 'people'} · ${count(d.day.signInCount)} sign-in${d.day.signInCount === 1 ? '' : 's'}`}
                actions={
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-[12px] font-semibold text-[#64748B]">
                      <span className="sr-only">Day</span>
                      <input
                        type="date"
                        value={d.day.day}
                        max={d.today}
                        onChange={(e) => e.target.value && pick(e.target.value)}
                        className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] font-semibold"
                      />
                    </label>
                    {d.day.day !== d.today && <Button variant="outline" onClick={() => pick('')}>Today</Button>}
                  </div>
                }>
                <p className="mb-2 text-[12px] font-semibold text-[#64748B]">Sign-ins by hour</p>
                <Columns points={d.day.signInHours.map((v, h) => ({ label: hourLabel(h), value: v }))} height={90} format={count} />
              </Panel>

              <Panel
                title="People"
                note="Most recently seen first"
                flush
                actions={
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <label className="relative w-full sm:w-64">
                      <span className="sr-only">Search people</span>
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden />
                      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email or phone" className="w-full rounded-lg border border-[#E2E8F0] py-1.5 pl-9 pr-3 text-[12px]" />
                    </label>
                    <select
                      aria-label="Account type"
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value as LoginRole | '');
                        setPage(1);
                      }}
                      className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] font-semibold sm:w-auto">
                      <option value="">Every account type</option>
                      {ROLES.map((r) => <option key={r} value={r}>{LOGIN_ROLE_LABELS[r]}</option>)}
                    </select>
                  </div>
                }>
                {d.day.people.length === 0 ? (
                  <Empty title={q || role ? 'Nobody matches' : 'Nobody was active on this day'} hint={q || role ? 'Clear the search or account type.' : 'Pick another day above.'} />
                ) : (
                  <>
                    <Scroll>
                      <Table>
                        <thead>
                          <tr>
                            <Th>Person</Th>
                            <Th>Account</Th>
                            <Th>Signed in at</Th>
                            <Th align="right">First seen</Th>
                            <Th align="right">Last seen</Th>
                            <Th align="right">App opens</Th>
                            <Th>Device</Th>
                            <Th align="right">Joined</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.day.people.map((p) => (
                            <Tr key={p.userId}>
                              <Td>
                                <Link href={`/users/${p.userId}`} className="font-bold hover:text-[#635BFF]">{p.name || p.email || p.userId.slice(0, 8)}</Link>
                                {p.isNew && <span className="ml-2"><Badge tone="warning">New</Badge></span>}
                                <p className="text-[12px] text-[#94A3B8]">{[p.email, p.phone].filter(Boolean).join(' · ') || '—'}</p>
                              </Td>
                              <Td nowrap><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: LOGIN_ROLE_COLORS[p.role as LoginRole] ?? '#CBD5E1' }} aria-hidden />{ROLE_ONE[p.role] ?? p.role}</span></Td>
                              <Td>
                                {p.signInTimes.length === 0 ? (
                                  <span className="text-[12px] text-[#94A3B8]">Already signed in</span>
                                ) : (
                                  <ul className="space-y-0.5">
                                    {p.signInTimes.map((s, i) => (
                                      <li key={i} className="whitespace-nowrap text-[12px]">
                                        <b>{bdTime(s.at)}</b> <span className="text-[#64748B]">{LOGIN_METHOD_LABELS[s.method] ?? s.method}{s.platform ? `, ${PLATFORM_LABELS[s.platform] ?? s.platform}` : ''}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </Td>
                              <Td align="right" nowrap>{bdTime(p.firstSeenAt)}</Td>
                              <Td align="right" nowrap>{bdTime(p.lastSeenAt)}</Td>
                              <Td align="right" muted>{count(p.renewals)}</Td>
                              <Td muted>{p.platform ? PLATFORM_LABELS[p.platform] ?? p.platform : '—'}</Td>
                              <Td align="right" nowrap muted>{date(p.joinedAt)}</Td>
                            </Tr>
                          ))}
                        </tbody>
                      </Table>
                    </Scroll>
                    {d.day.total > d.day.pageSize && (
                      <div className="flex items-center justify-end gap-3 border-t border-[#F1F5F9] px-5 py-3 text-[12px] font-semibold text-[#64748B]">
                        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))}>Previous</Button>
                        <span>Page {page} of {Math.ceil(d.day.total / d.day.pageSize)}</span>
                        <Button variant="outline" disabled={page * d.day.pageSize >= d.day.total} onClick={() => setPage((n) => n + 1)}>Next</Button>
                      </div>
                    )}
                  </>
                )}
              </Panel>
            </section>

            <Panel title="Latest sign-ins" note="Across SalunBD, newest first" flush>
              {d.recent.length === 0 ? (
                <Empty title="No sign-ins recorded yet" />
              ) : (
                <Scroll>
                  <Table>
                    <thead><tr><Th>When</Th><Th>Person</Th><Th>Account</Th><Th>How</Th><Th>Device</Th></tr></thead>
                    <tbody>
                      {d.recent.map((e, i) => (
                        <Tr key={`${e.userId}-${i}`}>
                          <Td nowrap>{bdDateTime(e.at)}</Td>
                          <Td><Link href={`/users/${e.userId}`} className="font-bold hover:text-[#635BFF]">{e.name || e.email || e.userId.slice(0, 8)}</Link>{e.name && e.email && <span className="ml-2 text-[12px] text-[#94A3B8]">{e.email}</span>}</Td>
                          <Td nowrap>{ROLE_ONE[e.role] ?? e.role}</Td>
                          <Td nowrap>{LOGIN_METHOD_LABELS[e.method] ?? e.method}</Td>
                          <Td muted>{e.platform ? PLATFORM_LABELS[e.platform] ?? e.platform : '—'}</Td>
                        </Tr>
                      ))}
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
