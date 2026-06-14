import { Router } from 'express';
import { Role } from '../../models/enums';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  listReportsSchema,
  updateStatusSchema,
  changeRoleSchema,
  auditQuerySchema,
} from './admin.schema';
import { reportIdSchema } from '../reports/reports.schema';
import * as ctrl from './admin.controller';
import { z } from 'zod';

const router = Router();

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
  validate({ params: z.object({ userId: z.string().uuid() }), body: changeRoleSchema }),
  ctrl.changeUserRole,
);

export default router;
