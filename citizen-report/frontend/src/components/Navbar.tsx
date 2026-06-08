'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-brand-700">
          <span className="text-xl">🏛️</span> Citizen Report
        </Link>

        <div className="flex items-center gap-3 text-sm">
          <Link href="/report" className="btn-primary">
            Report an issue
          </Link>

          {loading ? null : user ? (
            <>
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              {isStaff && (
                <Link href="/admin" className="text-slate-600 hover:text-slate-900">
                  Admin
                </Link>
              )}
              <span className="hidden text-slate-400 sm:inline">·</span>
              <span className="hidden text-slate-500 sm:inline">{user.email}</span>
              <button
                onClick={async () => {
                  await logout();
                  router.push('/');
                }}
                className="btn-secondary"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
                Log in
              </Link>
              <Link href="/register" className="btn-secondary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
