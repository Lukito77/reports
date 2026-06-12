'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ApiError, setAccessToken, API_URL } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const { login, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 🔄 ვამოწმებთ URL-ს Google Auth-იდან დაბრუნებისას
  useEffect(() => {
    const token = searchParams.get('token');
    const authError = searchParams.get('error');

    if (token) {
      // 1. ტოკენი მეხსიერებაში — ზუსტად ისე, როგორც ჩვეულებრივი login-ის შემდეგ.
      //    (API კლიენტი ტოკენს მეხსიერებაში ინახავს და არა localStorage-ში)
      setAccessToken(token);

      // 2. ჩავტვირთავთ იუზერს და გადავდივართ დეშბორდზე
      //    (replace — რომ ტოკენიანი URL ისტორიაში არ დარჩეს)
      refreshUser().finally(() => router.replace('/dashboard'));
    }

    if (authError) {
      setError('Google-ით ავტორიზაცია ვერ მოხერხდა. სცადეთ თავიდან.');
    }
  }, [searchParams, router, refreshUser]);

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

  // Google OAuth-ის ფუნქცია, რომელიც პირდაპირ ბექენდზე გადაამისამართებს იუზერს
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

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

          {/* Google-ით შესვლის სექცია და ღილაკი */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-400 uppercase">ან</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-md shadow-sm transition-colors text-sm"
          >
            {/* Google-ის ლოგო SVG */}
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.107C18.216 1.22 15.44.5 12.24.5 5.866.5.7 5.666.7 12s5.166 11.5 11.54 11.5c6.655 0 11.08-4.68 11.08-11.275 0-.76-.08-1.345-.24-1.94H12.24z"/>
            </svg>
            Google-ით შესვლა
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