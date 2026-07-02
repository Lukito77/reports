'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api';
import { RememberedEmails } from '@/components/RememberedEmails';
import { useI18n } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiFetch<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
      // The API intentionally always returns success (no user enumeration),
      // so we show the same confirmation regardless.
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.forgotPassword.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="mb-1 text-2xl font-bold">{t.forgotPassword.title}</h1>
        <p className="mb-6 text-sm text-slate-600">{t.forgotPassword.subtitle}</p>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
              {t.forgotPassword.sent}
            </div>
            <Link href="/login" className="btn-primary w-full inline-block text-center">
              {t.forgotPassword.backToLogin}
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">{t.forgotPassword.email}</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                list="known-emails"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <RememberedEmails onPick={setEmail} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? t.forgotPassword.sending : t.forgotPassword.submit}
            </button>

            <p className="text-center text-sm">
              <Link href="/login" className="text-brand-600 hover:underline">
                {t.forgotPassword.backToLogin}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
