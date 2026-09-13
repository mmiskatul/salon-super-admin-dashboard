import { apiFetch } from '../api-client';

/** Mirrors service-report `model MetricSnapshot`. */
export interface MetricSnapshot {
  id: string;
  tenantId: string;
  metric: string;
  value: string | number;
  capturedAt: string;
}

/**
 * Metric snapshots for one shop and one metric name.
 *
 * service-report keeps no registry of metric names — `metric` is a free-text column written by
 * whoever recorded the snapshot, so there is no endpoint that lists which names exist. The signals
 * screen therefore asks the operator for the name rather than offering a dropdown it would have
 * to invent.
 */
export function metricSeries(tenantId: string, metric: string): Promise<MetricSnapshot[]> {
  const params = new URLSearchParams({ tenantId, metric });
  return apiFetch<MetricSnapshot[]>(`/metrics/series?${params.toString()}`);
}

export function metricLatest(tenantId: string, metric: string): Promise<MetricSnapshot | null> {
  const params = new URLSearchParams({ tenantId, metric });
  return apiFetch<MetricSnapshot | null>(`/metrics/latest?${params.toString()}`);
}

export function recordMetric(input: {
  tenantId: string;
  metric: string;
  value: number;
}): Promise<MetricSnapshot> {
  return apiFetch<MetricSnapshot>('/metrics', { method: 'POST', body: JSON.stringify(input) });
}
