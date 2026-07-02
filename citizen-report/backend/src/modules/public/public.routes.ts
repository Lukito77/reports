import { Router } from 'express';
import * as ctrl from './public.controller';

const router = Router();

/**
 * @openapi
 * /settings/public:
 *   get:
 *     tags: [Public]
 *     summary: Public theme, branding, and layout configuration
 */
router.get('/settings/public', ctrl.getPublicSettings);

/**
 * @openapi
 * /content:
 *   get:
 *     tags: [Public]
 *     summary: Editable site copy (ka/en trees) merged over static defaults
 */
router.get('/content', ctrl.getPublicContent);

export default router;
