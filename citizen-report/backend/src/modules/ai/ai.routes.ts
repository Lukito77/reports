/**
 * On-demand AI utilities for staff (e.g. re-run plate OCR or tamper analysis on
 * an uploaded image during review). Advisory only — results never drive enforcement.
 */
import { Router } from 'express';
import { Role } from '../../models/enums';
import { requireAuth, requireRole } from '../../middleware/auth';
import { upload, assertRealFileType } from '../../middleware/upload';
import { ApiError } from '../../middleware/error';
import * as ai from './ai.service';
import { decrypt } from '../../lib/crypto';

const router = Router();
router.use(requireAuth, requireRole(Role.ADMIN, Role.MODERATOR));

/**
 * @openapi
 * /ai/analyze:
 *   post:
 *     tags: [AI]
 *     summary: Run plate OCR + tamper detection on a single image (staff only)
 */
router.post('/analyze', upload.single('image'), async (req, res) => {
  const file = req.file;
  if (!file) throw ApiError.badRequest('image file required');
  await assertRealFileType(file.buffer, file.mimetype);

  const [plates, tamper] = await Promise.all([
    ai.detectPlates(file.buffer),
    ai.detectTampering(file.buffer),
  ]);

  res.json({
    plates: plates.plates.map((p) => ({ text: decrypt(p.textEncrypted), confidence: p.confidence })),
    tamper,
    note: 'Advisory only. Results must be confirmed by a human reviewer.',
  });
});

export default router;
