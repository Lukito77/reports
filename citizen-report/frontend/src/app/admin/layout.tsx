'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FileEdit,
  Palette,
  Shield,
  Database,
  ScrollText,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { can, canAccessAdmin } from '@/lib/permissions';
import type { Permission } from '@/lib/types';

interface NavItem {
  href: string;
  perm: Permission;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  ka: string;
  en: string;
}

const NAV: NavItem[] = [
  { href: '/admin', perm: 'analytics.view', icon: LayoutDashboard, ka: 'მთავარი დაფა', en: 'Dashboard' },
  { href: '/admin/reports', perm: 'reports.view', icon: FileText, ka: 'განაცხადები', en: 'Reports' },
  { href: '/admin/content', perm: 'content.manage', icon: FileEdit, ka: 'კონტენტი', en: 'Content' },
  { href: '/admin/appearance', perm: 'settings.manage', icon: Palette, ka: 'გარეგნობა', en: 'Appearance' },
  { href: '/admin/permissions', perm: 'users.manage', icon: Shield, ka: 'უფლებები', en: 'Permissions' },
  { href: '/admin/collections', perm: 'collections.manage', icon: Database, ka: 'მონაცემები', en: 'Collections' },
  { href: '/admin/audit', perm: 'audit.view', icon: ScrollText, ka: 'აუდიტი', en: 'Audit log' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!canAccessAdmin(user)) {
      router.replace('/dashboard');
      return;
    }
    // Landed on the dashboard without analytics access → send to first allowed section.
    if (pathname === '/admin' && !can(user, 'analytics.view')) {
      const first = NAV.find((n) => can(user, n.perm));
      if (first && first.href !== '/admin') router.replace(first.href);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return <p className="text-center text-slate-500">{lang === 'ka' ? 'იტვირთება…' : 'Loading…'}</p>;
  }
  if (!canAccessAdmin(user)) return null;

  const items = NAV.filter((n) => can(user, n.perm));

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{lang === 'ka' ? 'ადმინ პანელი' : 'Admin panel'}</h2>
          <span className="badge bg-brand-100 text-brand-700">{user.role}</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{lang === 'ka' ? item.ka : item.en}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <section className="min-w-0">{children}</section>
    </div>
  );
}
