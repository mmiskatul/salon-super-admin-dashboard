'use client';

import { useState } from 'react';
import { LineChart, Plus } from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { listTenants } from '@/lib/api/tenants';
import { metricSeries, recordMetric, type MetricSnapshot } from '@/lib/api/metrics';
import { brandColor, count, dateTime, toNumber } from '@/lib/format';
import {
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
import { Line } from '@/components/chart/Chart';

/**
 * Metric snapshots.
 *
 * service-report is a single table — tenantId, metric name, value, timestamp — with no registry of
 * which metric names exist and no endpoint that lists them. So this screen cannot offer a dropdown
 * of metrics without inventing one: it asks for the shop and the metric name, and plots what comes
 * back. That is the shape of the backend rather than a gap in the screen.
 */
export default function MetricsPage() {
  const tenants = useApi(() => listTenants(), []);
  const [tenantId, setTenantId] = useState('');
  const [metric, setMetric] = useState('');
  const [queried, setQueried] = useState<{ tenantId: string; metric: string } | null>(null);
  const [recording, setRecording] = useState(false);

  const series = useApi(
    () =>
      queried
        ? metricSeries(queried.tenantId, queried.metric)
        : Promise.resolve([] as MetricSnapshot[]),
    [queried?.tenantId, queried?.metric],
  );

  const tenant = tenants.data?.find((t) => t.id === (queried?.tenantId ?? tenantId));
  const colour = brandColor(tenant?.brandColor);

  const rows = [...(series.data ?? [])].sort(
    (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
  );
  const values = rows.map((r) => toNumber(r.value));
  const latest = values.length > 0 ? values[values.length - 1] : null;
  const first = values.length > 0 ? values[0] : null;
  const peak = values.length > 0 ? Math.max(...values) : null;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!tenantId || !metric.trim()) return;
    setQueried({ tenantId, metric: metric.trim() });
  }

  return (
    <>
      <PageHead
        eyebrow="Activity"
        title="Metrics"
        lede="Snapshots recorded against a shop. Pick a shop and type the metric name you want to see — the backend keeps no list of names, so there is nothing to choose from until you know one."
        actions={
          <Button variant="primary" onClick={() => setRecording(true)}>
            <Plus size={12} />
            Record a snapshot
          </Button>
        }
      />

      <Canvas>
        {tenants.loading && <Loading label="Loading shops" />}
        {tenants.error && <Failed message={tenants.error} onRetry={tenants.refresh} />}

        {tenants.data && (
          <>
            <Panel title="Look up a series">
              <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-1">
                  <Field label="Shop">
                    <Select value={tenantId} onChange={(e) => setTenantId(e.target.value)} required>
                      <option value="">Choose a shop</option>
                      {tenants.data.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="min-w-[200px] flex-1">
                  <Field label="Metric name" hint="Exactly as it was recorded, e.g. daily_revenue">
                    <TextInput
                      value={metric}
                      onChange={(e) => setMetric(e.target.value)}
                      placeholder="daily_revenue"
                      className="tabular"
                      required
                    />
                  </Field>
                </div>
                <Button type="submit" variant="primary" disabled={!tenantId || !metric.trim()}>
                  <LineChart size={12} />
                  Plot series
                </Button>
              </form>
            </Panel>

            {!queried && (
              <Panel>
                <Empty
                  title="Nothing plotted yet"
                  hint="Choose a shop and a metric name above. If nothing comes back, no snapshot has ever been recorded under that name for that shop."
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
                  title={`No snapshots named “${queried.metric}”`}
                  hint="Nothing has been recorded under that name for this shop. Check the spelling, or record the first snapshot yourself."
                  action={
                    <Button variant="primary" onClick={() => setRecording(true)}>
                      <Plus size={12} />
                      Record a snapshot
                    </Button>
                  }
                />
              </Panel>
            )}

            {queried && rows.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat label="Snapshots" value={count(rows.length)} />
                  <Stat label="Latest" value={latest?.toLocaleString() ?? '—'} />
                  <Stat label="Peak" value={peak?.toLocaleString() ?? '—'} />
                  <Stat
                    label="Change since first"
                    value={
                      first != null && latest != null
                        ? `${latest - first >= 0 ? '+' : ''}${(latest - first).toLocaleString()}`
                        : '—'
                    }
                    tone={first != null && latest != null && latest < first ? 'signal' : 'live'}
                  />
                </div>

                <Panel
                  title={queried.metric}
                  note={`${tenant?.name ?? queried.tenantId} · oldest to newest, evenly spaced`}
                >
                  <Line
                    color={colour}
                    height={120}
                    points={rows.map((r) => ({
                      value: toNumber(r.value),
                      label: dateTime(r.capturedAt),
                    }))}
                  />
                </Panel>

                <Panel flush title="Snapshots">
                  <Scroll>
                    <Table>
                      <thead>
                        <tr>
                          <Th>Captured</Th>
                          <Th>Metric</Th>
                          <Th align="right">Value</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...rows].reverse().map((row) => (
                          <Tr key={row.id} accent={colour}>
                            <Td mono>{dateTime(row.capturedAt)}</Td>
                            <Td muted mono>{row.metric}</Td>
                            <Td align="right" mono>{toNumber(row.value).toLocaleString()}</Td>
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

      {recording && tenants.data && (
        <RecordDialog
          tenants={tenants.data.map((t) => ({ id: t.id, name: t.name }))}
          defaults={{ tenantId, metric }}
          onClose={() => setRecording(false)}
          onRecorded={(snapshot) => {
            setRecording(false);
            setTenantId(snapshot.tenantId);
            setMetric(snapshot.metric);
            setQueried({ tenantId: snapshot.tenantId, metric: snapshot.metric });
          }}
        />
      )}
    </>
  );
}

function RecordDialog({
  tenants,
  defaults,
  onClose,
  onRecorded,
}: {
  tenants: { id: string; name: string }[];
  defaults: { tenantId: string; metric: string };
  onClose: () => void;
  onRecorded: (snapshot: MetricSnapshot) => void;
}) {
  const [tenantId, setTenantId] = useState(defaults.tenantId);
  const [metric, setMetric] = useState(defaults.metric);
  const [value, setValue] = useState('');
  const { mutate, pending, error } = useMutation(recordMetric);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const snapshot = await mutate({
      tenantId,
      metric: metric.trim(),
      value: Number(value),
    });
    if (snapshot) onRecorded(snapshot);
  }

  return (
    <Modal
      title="Record a snapshot"
      note="Writes one point to the shop's series. The metric name is free text — reuse an existing name exactly, or you will start a new series."
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />

        <Field label="Shop">
          <Select value={tenantId} onChange={(e) => setTenantId(e.target.value)} required>
            <option value="">Choose a shop</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Metric name">
          <TextInput
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            placeholder="daily_revenue"
            className="tabular"
            required
          />
        </Field>

        <Field label="Value">
          <TextInput
            type="number"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="tabular"
            required
          />
        </Field>

        <div className="flex justify-end gap-2 border-t border-rule-soft pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="primary"
            disabled={pending || !tenantId || !metric.trim() || value === ''}
          >
            {pending ? 'Recording' : 'Record snapshot'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
