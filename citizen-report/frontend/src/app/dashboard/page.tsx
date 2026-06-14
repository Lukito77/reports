'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n, categoryLabel } from '@/lib/i18n';
import { StatusBadge } from '@/components/StatusBadge';
import type { Paginated, Report } from '@/lib/types';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { t, lang } = useI18n();
  const router = useRouter();
  const [data, setData] = useState<Paginated<Report> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // არაავტორიზებული მომხმარებლების გადამისამართება ლოგინზე
  // (Google OAuth-ის ტოკენსაც /login გვერდი იჭერს და თვითონ მოდის აქ)
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // რეპორტების წამოღება ბაზიდან
  useEffect(() => {
    if (!user) return;
    apiFetch<Paginated<Report>>('/reports/mine')
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : t.dashboard.loadFailed));
  }, [user]);

  async function exportData() {
    setExporting(true);
    try {
      const blob = await apiFetch<unknown>('/users/me/export');
      const url = URL.createObjectURL(new Blob([JSON.stringify(blob, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'citizen-report-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  if (loading || !user) return <p className="text-center text-slate-500 py-10">{t.dashboard.loading}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.dashboard.title}</h1>
          <p className="text-sm text-slate-600">
            {t.dashboard.signedInAs} {user.email}
            {!user.emailVerified && (
              <span className="ml-2 badge bg-amber-100 text-amber-700">{t.dashboard.emailNotVerified}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportData} className="btn-secondary" disabled={exporting}>
            {exporting ? t.dashboard.exporting : t.dashboard.exportData}
          </button>
          <Link href="/report" className="btn-primary">{t.dashboard.newReport}</Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && data.items.length === 0 && (
        <div className="card text-center text-slate-500">
          {t.dashboard.empty}{' '}
          <Link href="/report" className="text-brand-600 hover:underline">{t.dashboard.submitOne}</Link>.
        </div>
      )}

      <div className="grid gap-4">
        {data?.items.map((r) => (
          <Link key={r.id} href={`/dashboard/${r.id}`} className="card transition hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{categoryLabel(r.category, lang)}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.description}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleString()} · {r.media?.length ?? 0} {t.dashboard.media}
                </p>
              </div>
            </div>
            {r.status === 'APPROVED' && (
              <p className="mt-3 rounded bg-green-50 p-2 text-xs text-green-800">
                ✓ {t.dashboard.approved}{r.reviewerNote && ` — ${r.reviewerNote}`}
              </p>
            )}
            {r.status === 'REJECTED' && (
              <p className="mt-3 rounded bg-red-50 p-2 text-xs text-red-800">
                ✕ {t.dashboard.rejected}{r.reviewerNote && ` — ${r.reviewerNote}`}
              </p>
            )}
            {r.status === 'INFO_REQUESTED' && r.reviewerNote && (
              <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-800">
                {t.dashboard.reviewerRequested} {r.reviewerNote}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}