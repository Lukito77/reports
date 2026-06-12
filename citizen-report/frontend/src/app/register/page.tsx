'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ApiError, API_URL } from '@/lib/api';
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

          {/* Google-ით რეგისტრაცია — იგივე OAuth ნაკადი, რაც შესვლისას */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-400 uppercase">{t.login.or}</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = `${API_URL}/auth/google`; }}
            className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-md shadow-sm transition-colors text-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.107C18.216 1.22 15.44.5 12.24.5 5.866.5.7 5.666.7 12s5.166 11.5 11.54 11.5c6.655 0 11.08-4.68 11.08-11.275 0-.76-.08-1.345-.24-1.94H12.24z"/>
            </svg>
            {t.register.googleSignUp}
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