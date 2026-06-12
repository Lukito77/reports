'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { lang, setLang, t } = useI18n();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-brand-700">
          <span className="text-xl">🏛️</span> Citizen Report
        </Link>

        <div className="flex items-center gap-3 text-sm">
          <Link href="/report" className="btn-primary">
            {t.nav.reportIssue}
          </Link>

          {/* სანამ სესია მოწმდება (loading), შესვლა/რეგისტრაციას მაინც ვაჩვენებთ —
              თორემ ნელი ქსელის დროს navbar ცარიელი ჩანს */}
          {user ? (
            <>
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                {lang === 'ka' ? 'პანელი' : 'Dashboard'}
              </Link>
              {isStaff && (
                <Link href="/admin" className="text-slate-600 hover:text-slate-900">
                  {lang === 'ka' ? 'ადმინი' : 'Admin'}
                </Link>
              )}
              {/* ემაილის ნაცვლად — წრიული ავატარი ინიციალით; სრული ემაილი hover-ზე ჩანს */}
              <span
                title={user.email}
                className="flex h-8 w-8 select-none items-center justify-center rounded-full bg-brand-600 text-sm font-semibold uppercase text-white"
              >
                {(user.displayName || user.email).charAt(0)}
              </span>
              <button
                onClick={async () => {
                  await logout();
                  router.push('/');
                }}
                className="btn-secondary"
              >
                {lang === 'ka' ? 'გამოსვლა' : 'Log out'}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
                {t.nav.login}
              </Link>
              <Link href="/register" className="btn-secondary">
                {t.nav.signup}
              </Link>
            </>
          )}

          {/* ენის გადართვა */}
          <button
            onClick={() => setLang(lang === 'ka' ? 'en' : 'ka')}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            {lang === 'ka' ? '🇬🇧 EN' : '🇬🇪 KA'}
          </button>
        </div>
      </nav>
    </header>
  );
}