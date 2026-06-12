'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // წარმატებული რეგისტრაციის შემდეგ მესიჯს ვაჩვენებთ და მთავარ გვერდზე ვაბრუნებთ
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => router.push('/'), 5000);
    return () => clearTimeout(timer);
  }, [done, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await register(email, password, displayName || undefined);
      setDone(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card text-center">
          <div className="mb-3 text-4xl">📧</div>
          <h1 className="mb-2 text-xl font-bold">
            {t.register.title}
          </h1>
          <p className="text-sm text-slate-600">{done}</p>
          <p className="mt-2 text-xs text-slate-400">{t.register.redirectingHome}</p>
          <Link href="/login" className="btn-secondary mt-4">
            {t.login.submit}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="mb-1 text-2xl font-bold">{t.register.title}</h1>
        <p className="mb-6 text-sm text-slate-600">{t.register.subtitle}</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">{t.register.displayName}</label>
            <input id="name" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="email">{t.register.email}</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="password">{t.register.password}</label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <p className="mt-1 text-xs text-slate-500">{t.register.passwordHint}</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? '...' : t.register.createAccount}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          {t.register.alreadyHave}{' '}
          <Link href="/login" className="text-brand-600 hover:underline">
            {t.register.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}