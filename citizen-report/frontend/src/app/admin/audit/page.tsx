'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { Paginated } from '@/lib/types';

interface AuditItem {
  id: string;
  action: string;
  actorId: string | null;
  reportId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
  actor?: { email: string; role: string } | null;
}

const PAGE_SIZE = 50;

export default function AuditPage() {
  const { lang } = useI18n();
  const tr = (ka: string, en: string) => (lang === 'ka' ? ka : en);

  const [data, setData] = useState<Paginated<AuditItem> | null>(null);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(
        await apiFetch<Paginated<AuditItem>>(`/admin/audit?page=${page}&pageSize=${PAGE_SIZE}`),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load');
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{tr('აუდიტის ჟურნალი', 'Audit log')}</h1>
      <p className="text-sm text-slate-500">
        {tr(
          'ყველა ადმინისტრაციული მოქმედების მხოლოდ-დასამატებელი ჩანაწერი.',
          'Append-only record of every administrative action.',
        )}
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">{tr('დრო', 'Time')}</th>
              <th className="px-3 py-2 font-medium">{tr('მოქმედება', 'Action')}</th>
              <th className="px-3 py-2 font-medium">{tr('მომხმარებელი', 'Actor')}</th>
              <th className="px-3 py-2 font-medium">IP</th>
              <th className="px-3 py-2 font-medium">{tr('დეტალები', 'Details')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                  {new Date(item.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <span className="badge bg-brand-50 text-brand-700">{item.action}</span>
                </td>
                <td className="px-3 py-2">
                  {item.actor ? (
                    <span title={item.actor.role}>{item.actor.email}</span>
                  ) : (
                    <span className="text-slate-400">{tr('სისტემა', 'system')}</span>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-400">{item.ip ?? '—'}</td>
                <td className="px-3 py-2">
                  {item.metadata ? (
                    <button
                      className="text-xs text-brand-700 hover:underline"
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    >
                      {expanded === item.id ? tr('დამალვა', 'Hide') : tr('ნახვა', 'View')}
                    </button>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                  {expanded === item.id && item.metadata && (
                    <pre className="mt-2 max-w-md overflow-x-auto rounded bg-slate-900 p-2 text-[11px] text-slate-100">
                      {JSON.stringify(item.metadata, null, 2)}
                    </pre>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.items.length === 0 && (
          <p className="p-6 text-center text-slate-500">{tr('ჩანაწერები არ არის.', 'No entries.')}</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            className="btn-secondary px-3 py-1 text-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ←
          </button>
          <span className="text-sm text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            className="btn-secondary px-3 py-1 text-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
