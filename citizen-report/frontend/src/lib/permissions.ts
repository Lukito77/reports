import type { Permission, User } from './types';

/** All fine-grained permissions, with bilingual labels for the admin UI. */
export const PERMISSION_CATALOG: { value: Permission; ka: string; en: string }[] = [
  { value: 'reports.view', ka: 'განაცხადების ნახვა', en: 'View reports' },
  { value: 'reports.moderate', ka: 'განაცხადების მოდერაცია', en: 'Moderate reports' },
  { value: 'reports.delete', ka: 'განაცხადების წაშლა', en: 'Delete reports' },
  { value: 'users.manage', ka: 'მომხმარებლების მართვა', en: 'Manage users' },
  { value: 'content.manage', ka: 'კონტენტის მართვა', en: 'Manage content' },
  { value: 'settings.manage', ka: 'პარამეტრების მართვა', en: 'Manage settings' },
  { value: 'collections.manage', ka: 'მონაცემების მართვა', en: 'Manage collections' },
  { value: 'audit.view', ka: 'აუდიტის ნახვა', en: 'View audit log' },
  { value: 'analytics.view', ka: 'ანალიტიკის ნახვა', en: 'View analytics' },
];

export const ALL_PERMISSIONS: Permission[] = PERMISSION_CATALOG.map((p) => p.value);

/** ADMIN implicitly holds every permission; others must have it granted. */
export function can(user: User | null, perm: Permission): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return (user.permissions ?? []).includes(perm);
}

/** True if the user can reach the admin panel at all (holds any permission / is staff). */
export function canAccessAdmin(user: User | null): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN' || user.role === 'MODERATOR') return true;
  return (user.permissions ?? []).length > 0;
}
