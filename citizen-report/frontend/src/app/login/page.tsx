'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'შესვლა ვერ მოხერხდა');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="mb-1 text-2xl font-bold">{t.login.title}</h1>
        <p className="mb-6 text-sm text-slate-600">შენს შეტყობინებებს თვალყურის დევნებისთვის შედი.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">{t.login.email}</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="password">{t.login.password}</label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'მიმდინარეობს...' : t.login.submit}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          {t.login.noAccount}{' '}
          <Link href="/register" className="text-brand-600 hover:underline">{t.login.register}</Link>
        </p>
      </div>
    </div>
  );
}