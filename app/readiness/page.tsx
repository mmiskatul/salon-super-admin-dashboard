'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  RotateCw,
  BellRing,
  Search,
  LayoutGrid,
  List,
  Store,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Camera,
  Calendar,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  X,
  Phone,
  Mail,
  Users,
  Sparkles,
} from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import {
  getReadiness,
  nudgeListing,
  STEP_LABELS,
  type ListingStep,
  type ReadinessRow,
} from '@/lib/api/insights';
import { count, date, since } from '@/lib/format';
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
import { percent, StepChecks } from '@/components/insights/Bits';
import { ReadinessAnalytics } from '@/components/readiness/ReadinessAnalytics';

type FocusTab =
  | 'all'
  | 'hidden'
  | 'almost_ready'
  | 'visible'
  | 'shops'
  | 'barbers'
  | 'no_hours'
  | 'stale';

type SortKey = 'completion_asc' | 'completion_desc' | 'days_desc' | 'days_asc' | 'slots_desc' | 'name';
type ViewMode = 'grid' | 'table';

const STEP_ICONS: Record<ListingStep, React.ComponentType<{ className?: string }>> = {
  service: Scissors,
  hours: Clock,
  location: MapPin,
  photos: Camera,
};

export default function ReadinessPage() {
  const data = useApi(getReadiness, [], 'insights-readiness');
  const nudge = useMutation(nudgeListing);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FocusTab>('hidden');
  const [step, setStep] = useState<ListingStep | 'any'>('any');
  const [sort, setSort] = useState<SortKey>('completion_asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sent, setSent] = useState<Record<string, string>>({});

  // Summary helper
  const s = data.data?.summary;

  // Filtered and sorted rows
  const rows = useMemo(() => {
    const all = data.data?.rows ?? [];
    const q = search.trim().toLowerCase();

    const filtered = all.filter((r) => {
      // 1. Search Query
      if (q) {
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesContact =
          (r.contactName && r.contactName.toLowerCase().includes(q)) ||
          (r.contactEmail && r.contactEmail.toLowerCase().includes(q)) ||
          (r.contactPhone && r.contactPhone.toLowerCase().includes(q));
        const matchesAddress = r.address && r.address.toLowerCase().includes(q);
        const matchesId = r.id.toLowerCase().includes(q);

        if (!matchesName && !matchesContact && !matchesAddress && !matchesId) {
          return false;
        }
      }

      // 2. Step Requirement Filter
      if (step !== 'any' && !r.missing.includes(step)) {
        return false;
      }

      // 3. Tab Filter
      switch (tab) {
        case 'hidden':
          return !r.listed;
        case 'almost_ready':
          return !r.listed && r.missing.length === 1;
        case 'visible':
          return r.listed;
        case 'shops':
          return r.kind === 'shop';
        case 'barbers':
          return r.kind === 'barber';
        case 'no_hours':
          return r.listed && r.openSlots7d === 0;
        case 'stale':
          return !r.listed && r.daysSinceSignup >= 14;
        case 'all':
        default:
          return true;
      }
    });

    // Sorting
    return [...filtered].sort((a, b) => {
      const completionA = (4 - a.missing.length) / 4;
      const completionB = (4 - b.missing.length) / 4;

      switch (sort) {
        case 'completion_asc':
          return completionA - completionB || b.daysSinceSignup - a.daysSinceSignup;
        case 'completion_desc':
          return completionB - completionA || a.daysSinceSignup - b.daysSinceSignup;
        case 'days_desc':
          return b.daysSinceSignup - a.daysSinceSignup;
        case 'days_asc':
          return a.daysSinceSignup - b.daysSinceSignup;
        case 'slots_desc':
          return b.openSlots7d + b.booked7d - (a.openSlots7d + a.booked7d);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [data.data?.rows, search, tab, step, sort]);

  // Extended stats
  const metrics = useMemo(() => {
    const all = data.data?.rows ?? [];
    const staleWaiting = all.filter((r) => !r.listed && r.daysSinceSignup >= 14).length;
    const almostReady = all.filter((r) => !r.listed && r.missing.length === 1).length;
    const zeroHours = all.filter((r) => r.listed && r.openSlots7d === 0).length;

    return {
      staleWaiting,
      almostReady,
      zeroHours,
    };
  }, [data.data?.rows]);

  async function send(row: ReadinessRow) {
    const custom = row.missing.length === 0 ? window.prompt(`Message to ${row.name}:`) : null;
    if (row.missing.length === 0 && !custom) return;
    if (
      row.missing.length > 0 &&
      !window.confirm(
        `Send ${row.name} a reminder to add: ${row.missing
          .map((m) => STEP_LABELS[m].toLowerCase())
          .join(', ')}?`,
      )
    ) {
      return;
    }

    const result = await nudge.mutate(
      row.kind === 'shop'
        ? { tenantId: row.id, message: custom ?? undefined }
        : { barberId: row.id, message: custom ?? undefined },
    );

    if (result) {
      setSent((s) => ({
        ...s,
        [row.id]:
          result.pushDevices > 0
            ? `Sent (in-app + push to ${result.pushDevices} device${result.pushDevices === 1 ? '' : 's'})`
            : 'Sent in-app (no push device registered)',
      }));
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Insights & Onboarding"
        title="Studio & Stylist Readiness"
        lede="Customers only discover a studio or barber once they fulfill 4 key criteria: active service menu, bookable working hours, accurate map coordinates, and photos. Monitor onboarding hurdles and nudge partners to go live."
        actions={
          <Button onClick={data.refresh} disabled={data.loading}>
            <RotateCw className="h-4 w-4" /> Refresh Data
          </Button>
        }
      />

      <Canvas>
        {/* Executive 6-Stat KPI Strip */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 font-manrope">
          <Stat
            label="Total Network"
            value={s ? `${s.total}` : '—'}
            sub="Tracked studios & stylists"
            pending={data.loading}
          />
          <Stat
            label="Live & Visible"
            value={s ? `${s.listed}` : '—'}
            sub={s && s.total ? `${Math.round((s.listed / s.total) * 100)}% discoverable` : undefined}
            pending={data.loading}
            tone="live"
          />
          <Stat
            label="Hidden / Incomplete"
            value={count(s?.hidden)}
            sub={metrics.almostReady > 0 ? `${metrics.almostReady} need 1 step` : 'Action required'}
            pending={data.loading}
            tone={s && s.hidden > 0 ? 'signal' : 'plain'}
          />
          <Stat
            label="7-Day Bookable Slots"
            value={count(s?.openSlots7d)}
            sub={`${count(s?.booked7d)} booked`}
            pending={data.loading}
          />
          <Stat
            label="7-Day Fill Rate"
            value={percent(s?.fillRate7d)}
            sub={s && s.noHoursAhead > 0 ? `${s.noHoursAhead} visible with 0 hours` : 'Optimal utilization'}
            pending={data.loading}
            tone={s && s.noHoursAhead > 0 ? 'signal' : 'plain'}
          />
          <Stat
            label="Stale Onboardings"
            value={count(metrics.staleWaiting)}
            sub="Waiting > 14 days"
            pending={data.loading}
            tone={metrics.staleWaiting > 0 ? 'signal' : 'plain'}
          />
        </div>

        {/* Embedded Recharts Analytics Suite */}
        {data.data && (
          <ReadinessAnalytics
            readiness={data.data}
            onSelectStep={(stepKey) => setStep(stepKey)}
            onSelectEntity={(id, kind) => {
              setSearch(id);
            }}
          />
        )}

        {/* Error notification */}
        {nudge.error && <Failed message={nudge.error} />}

        {/* Filter Toolbar & Search Bar */}
        <div className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm font-manrope">
          {/* Top Row: Focus Segment Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'hidden', label: 'Hidden / Incomplete', count: s?.hidden },
                { id: 'almost_ready', label: '1 Step Away', count: metrics.almostReady },
                { id: 'visible', label: 'Visible to Clients', count: s?.listed },
                { id: 'all', label: 'All Venues', count: s?.total },
                { id: 'shops', label: 'Salons & Studios' },
                { id: 'barbers', label: 'Independent Stylists' },
                { id: 'no_hours', label: 'Zero Hours Ahead', count: metrics.zeroHours },
                { id: 'stale', label: 'Waiting > 14 Days', count: metrics.staleWaiting },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id as FocusTab)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
                    tab === t.id
                      ? 'bg-[#635BFF] text-white shadow-sm'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
                  }`}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        tab === t.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#1E293B] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-[#1E293B] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                Table
              </button>
            </div>
          </div>

          {/* Bottom Row: Search, Missing Requirement Pills & Sort */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search by studio name, owner, phone, email, address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[13px] text-[#1E293B] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#94A3B8] hover:text-[#1E293B]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Missing Step Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#64748B] mr-1">Missing:</span>
              <button
                type="button"
                onClick={() => setStep('any')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  step === 'any'
                    ? 'bg-[#1E293B] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                }`}
              >
                Any Step
              </button>
              {(Object.keys(STEP_LABELS) as ListingStep[]).map((k) => {
                const Icon = STEP_ICONS[k];
                const countMissing = s?.missing[k] ?? 0;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setStep(k)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      step === k
                        ? 'bg-[#EF4444] text-white'
                        : 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    No {STEP_LABELS[k]}
                    <span className="opacity-80">· {countMissing}</span>
                  </button>
                );
              })}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-[#64748B]">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-[12px] font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
              >
                <option value="completion_asc">Urgent (Lowest % First)</option>
                <option value="completion_desc">Ready (Highest % First)</option>
                <option value="days_desc">Longest Waiting (Oldest Signup)</option>
                <option value="days_asc">Newest Signup</option>
                <option value="slots_desc">Most Open Slots Ahead</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Section: Grid View or Dense Table */}
        {data.loading ? (
          <Loading label="Analyzing studio & barber readiness across Bangladesh..." />
        ) : data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : rows.length === 0 ? (
          <Empty
            title="No studios or stylists found"
            hint="Try clearing your search query or switching to another filter tab."
          />
        ) : viewMode === 'grid' ? (
          /* Modern Interactive Card Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-manrope">
            {rows.map((r) => {
              const completedCount = 4 - r.missing.length;
              const percentComplete = Math.round((completedCount / 4) * 100);

              let progressColor = 'bg-[#10B981]';
              let progressTone = 'text-[#10B981]';
              if (percentComplete === 75) {
                progressColor = 'bg-[#635BFF]';
                progressTone = 'text-[#635BFF]';
              } else if (percentComplete >= 50) {
                progressColor = 'bg-[#F59E0B]';
                progressTone = 'text-[#F59E0B]';
              } else {
                progressColor = 'bg-[#EF4444]';
                progressTone = 'text-[#EF4444]';
              }

              const profileHref = r.kind === 'shop' ? `/shops/${r.id}` : `/barbers/${r.id}`;

              return (
                <div
                  key={`${r.kind}:${r.id}`}
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header: Icon, Name, Type, Listed Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 ${
                            r.kind === 'shop'
                              ? 'bg-indigo-50 text-[#635BFF]'
                              : 'bg-sky-50 text-[#0284C7]'
                          }`}
                        >
                          {r.kind === 'shop' ? (
                            <Store className="h-5 w-5" />
                          ) : (
                            <Scissors className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={profileHref}
                            className="font-bold text-[14px] text-[#1E293B] hover:text-[#635BFF] transition-colors truncate block"
                          >
                            {r.name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-semibold text-[#64748B]">
                              {r.kind === 'shop' ? 'Salon / Studio' : 'Independent Stylist'}
                            </span>
                            <span className="text-[10px] text-[#94A3B8]">·</span>
                            <span className="text-[10px] text-[#94A3B8]">
                              Joined {r.daysSinceSignup}d ago
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Go-Live Status Badge */}
                      <div className="shrink-0">
                        {r.listed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Live
                          </span>
                        ) : r.hidden ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <ShieldAlert className="h-3 w-3" /> {r.hidden}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="h-3 w-3" /> Hidden
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Completion Progress Bar */}
                    <div className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="font-bold text-[#475569]">Onboarding Completion</span>
                        <span className={`font-extrabold ${progressTone}`}>
                          {percentComplete}% ({completedCount}/4 Steps)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                          style={{ width: `${percentComplete}%` }}
                        />
                      </div>

                      {/* Step Chips */}
                      <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                        {(Object.keys(STEP_LABELS) as ListingStep[]).map((k) => {
                          const isDone = r.steps[k];
                          const Icon = STEP_ICONS[k];
                          return (
                            <div
                              key={k}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border ${
                                isDone
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : 'bg-rose-50 border-rose-200 text-rose-700'
                              }`}
                            >
                              {isDone ? (
                                <Check className="h-3 w-3 shrink-0" />
                              ) : (
                                <X className="h-3 w-3 shrink-0" />
                              )}
                              <Icon className="h-3 w-3 shrink-0 opacity-70" />
                              <span className="truncate">{STEP_LABELS[k]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Operational Capacity Mini-Grid */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#F1F5F9] text-center my-3 text-[11px]">
                      <div>
                        <p className="text-[10px] text-[#94A3B8] font-medium">Open Slots (7d)</p>
                        <p className="font-extrabold text-[#1E293B] tabular-nums mt-0.5">
                          {r.openSlots7d}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#94A3B8] font-medium">Booked (7d)</p>
                        <p className="font-extrabold text-[#10B981] tabular-nums mt-0.5">
                          {r.booked7d}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#94A3B8] font-medium">Last Booking</p>
                        <p className="font-bold text-[#64748B] truncate mt-0.5">
                          {r.lastBookingAt ? since(r.lastBookingAt) : 'Never'}
                        </p>
                      </div>
                    </div>

                    {/* Contact & Location Info */}
                    <div className="space-y-1 text-[11px] text-[#64748B] mb-4">
                      {r.contactName && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3 w-3 text-[#94A3B8] shrink-0" />
                          <span className="font-bold text-[#1E293B] truncate">{r.contactName}</span>
                        </div>
                      )}
                      {(r.contactPhone || r.contactEmail) && (
                        <div className="flex items-center gap-1.5 truncate">
                          {r.contactPhone ? (
                            <Phone className="h-3 w-3 text-[#94A3B8] shrink-0" />
                          ) : (
                            <Mail className="h-3 w-3 text-[#94A3B8] shrink-0" />
                          )}
                          <span className="truncate">{r.contactPhone || r.contactEmail}</span>
                        </div>
                      )}
                      {r.address && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3 w-3 text-[#94A3B8] shrink-0" />
                          <span className="truncate">{r.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                    <Link
                      href={profileHref}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#64748B] hover:text-[#635BFF] transition-colors"
                    >
                      View Profile <ExternalLink className="h-3 w-3" />
                    </Link>

                    {sent[r.id] ? (
                      <span className="text-[11px] font-extrabold text-emerald-600 truncate max-w-[170px]" title={sent[r.id]}>
                        ✓ {sent[r.id]}
                      </span>
                    ) : r.contactUserId ? (
                      <button
                        type="button"
                        onClick={() => void send(r)}
                        disabled={nudge.pending}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-xs ${
                          r.missing.length > 0
                            ? 'bg-[#635BFF] text-white hover:bg-[#5248E5]'
                            : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        <BellRing className="h-3.5 w-3.5" />
                        {r.missing.length > 0 ? 'Nudge Missing' : 'Message'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#94A3B8]">No user account</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Dense Data Table View */
          <Panel
            title="Readiness Registry"
            note={`Showing ${rows.length} of ${data.data?.rows.length ?? 0} studios and independent barbers`}
            flush
          >
            <Scroll>
              <Table>
                <thead>
                  <tr>
                    <Th>Venue & Stylist</Th>
                    <Th>Progress & Checklist</Th>
                    <Th>Contact Details</Th>
                    <Th align="right">Signup Date</Th>
                    <Th align="right">Next 7 Days</Th>
                    <Th align="right">Last Booking</Th>
                    <Th align="right">Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const completedCount = 4 - r.missing.length;
                    const percentComplete = Math.round((completedCount / 4) * 100);
                    const profileHref = r.kind === 'shop' ? `/shops/${r.id}` : `/barbers/${r.id}`;

                    return (
                      <Tr key={`${r.kind}:${r.id}`}>
                        <Td>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Link
                              href={profileHref}
                              className="font-bold text-[#1E293B] hover:text-[#635BFF] transition-colors"
                            >
                              {r.name}
                            </Link>
                            <Badge tone="quiet">
                              {r.kind === 'shop' ? 'Shop' : 'Independent'}
                            </Badge>
                            {r.listed ? (
                              <Badge tone="live">Visible</Badge>
                            ) : r.hidden ? (
                              <Badge tone="signal">{r.hidden}</Badge>
                            ) : (
                              <Badge tone="warning">Hidden</Badge>
                            )}
                          </div>
                          {r.address && (
                            <p className="mt-0.5 text-[11px] text-[#94A3B8] truncate max-w-[260px]">
                              {r.address}
                            </p>
                          )}
                        </Td>
                        <Td className="min-w-[290px]">
                          <div className="mb-1.5 flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  percentComplete === 100
                                    ? 'bg-emerald-500'
                                    : percentComplete === 75
                                    ? 'bg-indigo-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${percentComplete}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-extrabold text-[#64748B]">
                              {percentComplete}%
                            </span>
                          </div>
                          <StepChecks steps={r.steps} />
                        </Td>
                        <Td>
                          <p className="text-[13px] font-semibold text-[#1E293B]">
                            {r.contactName ?? '—'}
                          </p>
                          <p className="text-[11px] text-[#94A3B8]">
                            {r.contactPhone ?? r.contactEmail ?? ''}
                          </p>
                        </Td>
                        <Td align="right" nowrap>
                          <span className="font-semibold text-[#334155]">
                            {r.daysSinceSignup}d ago
                          </span>
                        </Td>
                        <Td align="right" nowrap>
                          <span className="font-bold text-[#635BFF]">{r.openSlots7d} open</span>
                          <span className="text-[#94A3B8] mx-1">·</span>
                          <span className="font-bold text-[#10B981]">{r.booked7d} booked</span>
                        </Td>
                        <Td align="right" nowrap muted>
                          {r.lastBookingAt ? since(r.lastBookingAt) : 'Never'}
                        </Td>
                        <Td align="right" nowrap>
                          {sent[r.id] ? (
                            <span className="text-[11px] font-extrabold text-[#16A34A]">
                              ✓ {sent[r.id]}
                            </span>
                          ) : r.contactUserId ? (
                            <Button
                              variant={r.missing.length ? 'primary' : 'outline'}
                              onClick={() => void send(r)}
                              disabled={nudge.pending}
                            >
                              <BellRing className="h-3.5 w-3.5" />
                              {r.missing.length ? 'Nudge' : 'Message'}
                            </Button>
                          ) : null}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </Scroll>
          </Panel>
        )}
      </Canvas>
    </>
  );
}
