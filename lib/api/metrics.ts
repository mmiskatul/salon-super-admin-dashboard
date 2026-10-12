import { apiFetch } from '../api-client';

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  unit: string;
  category: string;
}

export interface MetricSnapshot {
  id: string;
  tenantId: string;
  metric: string;
  value: string | number;
  capturedAt: string;
}

export function listMetricNames(tenantId?: string): Promise<MetricDefinition[]> {
  const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
  return apiFetch<MetricDefinition[]>(`/metrics/names${query}`);
}

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
  capturedAt?: string;
}): Promise<MetricSnapshot> {
  return apiFetch<MetricSnapshot>('/metrics', { method: 'POST', body: JSON.stringify(input) });
}

export function generateMetrics(tenantId?: string): Promise<{ message: string; count: number }> {
  const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
  return apiFetch<{ message: string; count: number }>(`/metrics/generate${query}`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function getMetricSummary(tenantId?: string): Promise<Record<string, unknown>> {
  const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
  return apiFetch<Record<string, unknown>>(`/metrics/summary${query}`);
}

export function listMetricSnapshots(params?: {
  tenantId?: string;
  metric?: string;
  limit?: number;
}): Promise<MetricSnapshot[]> {
  const query = new URLSearchParams();
  if (params?.tenantId) query.set('tenantId', params.tenantId);
  if (params?.metric) query.set('metric', params.metric);
  if (params?.limit) query.set('limit', String(params.limit));
  const qStr = query.toString();
  return apiFetch<MetricSnapshot[]>(`/metrics${qStr ? `?${qStr}` : ''}`);
}

export function deleteMetricSnapshot(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/metrics/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
