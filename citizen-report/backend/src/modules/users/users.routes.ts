import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as ctrl from './users.controller';

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get the current user's profile
 */
router.get('/me', ctrl.me);

/**
 * @openapi
 * /users/me/export:
 *   get:
 *     tags: [Users]
 *     summary: GDPR data export (download all personal data as JSON)
 */
router.get('/me/export', ctrl.exportData);

/**
 * @openapi
 * /users/me:
 *   delete:
 *     tags: [Users]
 *     summary: GDPR erasure — delete account and anonymize reports
 */
router.delete('/me', ctrl.eraseAccount);

export default router;
