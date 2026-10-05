'use client';

import { useState } from 'react';
import { LineChart, Plus, Sparkles } from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { listTenants } from '@/lib/api/tenants';
import {
  generateMetrics,
  listMetricNames,
  metricSeries,
  recordMetric,
  type MetricSnapshot,
} from '@/lib/api/metrics';
import { brandColor, count, dateTime, toNumber } from '@/lib/format';
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
import { Field, FormError, Modal, Select, TextInput } from '@/components/ui/Form';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Line } from '@/components/chart/Chart';

export default function MetricsPage() {
  const tenants = useApi(() => listTenants(), []);
  const [tenantId, setTenantId] = useState('');
  const [metric, setMetric] = useState('daily_revenue');
  const [customMetric, setCustomMetric] = useState('');
  const [queried, setQueried] = useState<{ tenantId: string; metric: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const series = useApi(
    async () => {
      if (!queried) return [];
      return metricSeries(queried.tenantId, queried.metric);
    },
    [queried],
  );

  const metricNamesApi = useApi(() => listMetricNames(tenantId || undefined), [tenantId]);

  const tenant = tenants.data?.find((t) => t.id === (queried?.tenantId ?? tenantId));
  const colour = brandColor(tenant?.brandColor);

  const rows = [...(series.data ?? [])].sort(
    (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
  );
  const values = rows.map((r) => toNumber(r.value));
  const latest = values.length > 0 ? values[values.length - 1] : null;
  const first = values.length > 0 ? values[0] : null;
  const peak = values.length > 0 ? Math.max(...values) : null;

  const effectiveMetric = metric === '__custom__' ? customMetric.trim() : metric;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!tenantId || !effectiveMetric) return;
    setQueried({ tenantId, metric: effectiveMetric });
  }

  async function handleAutoGenerate() {
    try {
      setGenerating(true);
      setGenerateError(null);
      const res = await generateMetrics(tenantId || undefined);
      setConfirmGenerate(false);
      setSuccessBanner(res.message || 'Metrics generated successfully!');
      setTimeout(() => setSuccessBanner(null), 5000);
      if (queried) {
        await series.refresh();
      } else if (tenantId) {
        setQueried({ tenantId, metric: effectiveMetric || 'daily_revenue' });
      }
      await metricNamesApi.refresh();
    } catch (err) {
      setGenerateError(err instanceof Error && err.message ? err.message : 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Activity"
        title="Metrics & Signals"
        lede="Explore real-time business telemetry and snapshot curves across salon storefronts. Select a shop and metric name to plot historical performance."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => setConfirmGenerate(true)} disabled={generating} variant="secondary">
              <Sparkles size={12} className={generating ? 'animate-spin' : 'text-[#635BFF]'} />
              {generating ? 'Computing…' : 'Generate live metrics'}
            </Button>
            <Button variant="primary" onClick={() => setRecording(true)}>
              <Plus size={12} />
              Record snapshot
            </Button>
          </div>
        }
      />

      {successBanner && (
        <div className="mx-5 sm:mx-8 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-800 flex items-center justify-between">
          <span>{successBanner}</span>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      <Canvas>
        {tenants.loading && <Loading label="Loading shops" />}
        {tenants.error && <Failed message={tenants.error} onRetry={tenants.refresh} />}

        {tenants.data && (
          <>
            <Panel title="Look up a series">
              <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-1">
                  <Field label="Shop / Salon">
                    <Select
                      value={tenantId}
                      onChange={(e) => {
                        setTenantId(e.target.value);
                        if (queried) setQueried(null);
                      }}
                      required
                    >
                      <option value="">Choose a salon storefront</option>
                      {tenants.data.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="min-w-[240px] flex-1">
                  <Field label="Metric series" hint="Select a standard metric or enter custom name">
                    <Select
                      value={metric}
                      onChange={(e) => setMetric(e.target.value)}
                      required
                    >
                      {(metricNamesApi.data && metricNamesApi.data.length > 0
                        ? metricNamesApi.data
                        : [
                            { id: 'daily_revenue', name: 'Daily Gross Revenue (BDT)' },
                            { id: 'monthly_revenue', name: 'Monthly Revenue Run-Rate (BDT)' },
                            { id: 'completed_appointments', name: 'Completed Appointments' },
                            { id: 'active_customers', name: 'Active Unique Clients' },
                          ]
                      ).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.id})
                        </option>
                      ))}
                      <option value="__custom__">+ Enter custom metric name…</option>
                    </Select>
                  </Field>
                </div>

                {metric === '__custom__' && (
                  <div className="min-w-[180px] flex-1">
                    <Field label="Custom metric name">
                      <TextInput
                        value={customMetric}
                        onChange={(e) => setCustomMetric(e.target.value)}
                        placeholder="e.g. churn_rate"
                        required
                      />
                    </Field>
                  </div>
                )}

                <Button type="submit" variant="primary" disabled={!tenantId || !effectiveMetric}>
                  <LineChart size={12} />
                  Plot series
                </Button>
              </form>
            </Panel>

            {!queried && (
              <Panel>
                <Empty
                  title="No metric selected"
                  hint="Choose a shop and a metric name above, then click 'Plot series' to visualize telemetry."
                  action={
                    <Button onClick={handleAutoGenerate} disabled={generating} variant="secondary">
                      <Sparkles size={12} />
                      Compute live metrics now
                    </Button>
                  }
                />
              </Panel>
            )}

            {queried && series.loading && (
              <Panel>
                <Loading label="Loading snapshots" />
              </Panel>
            )}

            {queried && series.error && (
              <Panel>
                <Failed message={series.error} onRetry={series.refresh} />
              </Panel>
            )}

            {queried && !series.loading && !series.error && rows.length === 0 && (
              <Panel>
                <Empty
                  title={`No snapshots recorded for “${queried.metric}”`}
                  hint="No snapshots found under this metric for the selected shop. Click below to compute live metrics from real store activity."
                  action={
                    <div className="flex gap-2">
                      <Button onClick={handleAutoGenerate} disabled={generating} variant="secondary">
                        <Sparkles size={12} />
                        Compute live metrics now
                      </Button>
                      <Button variant="primary" onClick={() => setRecording(true)}>
                        <Plus size={12} />
                        Record manually
                      </Button>
                    </div>
                  }
                />
              </Panel>
            )}

            {queried && !series.loading && !series.error && rows.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat label="Total snapshots" value={count(rows.length)} />
                  <Stat
                    label="Latest snapshot"
                    value={latest !== null ? latest.toLocaleString() : '—'}
                    tone="live"
                    sub={rows[rows.length - 1] ? dateTime(rows[rows.length - 1].capturedAt) : undefined}
                  />
                  <Stat
                    label="Earliest snapshot"
                    value={first !== null ? first.toLocaleString() : '—'}
                    sub={rows[0] ? dateTime(rows[0].capturedAt) : undefined}
                  />
                  <Stat
                    label="Peak value"
                    value={peak !== null ? peak.toLocaleString() : '—'}
                    tone="signal"
                    sub="Highest recorded in series"
                  />
                </div>

                <Panel title={`${queried.metric} over time`} flush>
                  <div className="p-4">
                    <Line
                      points={rows.map((r) => ({
                        label: dateTime(r.capturedAt),
                        value: toNumber(r.value),
                      }))}
                      color={colour}
                      height={260}
                    />
                  </div>

                  <Scroll>
                    <Table>
                      <thead>
                        <Tr>
                          <Th align="left">Captured at</Th>
                          <Th align="left">Metric</Th>
                          <Th align="right">Value</Th>
                        </Tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <Tr key={row.id}>
                            <Td align="left">
                              <span className="text-xs text-ink-2">
                                {dateTime(row.capturedAt)}
                              </span>
                            </Td>
                            <Td align="left">
                              <Badge tone="plain">{row.metric}</Badge>
                            </Td>
                            <Td align="right" mono>
                              {toNumber(row.value).toLocaleString()}
                            </Td>
                          </Tr>
                        ))}
                      </tbody>
                    </Table>
                  </Scroll>
                </Panel>
              </>
            )}
          </>
        )}
      </Canvas>

      {recording && (
        <RecordSnapshotDialog
          tenants={tenants.data ?? []}
          initialTenantId={queried?.tenantId ?? tenantId}
          initialMetric={queried?.metric ?? (effectiveMetric || 'daily_revenue')}
          onClose={() => setRecording(false)}
          onRecorded={(snapshot) => {
            setRecording(false);
            setTenantId(snapshot.tenantId);
            setMetric(snapshot.metric);
            setQueried({ tenantId: snapshot.tenantId, metric: snapshot.metric });
            void series.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={confirmGenerate}
        title="Generate telemetry signals"
        description={
          <p>
            Compute every metric in the list (the last 7 days of takings, this month&apos;s revenue and average ticket, bookings, cancellations, active clients and subscription income) from each shop&apos;s real bookings and payments, and save today&apos;s values?
          </p>
        }
        confirmLabel="Generate Signals"
        variant="primary"
        pending={generating}
        error={generateError}
        onConfirm={handleAutoGenerate}
        onClose={() => {
          if (!generating) {
            setConfirmGenerate(false);
            setGenerateError(null);
          }
        }}
      />
    </>
  );
}

function RecordSnapshotDialog({
  tenants,
  initialTenantId,
  initialMetric,
  onClose,
  onRecorded,
}: {
  tenants: { id: string; name: string }[];
  initialTenantId: string;
  initialMetric: string;
  onClose: () => void;
  onRecorded: (snapshot: MetricSnapshot) => void;
}) {
  const [tenantId, setTenantId] = useState(initialTenantId || tenants[0]?.id || '');
  const [metricName, setMetricName] = useState(initialMetric || 'daily_revenue');
  const [value, setValue] = useState('');

  const mutation = useMutation(async () => {
    return recordMetric({
      tenantId,
      metric: metricName.trim(),
      value: parseFloat(value),
    });
  });

  return (
    <Modal title="Record a metric snapshot" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const snap = await mutation.mutate();
          if (snap) onRecorded(snap);
        }}
        className="space-y-3.5"
      >
        {mutation.error && <FormError message={mutation.error} />}

        <Field label="Shop">
          <Select value={tenantId} onChange={(e) => setTenantId(e.target.value)} required>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Metric name" hint="Standard identifier, e.g. daily_revenue or active_customers">
          <TextInput
            value={metricName}
            onChange={(e) => setMetricName(e.target.value)}
            placeholder="daily_revenue"
            required
          />
        </Field>

        <Field label="Snapshot value (number)" hint="Integer or decimal value">
          <TextInput
            type="number"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="1250.50"
            required
          />
        </Field>

        <div className="flex justify-end gap-2 border-t border-rule-soft pt-4">
          <Button onClick={onClose} disabled={mutation.pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.pending} variant="primary">
            {mutation.pending ? 'Recording…' : 'Save snapshot'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
