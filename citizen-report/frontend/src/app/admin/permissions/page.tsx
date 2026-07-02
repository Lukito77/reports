'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { PERMISSION_CATALOG } from '@/lib/permissions';
import type { AdminUser, Paginated, Permission, Role } from '@/lib/types';

const ROLES: Role[] = ['CITIZEN', 'MODERATOR', 'ADMIN'];

export default function PermissionsPage() {
  const { user: me } = useAuth();
  const { lang } = useI18n();
  const tr = (ka: string, en: string) => (lang === 'ka' ? ka : en);
  const isAdmin = me?.role === 'ADMIN';

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [roleDefaults, setRoleDefaults] = useState<Record<string, Permission[]>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const pageSize = 25;

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q) qs.set('q', q);
    if (roleFilter) qs.set('role', roleFilter);
    try {
      const data = await apiFetch<Paginated<AdminUser>>(`/admin/users?${qs.toString()}`);
      setUsers(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load');
    }
  }, [page, q, roleFilter]);

  useEffect(() => {
    apiFetch<{ permissions: Permission[]; roleDefaults: Record<string, Permission[]> }>(
      '/admin/permissions/catalog',
    )
      .then((d) => setRoleDefaults(d.roleDefaults))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function togglePerm(userId: string, perm: Permission) {
    setUsers((us) =>
      us.map((u) => {
        if (u.id !== userId) return u;
        const has = u.effectivePermissions.includes(perm);
        return {
          ...u,
          effectivePermissions: has
            ? u.effectivePermissions.filter((p) => p !== perm)
            : [...u.effectivePermissions, perm],
        };
      }),
    );
  }

  async function changeRole(userId: string, role: Role) {
    setError(null);
    try {
      await apiFetch(`/admin/users/${userId}/role`, { method: 'PATCH', body: { role } });
      setMsg(tr('როლი განახლდა', 'Role updated'));
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Role change failed');
    }
  }

  async function savePermissions(u: AdminUser) {
    setSavingId(u.id);
    setError(null);
    try {
      await apiFetch(`/admin/users/${u.id}/permissions`, {
        method: 'PATCH',
        body: { permissions: u.effectivePermissions },
      });
      setMsg(tr('უფლებები განახლდა', 'Permissions updated'));
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSavingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{tr('მომხმარებლები და უფლებები', 'Users & permissions')}</h1>
        {msg && <span className="text-sm text-green-600">{msg}</span>}
      </div>

      <div className="card flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="label">{tr('ძიება', 'Search')}</label>
          <input
            className="input"
            value={q}
            placeholder={tr('ელ-ფოსტა ან სახელი', 'Email or name')}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (setPage(1), load())}
          />
        </div>
        <div>
          <label className="label">{tr('როლი', 'Role')}</label>
          <select className="input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">{tr('ყველა', 'All')}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setPage(1);
            load();
          }}
        >
          {tr('ფილტრი', 'Apply')}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {users.map((u) => {
          const defaults = roleDefaults[u.role] ?? [];
          return (
            <div key={u.id} className="card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{u.displayName || u.email}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {!u.emailVerified && (
                    <span className="badge bg-amber-100 text-amber-700">
                      {tr('დაუდასტურებელი', 'Unverified')}
                    </span>
                  )}
                  <select
                    className="input w-auto"
                    value={u.role}
                    disabled={!isAdmin}
                    onChange={(e) => changeRole(u.id, e.target.value as Role)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {PERMISSION_CATALOG.map((p) => {
                  const fromRole = u.role === 'ADMIN' || defaults.includes(p.value);
                  const checked = u.effectivePermissions.includes(p.value);
                  return (
                    <label
                      key={p.value}
                      className={`flex items-center gap-1.5 text-xs ${fromRole ? 'text-slate-400' : ''}`}
                      title={fromRole ? tr('როლით მინიჭებული', 'Granted by role') : ''}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={fromRole}
                        onChange={() => togglePerm(u.id, p.value)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      {lang === 'ka' ? p.ka : p.en}
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <button
                  className="btn-primary px-3 py-1 text-xs"
                  onClick={() => savePermissions(u)}
                  disabled={savingId === u.id}
                >
                  {savingId === u.id ? tr('ინახება…', 'Saving…') : tr('უფლებების შენახვა', 'Save permissions')}
                </button>
              </div>
            </div>
          );
        })}
        {users.length === 0 && !error && (
          <p className="text-center text-slate-500">{tr('მომხმარებლები ვერ მოიძებნა.', 'No users found.')}</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            className="btn-secondary px-3 py-1 text-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ←
          </button>
          <span className="text-sm text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            className="btn-secondary px-3 py-1 text-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
