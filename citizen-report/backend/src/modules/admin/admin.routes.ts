import { Router } from 'express';
import { Role, Permission } from '../../models/enums';
import { requireAuth, requireRole, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  listReportsSchema,
  updateStatusSchema,
  changeRoleSchema,
  auditQuerySchema,
  updateSettingsSchema,
  contentCreateSchema,
  contentUpdateSchema,
  updatePermissionsSchema,
  listUsersSchema,
  analyticsQuerySchema,
  collectionListSchema,
} from './admin.schema';
import { reportIdSchema } from '../reports/reports.schema';
import * as ctrl from './admin.controller';
import * as panel from './panel.controller';
import { z } from 'zod';

const router = Router();

const idParam = z.object({ id: z.string().min(1) });
const userIdParam = z.object({ userId: z.string().uuid() });
const collectionParam = z.object({ name: z.string().max(60) });
const collectionDocParam = z.object({ name: z.string().max(60), id: z.string().min(1) });

// All admin routes require authentication + staff role.
router.use(requireAuth, requireRole(Role.ADMIN, Role.MODERATOR));

/**
 * @openapi
 * /admin/reports:
 *   get:
 *     tags: [Admin]
 *     summary: List & filter all reports (status, category, location, date, text)
 */
router.get('/reports', validate({ query: listReportsSchema }), ctrl.listReports);

/**
 * @openapi
 * /admin/reports/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: View a report's full evidence (audited as EVIDENCE_VIEWED)
 */
router.get('/reports/:id', validate({ params: reportIdSchema }), ctrl.getReport);

/**
 * @openapi
 * /admin/reports/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve / reject / request-info / close a report (audited)
 *     description: Approval only forwards for a human enforcement decision; no automatic penalty.
 */
router.patch(
  '/reports/:id/status',
  validate({ params: reportIdSchema, body: updateStatusSchema }),
  ctrl.updateStatus,
);

/**
 * @openapi
 * /admin/reports/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Permanently delete a report and its media (ADMIN only, audited)
 */
router.delete(
  '/reports/:id',
  requireRole(Role.ADMIN),
  validate({ params: reportIdSchema }),
  ctrl.deleteReport,
);

/**
 * @openapi
 * /admin/audit:
 *   get:
 *     tags: [Admin]
 *     summary: Read the append-only audit log
 */
router.get('/audit', validate({ query: auditQuerySchema }), ctrl.listAuditLogs);

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Aggregate report counts by status
 */
router.get('/stats', ctrl.stats);

// Role management is ADMIN-only.
router.patch(
  '/users/:userId/role',
  requireRole(Role.ADMIN),
  validate({ params: userIdParam, body: changeRoleSchema }),
  ctrl.changeUserRole,
);

// ── Analytics (charts) ──────────────────────────────────────────────────────
router.get(
  '/analytics',
  requirePermission(Permission.ANALYTICS_VIEW),
  validate({ query: analyticsQuerySchema }),
  panel.getAnalytics,
);

// ── Site settings (theme / branding / layout) ───────────────────────────────
router.get('/settings', panel.getSettings);
router.put(
  '/settings',
  requirePermission(Permission.SETTINGS_MANAGE),
  validate({ body: updateSettingsSchema }),
  panel.updateSettings,
);

// ── Content (editable copy) ─────────────────────────────────────────────────
router.get('/content', requirePermission(Permission.CONTENT_MANAGE), panel.listContent);
router.post(
  '/content',
  requirePermission(Permission.CONTENT_MANAGE),
  validate({ body: contentCreateSchema }),
  panel.createContent,
);
router.patch(
  '/content/:id',
  requirePermission(Permission.CONTENT_MANAGE),
  validate({ params: idParam, body: contentUpdateSchema }),
  panel.updateContent,
);
router.delete(
  '/content/:id',
  requirePermission(Permission.CONTENT_MANAGE),
  validate({ params: idParam }),
  panel.deleteContent,
);

// ── Users & permissions ─────────────────────────────────────────────────────
router.get(
  '/users',
  requirePermission(Permission.USERS_MANAGE),
  validate({ query: listUsersSchema }),
  panel.listUsers,
);
router.get('/permissions/catalog', requirePermission(Permission.USERS_MANAGE), panel.permissionCatalog);
router.patch(
  '/users/:userId/permissions',
  requirePermission(Permission.USERS_MANAGE),
  validate({ params: userIdParam, body: updatePermissionsSchema }),
  panel.updatePermissions,
);

// ── Generic collection CRUD (ADMIN / collections.manage) ────────────────────
router.get('/collections', requirePermission(Permission.COLLECTIONS_MANAGE), panel.listCollections);
router.get(
  '/collections/:name',
  requirePermission(Permission.COLLECTIONS_MANAGE),
  validate({ params: collectionParam, query: collectionListSchema }),
  panel.listDocuments,
);
router.get(
  '/collections/:name/:id',
  requirePermission(Permission.COLLECTIONS_MANAGE),
  validate({ params: collectionDocParam }),
  panel.getDocument,
);
router.post(
  '/collections/:name',
  requirePermission(Permission.COLLECTIONS_MANAGE),
  validate({ params: collectionParam }),
  panel.createDocument,
);
router.patch(
  '/collections/:name/:id',
  requirePermission(Permission.COLLECTIONS_MANAGE),
  validate({ params: collectionDocParam }),
  panel.updateDocument,
);
router.delete(
  '/collections/:name/:id',
  requirePermission(Permission.COLLECTIONS_MANAGE),
  validate({ params: collectionDocParam }),
  panel.deleteDocument,
);

export default router;
