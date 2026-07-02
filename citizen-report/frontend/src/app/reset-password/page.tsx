'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

function ResetForm() {
  const { t } = useI18n();
  const params = useSearchParams();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(t.resetPassword.missingToken);
      return;
    }
    if (password !== confirm) {
      setError(t.resetPassword.mismatch);
      return;
    }

    setBusy(true);
    try {
      await apiFetch<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: { token, password },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.resetPassword.error);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card text-center">
        <div className="mb-3 text-4xl">✅</div>
        <h1 className="mb-2 text-xl font-bold">{t.resetPassword.title}</h1>
        <p className="mb-4 text-sm text-slate-600">{t.resetPassword.success}</p>
        <Link href="/login" className="btn-primary inline-block">
          {t.resetPassword.signIn}
        </Link>
      </div>
    );
  }

  // No token in the URL at all — dead-end the flow with a way to recover.
  if (!token) {
    return (
      <div className="card text-center">
        <div className="mb-3 text-4xl">⚠️</div>
        <p className="mb-4 text-sm text-slate-600">{t.resetPassword.missingToken}</p>
        <Link href="/forgot-password" className="btn-primary inline-block">
          {t.resetPassword.requestNew}
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h1 className="mb-1 text-2xl font-bold">{t.resetPassword.title}</h1>
      <p className="mb-6 text-sm text-slate-600">{t.resetPassword.subtitle}</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="password">{t.resetPassword.password}</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={10}
          />
          <p className="mt-1 text-xs text-slate-500">{t.resetPassword.hint}</p>
        </div>
        <div>
          <label className="label" htmlFor="confirm">{t.resetPassword.confirm}</label>
          <input
            id="confirm"
            type="password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={10}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? t.resetPassword.updating : t.resetPassword.submit}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <Suspense fallback={<p className="text-center text-slate-500 py-10">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
