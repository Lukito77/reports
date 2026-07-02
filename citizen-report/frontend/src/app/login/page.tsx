'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ApiError, setAccessToken, API_URL } from '@/lib/api';
import { getRememberedEmails } from '@/lib/rememberedEmails';
import { useI18n } from '@/lib/i18n';

function LoginForm() {
  const { login, requestOtp, loginWithOtp, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [knownEmails, setKnownEmails] = useState<string[]>([]);

  // Load previously-used emails (client-only, to avoid hydration mismatch).
  useEffect(() => {
    setKnownEmails(getRememberedEmails());
  }, []);

  // 🔄 ვამოწმებთ URL-ს Google Auth-იდან დაბრუნებისას
  useEffect(() => {
    const token = searchParams.get('token');
    const authError = searchParams.get('error');

    if (token) {
      // 1. ტოკენი მეხსიერებაში — ზუსტად ისე, როგორც ჩვეულებრივი login-ის შემდეგ.
      //    (API კლიენტი ტოკენს მეხსიერებაში ინახავს და არა localStorage-ში)
      setAccessToken(token);

      // 2. ჩავტვირთავთ იუზერს და გადავდივართ მთავარ გვერდზე
      //    (replace — რომ ტოკენიანი URL ისტორიაში არ დარჩეს)
      refreshUser().finally(() => router.replace('/'));
    }

    if (authError) {
      setError(t.login.googleError);
    }
  }, [searchParams, router, refreshUser, t]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.login.error);
    } finally {
      setBusy(false);
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestOtp(email);
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.login.otpError);
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await loginWithOtp(email, code.trim());
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.login.error);
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: 'password' | 'otp') {
    setMode(next);
    setError(null);
    setOtpSent(false);
    setCode('');
    setPassword('');
  }

  // Google OAuth-ის ფუნქცია, რომელიც პირდაპირ ბექენდზე გადაამისამართებს იუზერს
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="mb-1 text-2xl font-bold">
          {mode === 'otp' ? t.login.otpTitle : t.login.title}
        </h1>
        <p className="mb-6 text-sm text-slate-600">
          {mode === 'otp' ? t.login.otpSubtitle : t.login.subtitle}
        </p>

        {/* Suggestions of previously-used emails (native <datalist> dropdown). */}
        <datalist id="known-emails">
          {knownEmails.map((e) => (
            <option key={e} value={e} />
          ))}
        </datalist>

        {/* ── Password mode ── */}
        {mode === 'password' && (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">{t.login.email}</label>
              <input id="email" name="email" type="email" autoComplete="email" list="known-emails" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label" htmlFor="password">{t.login.password}</label>
                <Link href="/forgot-password" className="text-xs text-brand-600 hover:underline">
                  {t.login.forgotLink}
                </Link>
              </div>
              <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? t.login.signingIn : t.login.submit}
            </button>

            <button
              type="button"
              onClick={() => switchMode('otp')}
              className="w-full text-center text-sm text-brand-600 hover:underline"
            >
              {t.login.otpToggle}
            </button>

            {/* Google-ით შესვლის სექცია და ღილაკი */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-xs text-slate-400 uppercase">{t.login.or}</span>
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
              {t.login.googleSignIn}
            </button>
          </form>
        )}

        {/* ── OTP mode ── */}
        {mode === 'otp' && !otpSent && (
          <form onSubmit={sendCode} className="space-y-4">
            <div>
              <label className="label" htmlFor="otp-email">{t.login.email}</label>
              <input id="otp-email" name="email" type="email" autoComplete="email" list="known-emails" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? t.login.otpSending : t.login.otpSend}
            </button>

            <button
              type="button"
              onClick={() => switchMode('password')}
              className="w-full text-center text-sm text-brand-600 hover:underline"
            >
              {t.login.passwordToggle}
            </button>
          </form>
        )}

        {mode === 'otp' && otpSent && (
          <form onSubmit={verifyCode} className="space-y-4">
            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
              {t.login.otpSent}
            </div>
            <div>
              <label className="label" htmlFor="otp-code">{t.login.otpCodeLabel}</label>
              <input
                id="otp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="\d{6}"
                className="input tracking-[0.5em] text-center text-lg"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" className="btn-primary w-full" disabled={busy || code.length !== 6}>
              {busy ? t.login.otpVerifying : t.login.otpVerify}
            </button>

            <button
              type="button"
              onClick={() => { setOtpSent(false); setCode(''); setError(null); }}
              className="w-full text-center text-sm text-brand-600 hover:underline"
            >
              {t.login.otpChangeEmail}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-slate-600">
          {t.login.noAccount}{' '}
          <Link href="/register" className="text-brand-600 hover:underline">{t.login.register}</Link>
        </p>
      </div>
    </div>
  );
}

// useSearchParams() build-ის დროს Suspense-ს ითხოვს (იხ. verify-email-ის ანალოგიური პატერნი)
export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-slate-500 py-10">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
