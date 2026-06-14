'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { useI18n, categoryLabel } from '@/lib/i18n';
import { StatusBadge } from '@/components/StatusBadge';
import type { Report } from '@/lib/types';

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useI18n();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function deleteReport() {
    if (!report) return;
    if (!window.confirm(t.reportDetail.deleteConfirm)) return;
    setDeleting(true);
    try {
      await apiFetch(`/reports/${report.id}`, { method: 'DELETE' });
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.reportDetail.deleteFailed);
      setDeleting(false);
    }
  }

  useEffect(() => {
    apiFetch<{ report: Report }>(`/reports/${params.id}`)
      .then((d) => setReport(d.report))
      .catch((err) => setError(err instanceof ApiError ? err.message : t.reportDetail.loadFailed));
  }, [params.id, t]);

  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (!report) return <p className="text-center text-slate-500">{t.reportDetail.loading}</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">{t.reportDetail.back}</Link>

      <div className="card">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{categoryLabel(report.category, lang)}</h1>
          <StatusBadge status={report.status} />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {t.reportDetail.submitted} {new Date(report.createdAt).toLocaleString()}
          {report.anonymous && ` · ${t.reportDetail.anonymous}`}
        </p>

        {report.summary && (
          <p className="mt-4 rounded bg-slate-50 p-3 text-sm text-slate-700">{report.summary}</p>
        )}

        <h2 className="mt-4 text-sm font-semibold text-slate-500">{t.reportDetail.description}</h2>
        <p className="text-sm text-slate-700">{report.description}</p>

        {(report.latitude != null || report.address) && (
          <>
            <h2 className="mt-4 text-sm font-semibold text-slate-500">{t.reportDetail.location}</h2>
            <p className="text-sm text-slate-700">
              {report.address}
              {report.latitude != null && (
                <span className="text-slate-400">
                  {' '}({report.latitude.toFixed(5)}, {report.longitude?.toFixed(5)})
                </span>
              )}
            </p>
          </>
        )}

        {report.status === 'APPROVED' && (
          <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <strong>{t.reportDetail.approvedTitle}</strong> {t.reportDetail.approvedRest}
            {report.reviewerNote && <p className="mt-1">{t.reportDetail.reviewerNote} {report.reviewerNote}</p>}
          </div>
        )}

        {report.status === 'REJECTED' && (
          <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <strong>{t.reportDetail.rejectedTitle}</strong>
            {report.reviewerNote && <p className="mt-1">{t.reportDetail.reason} {report.reviewerNote}</p>}
          </div>
        )}

        {report.status === 'INFO_REQUESTED' && report.reviewerNote && (
          <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <strong>{t.reportDetail.infoRequested}</strong> {report.reviewerNote}
          </div>
        )}

        <div className="mt-4 border-t border-slate-200 pt-3">
          <button
            className="btn-primary bg-red-600 hover:bg-red-700"
            onClick={deleteReport}
            disabled={deleting}
          >
            {deleting ? t.reportDetail.deleting : t.reportDetail.deleteBtn}
          </button>
          <p className="mt-1 text-[11px] text-slate-400">
            {t.reportDetail.deleteHint}
          </p>
        </div>
      </div>

      {report.media && report.media.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-slate-500">
            {t.reportDetail.evidence}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {report.media.map((m) =>
              m.kind === 'VIDEO' ? (
                <video key={m.id} src={m.url} controls className="w-full rounded-lg" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={m.id} src={m.url} alt="evidence" className="w-full rounded-lg object-cover" />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
