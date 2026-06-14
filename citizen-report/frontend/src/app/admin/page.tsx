'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n, categoryLabel } from '@/lib/i18n';
import { StatusBadge } from '@/components/StatusBadge';
import type { Category, Paginated, Report, ReportStatus } from '@/lib/types';

const STATUSES: ReportStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'INFO_REQUESTED',
  'APPROVED',
  'REJECTED',
  'CLOSED',
];

interface FullReport extends Report {
  aiAnalyses?: { id: string; type: string; result: unknown; confidence?: number | null }[];
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const router = useRouter();

  const [stats, setStats] = useState<{ total: number; byStatus: Record<string, number> } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [list, setList] = useState<Paginated<Report> | null>(null);
  const [filters, setFilters] = useState<{ status?: string; categorySlug?: string; q?: string }>({});
  const [selected, setSelected] = useState<FullReport | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Guard: staff only.
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') router.replace('/dashboard');
  }, [loading, user, router]);

  const loadList = useCallback(async () => {
    const qs = new URLSearchParams();
    if (filters.status) qs.set('status', filters.status);
    if (filters.categorySlug) qs.set('categorySlug', filters.categorySlug);
    if (filters.q) qs.set('q', filters.q);
    try {
      const [reports, s] = await Promise.all([
        apiFetch<Paginated<Report>>(`/admin/reports?${qs.toString()}`),
        apiFetch<{ total: number; byStatus: Record<string, number> }>('/admin/stats'),
      ]);
      setList(reports);
      setStats(s);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load');
    }
  }, [filters]);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'MODERATOR')) {
      apiFetch<{ categories: Category[] }>('/reports/categories').then((d) => setCategories(d.categories));
      loadList();
    }
  }, [user, loadList]);

  async function openReport(id: string) {
    setNote('');
    const { report } = await apiFetch<{ report: FullReport }>(`/admin/reports/${id}`);
    setSelected(report);
  }

  async function changeStatus(status: ReportStatus) {
    if (!selected) return;
    try {
      const { report } = await apiFetch<{ report: Report }>(`/admin/reports/${selected.id}/status`, {
        method: 'PATCH',
        body: { status, note: note || undefined },
      });
      setSelected({ ...selected, status: report.status });
      await loadList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Status update failed');
    }
  }

  async function deleteReport() {
    if (!selected) return;
    if (!window.confirm('Permanently delete this report and its media? This cannot be undone.')) return;
    try {
      await apiFetch(`/admin/reports/${selected.id}`, { method: 'DELETE' });
      setSelected(null);
      await loadList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  if (loading || !user) return <p className="text-center text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <span className="badge bg-brand-100 text-brand-700">{user.role}</span>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <div className="card py-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-slate-500">Total</div>
          </div>
          {STATUSES.map((s) => (
            <div key={s} className="card py-3 text-center">
              <div className="text-2xl font-bold">{stats.byStatus[s] ?? 0}</div>
              <div className="text-xs text-slate-500">{s.replace('_', ' ').toLowerCase()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={filters.status ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
          >
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={filters.categorySlug ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, categorySlug: e.target.value || undefined }))}
          >
            <option value="">All</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{categoryLabel(c, lang)}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="label">Search description</label>
          <input
            className="input"
            value={filters.q ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value || undefined }))}
          />
        </div>
        <button className="btn-primary" onClick={loadList}>Apply</button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* List */}
        <div className="space-y-3">
          {list?.items.map((r) => (
            <button
              key={r.id}
              onClick={() => openReport(r.id)}
              className={`card w-full text-left transition hover:shadow-md ${selected?.id === r.id ? 'ring-2 ring-brand-500' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{categoryLabel(r.category, lang)}</span>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.description}</p>
              <p className="mt-2 text-xs text-slate-400">
                {new Date(r.createdAt).toLocaleString()}
                {r.reporter ? ` · ${r.reporter.email}` : ' · anonymous'}
              </p>
            </button>
          ))}
          {list && list.items.length === 0 && (
            <p className="text-center text-slate-500">No reports match these filters.</p>
          )}
        </div>

        {/* Detail / review */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          {selected ? (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">{categoryLabel(selected.category, lang)}</h2>
                <StatusBadge status={selected.status} />
              </div>
              <p className="text-sm text-slate-700">{selected.description}</p>

              {selected.summary && (
                <p className="rounded bg-slate-50 p-2 text-xs text-slate-600">{selected.summary}</p>
              )}

              {(selected.latitude != null || selected.address) && (
                <p className="text-xs text-slate-500">
                  📍 {selected.address} {selected.latitude != null && `(${selected.latitude.toFixed(5)}, ${selected.longitude?.toFixed(5)})`}
                </p>
              )}

              {/* Evidence (originals for staff) */}
              {selected.media && selected.media.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selected.media.map((m) =>
                    m.kind === 'VIDEO' ? (
                      <video key={m.id} src={m.url} controls className="w-full rounded" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={m.id} src={m.url} alt="evidence" className="h-24 w-full rounded object-cover" />
                    ),
                  )}
                </div>
              )}

              {/* AI assistance (advisory) */}
              {selected.aiAnalyses && selected.aiAnalyses.length > 0 && (
                <div className="rounded border border-slate-200 p-3 text-xs">
                  <p className="mb-1 font-semibold text-slate-600">AI assistance (advisory only)</p>
                  <ul className="space-y-1 text-slate-600">
                    {selected.aiAnalyses.map((a) => (
                      <li key={a.id}>
                        <span className="font-medium">{a.type}:</span>{' '}
                        <code className="text-[11px]">{JSON.stringify(a.result)}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reviewer actions */}
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <label className="label">Reviewer note (shown to the reporter — e.g. a reason for approval/rejection or an info request)</label>
                <textarea className="input min-h-16" value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={() => changeStatus('UNDER_REVIEW')}>Mark reviewing</button>
                  <button className="btn-secondary" onClick={() => changeStatus('INFO_REQUESTED')}>Request info</button>
                  <button className="btn-primary bg-green-600 hover:bg-green-700" onClick={() => changeStatus('APPROVED')}>Approve</button>
                  <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={() => changeStatus('REJECTED')}>Reject</button>
                  <button className="btn-secondary" onClick={() => changeStatus('CLOSED')}>Close</button>
                </div>
                {user.role === 'ADMIN' && (
                  <div className="border-t border-slate-200 pt-3">
                    <button className="btn-primary bg-red-700 hover:bg-red-800" onClick={deleteReport}>
                      Delete permanently
                    </button>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Removes the report, its media, and AI analyses for good. The deletion is recorded in the audit log.
                    </p>
                  </div>
                )}
                <p className="text-[11px] text-slate-400">
                  Approval forwards this report for a human enforcement decision. It does not issue any penalty.
                </p>
              </div>
            </div>
          ) : (
            <div className="card text-center text-slate-500">Select a report to review its evidence.</div>
          )}
        </div>
      </div>
    </div>
  );
}
