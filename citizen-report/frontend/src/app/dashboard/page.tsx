'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; // დაემატა useSearchParams URL-ისთვის
import { apiFetch, ApiError, setAccessToken } from '@/lib/api'; // დაემატა setAccessToken ტოკენის შესანახად
import { useAuth } from '@/lib/auth';
import { StatusBadge } from '@/components/StatusBadge';
import type { Paginated, Report } from '@/lib/types';

export default function DashboardPage() {
  const { user, loading, refreshUser } = useAuth(); // დაემატა refreshUser იუზერის განახლებისთვის
  const router = useRouter();
  const searchParams = useSearchParams(); // დაემატა URL-ის პარამეტრების წასაკითხად
  const [data, setData] = useState<Paginated<Report> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // ⚡ 1. გუგლიდან წამოღებული ტოკენის დამუშავების ეფექტი
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // ვინახავთ მიღებულ ტოკენს
      setAccessToken(token);
      // ვაახლებთ კონტექსტში იუზერის მონაცემებს
      refreshUser();
      // ვასუფთავებთ URL-ს, რომ ?token=... აღარ გამოჩნდეს ლინკში
      router.replace('/dashboard');
    }
  }, [searchParams, router, refreshUser]);

  // 2. არასისტემური მომხმარებლების გადამისამართება ლოგინზე
  useEffect(() => {
    // თუ ტოკენი ახლახან მოვიდა URL-ში, loading ან user შეიძლება წამიერად არ იყოს მზად,
    // ამიტომ ვამოწმებთ რომ URL-შიც არ იყოს ტოკენი, სანამ გადავიყვანთ ლოგინზე.
    const token = searchParams.get('token');
    if (!loading && !user && !token) {
      router.replace('/login');
    }
  }, [loading, user, router, searchParams]);

  // 3. რეპორტების წამოღება ბაზიდან
  useEffect(() => {
    if (!user) return;
    apiFetch<Paginated<Report>>('/reports/mine')
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load reports'));
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

  if (loading || !user) return <p className="text-center text-slate-500 py-10">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My reports</h1>
          <p className="text-sm text-slate-600">
            Signed in as {user.email}
            {!user.emailVerified && (
              <span className="ml-2 badge bg-amber-100 text-amber-700">Email not verified</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportData} className="btn-secondary" disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export my data'}
          </button>
          <Link href="/report" className="btn-primary">New report</Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && data.items.length === 0 && (
        <div className="card text-center text-slate-500">
          You haven’t submitted any reports yet.{' '}
          <Link href="/report" className="text-brand-600 hover:underline">Submit one</Link>.
        </div>
      )}

      <div className="grid gap-4">
        {data?.items.map((r) => (
          <Link key={r.id} href={`/dashboard/${r.id}`} className="card transition hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{r.category?.name ?? 'Report'}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.description}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleString()} · {r.media?.length ?? 0} media
                </p>
              </div>
            </div>
            {r.status === 'INFO_REQUESTED' && r.reviewerNote && (
              <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-800">
                Reviewer requested: {r.reviewerNote}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}