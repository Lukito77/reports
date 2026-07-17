'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';

export function Navbar() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useI18n();
  const { settings } = useSettings();
  const { branding, layout } = settings;
  const [mobileOpen, setMobileOpen] = useState(false);
  // Staff, or anyone holding a management permission, gets the admin link.
  const canAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'MODERATOR' ||
    (user?.permissions?.length ?? 0) > 0;

  // Rendered once for the desktop row and once for the mobile dropdown, so
  // login state / admin link / language switcher only need to be wired up here.
  function renderNavItems(onNavigate: () => void) {
    return (
      <>
        {layout.showReportButton && (
          <Link href="/report" className="btn-primary" onClick={onNavigate}>
            {t.nav.reportIssue}
          </Link>
        )}

        {/* სანამ სესია მოწმდება (loading), შესვლა/რეგისტრაციას მაინც ვაჩვენებთ —
            თორემ ნელი ქსელის დროს navbar ცარიელი ჩანს */}
        {user ? (
          <>
            <Link
              href="/dashboard"
              className="text-slate-600 hover:text-slate-900"
              onClick={onNavigate}
            >
              {lang === 'ka' ? 'პანელი' : 'Dashboard'}
            </Link>
            {canAdmin && (
              <Link
                href="/admin"
                className="text-slate-600 hover:text-slate-900"
                onClick={onNavigate}
              >
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
                onNavigate();
                await logout();
                // Hard reload (not client-side nav) so all in-memory/router-cached
                // state of the previous account is fully discarded — otherwise the
                // old session can appear to "come back" when navigating to login.
                window.location.assign('/login');
              }}
              className="btn-secondary"
            >
              {lang === 'ka' ? 'გამოსვლა' : 'Log out'}
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-slate-600 hover:text-slate-900"
              onClick={onNavigate}
            >
              {t.nav.login}
            </Link>
            <Link href="/register" className="btn-secondary" onClick={onNavigate}>
              {t.nav.signup}
            </Link>
          </>
        )}

        {/* ენის გადართვა */}
        {layout.showLanguageSwitcher && (
          <button
            onClick={() => setLang(lang === 'ka' ? 'en' : 'ka')}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            {lang === 'ka' ? '🇬🇧 EN' : '🇬🇪 KA'}
          </button>
        )}
      </>
    );
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-brand-700">
          <span className="text-xl">{branding.logoEmoji}</span> {branding.siteName}
        </Link>

        <div className="hidden items-center gap-3 text-sm sm:flex">
          {renderNavItems(() => {})}
        </div>

        <button
          type="button"
          className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 sm:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="flex flex-col items-start gap-3 border-t border-slate-200 px-4 py-4 text-sm sm:hidden">
          {renderNavItems(() => setMobileOpen(false))}
        </div>
      )}
    </header>
  );
}
