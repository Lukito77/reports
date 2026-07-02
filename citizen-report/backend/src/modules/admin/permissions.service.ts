/**
 * User & permission management. Roles stay coarse (CITIZEN/MODERATOR/ADMIN);
 * fine-grained permissions are additive grants resolved by `effectivePermissions`.
 */
import type { FilterQuery } from 'mongoose';
import { User, AuditAction } from '../../models';
import type { IUser } from '../../models';
import {
  Role,
  ALL_PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  effectivePermissions,
} from '../../models/enums';
import { ApiError } from '../../middleware/error';
import { recordAudit } from '../../lib/audit';
import type { Request } from 'express';

interface ListUsersInput {
  q?: string;
  role?: Role;
  page: number;
  pageSize: number;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listUsers(f: ListUsersInput) {
  const where: FilterQuery<IUser> = {};
  if (f.role) where.role = f.role;
  if (f.q) {
    const rx = { $regex: escapeRegex(f.q), $options: 'i' };
    where.$or = [{ email: rx }, { displayName: rx }];
  }
  const [docs, total] = await Promise.all([
    User.find(where)
      .sort({ createdAt: -1 })
      .skip((f.page - 1) * f.pageSize)
      .limit(f.pageSize)
      .select('email displayName role permissions emailVerified createdAt'),
    User.countDocuments(where),
  ]);
  const items = docs.map((u) => ({
    ...(u.toObject() as unknown as Record<string, unknown>),
    effectivePermissions: effectivePermissions(u.role, u.permissions),
  }));
  return { items, total, page: f.page, pageSize: f.pageSize };
}

export async function updatePermissions(
  userId: string,
  permissions: string[],
  actorId: string,
  req: Request,
) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  // Persist only the additive grants beyond the role defaults — keeps the stored
  // set minimal and prevents stale grants from sticking when a role changes.
  const roleDefaults = new Set<string>(ROLE_DEFAULT_PERMISSIONS[user.role] ?? []);
  const grants = [...new Set(permissions)].filter(
    (p) => (ALL_PERMISSIONS as string[]).includes(p) && !roleDefaults.has(p),
  );

  const updated = await User.findByIdAndUpdate(
    userId,
    { permissions: grants, $inc: { tokenVersion: 1 } },
    { new: true },
  ).select('email displayName role permissions emailVerified createdAt');

  await recordAudit({
    action: AuditAction.USER_PERMISSIONS_CHANGED,
    actorId,
    metadata: { targetUserId: userId, permissions: grants },
    req,
  });

  const obj = (updated as NonNullable<typeof updated>).toObject() as unknown as Record<
    string,
    unknown
  >;
  obj.effectivePermissions = effectivePermissions(
    (updated as NonNullable<typeof updated>).role,
    grants,
  );
  return obj;
}

export function permissionCatalog() {
  return {
    permissions: ALL_PERMISSIONS,
    roleDefaults: ROLE_DEFAULT_PERMISSIONS,
  };
}
