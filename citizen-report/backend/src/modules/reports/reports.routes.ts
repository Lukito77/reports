import { Router } from 'express';
import { upload } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { optionalAuth, requireAuth } from '../../middleware/auth';
import { reportLimiter } from '../../middleware/rateLimit';
import { verifyCaptcha } from '../../middleware/captcha';
import { createReportSchema, listMyReportsSchema, reportIdSchema } from './reports.schema';
import * as ctrl from './reports.controller';

const router = Router();

/**
 * @openapi
 * /reports/categories:
 *   get:
 *     tags: [Reports]
 *     summary: List active report categories (public)
 */
router.get('/categories', ctrl.listCategories);

/**
 * @openapi
 * /reports:
 *   post:
 *     tags: [Reports]
 *     summary: Submit a report with photo/video evidence (anonymous or authenticated)
 *     description: Multipart form. Field `media` accepts up to MAX_FILES_PER_REPORT files.
 */
router.post(
  '/',
  reportLimiter,
  optionalAuth, // logged-in users are linked; anonymous allowed
  verifyCaptcha,
  upload.array('media'),
  validate({ body: createReportSchema }),
  ctrl.createReport,
);

/**
 * @openapi
 * /reports/mine:
 *   get:
 *     tags: [Reports]
 *     summary: List the authenticated user's own reports
 */
router.get('/mine', requireAuth, validate({ query: listMyReportsSchema }), ctrl.listMyReports);

/**
 * @openapi
 * /reports/{id}:
 *   get:
 *     tags: [Reports]
 *     summary: Get a single report (own report for citizens, any for staff)
 */
router.get('/:id', requireAuth, validate({ params: reportIdSchema }), ctrl.getReport);

export default router;
