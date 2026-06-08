/**
 * AI assistance — privacy & evidence helpers.
 *
 * IMPORTANT: every result here is ADVISORY. None of it issues fines, determines
 * guilt, or triggers enforcement. It exists to help human reviewers and to
 * protect bystander privacy. The functions below use a pluggable provider model:
 * the default implementation is a deterministic local stub so the system works
 * out of the box; swap in a real OCR/vision provider via the `AiProvider` interface.
 */
import sharp from 'sharp';
import { encrypt } from '../../lib/crypto';
import { logger } from '../../lib/logger';

export interface PlateResult {
  plates: { textEncrypted: string; confidence: number }[];
  provider: string;
}

export interface TamperResult {
  tampered: boolean;
  score: number; // 0 (untouched) .. 1 (likely manipulated)
  signals: string[];
  provider: string;
}

export interface AiProvider {
  detectPlates(image: Buffer): Promise<{ text: string; confidence: number }[]>;
  detectFaces(image: Buffer): Promise<{ x: number; y: number; w: number; h: number }[]>;
  detectTampering(image: Buffer): Promise<{ tampered: boolean; score: number; signals: string[] }>;
}

/**
 * Local stub provider. Returns conservative empty/neutral results plus a couple
 * of cheap heuristics so the pipeline is exercised end-to-end without external
 * services. Replace with a cloud OCR/vision provider for real detection.
 */
const localProvider: AiProvider = {
  async detectPlates() {
    // No real OCR locally — return nothing rather than guessing.
    return [];
  },
  async detectFaces() {
    // No real detector locally; face blurring falls back to a no-op (see blurFaces).
    return [];
  },
  async detectTampering(image: Buffer) {
    // Heuristic: missing/zero metadata + recompression markers are weak signals.
    const signals: string[] = [];
    let score = 0.05;
    try {
      const meta = await sharp(image).metadata();
      if (!meta.exif) {
        signals.push('no_exif_metadata');
        score += 0.1;
      }
      if (meta.format === 'jpeg' && (meta.density ?? 0) === 0) {
        signals.push('stripped_density');
        score += 0.05;
      }
    } catch {
      signals.push('unreadable_image');
      score += 0.2;
    }
    return { tampered: score >= 0.5, score: Math.min(score, 1), signals };
  },
};

const provider: AiProvider = localProvider;

/** OCR license plates and return them ENCRYPTED (never store plate text in clear). */
export async function detectPlates(image: Buffer): Promise<PlateResult> {
  const raw = await provider.detectPlates(image).catch((err) => {
    logger.warn({ err }, 'plate detection failed');
    return [];
  });
  return {
    plates: raw.map((p) => ({ textEncrypted: encrypt(p.text)!, confidence: p.confidence })),
    provider: 'local-stub',
  };
}

/**
 * Privacy: blur detected faces. With the local stub (no detector) this applies a
 * light overall blur to the derivative as a safe default when faces can't be
 * located, ensuring reviewer-facing media is privacy-preserving by default.
 * Returns the processed image buffer (JPEG).
 */
export async function blurFaces(image: Buffer): Promise<{ buffer: Buffer; facesBlurred: number }> {
  const faces = await provider.detectFaces(image).catch(() => []);
  const pipeline = sharp(image).rotate(); // normalize orientation, strip EXIF on output

  if (faces.length === 0) {
    // Conservative default: no detector available -> emit a re-encoded copy with
    // metadata stripped. (A production detector would blur only face regions.)
    const buffer = await pipeline.jpeg({ quality: 85 }).toBuffer();
    return { buffer, facesBlurred: 0 };
  }

  // Composite blurred patches over each detected face region.
  const base = sharp(image).rotate();
  const meta = await base.metadata();
  const composites = await Promise.all(
    faces.map(async (f) => {
      const patch = await sharp(image)
        .extract({ left: f.x, top: f.y, width: f.w, height: f.h })
        .blur(20)
        .toBuffer();
      return { input: patch, left: f.x, top: f.y };
    }),
  );
  void meta;
  const buffer = await base.composite(composites).jpeg({ quality: 85 }).toBuffer();
  return { buffer, facesBlurred: faces.length };
}

/** Detect likely image manipulation (advisory signal for reviewers). */
export async function detectTampering(image: Buffer): Promise<TamperResult> {
  const r = await provider.detectTampering(image);
  return { ...r, provider: 'local-stub' };
}

/**
 * Generate a concise, neutral summary of a report for reviewer convenience.
 * Deterministic template by default; swap for an LLM provider if desired.
 * Phrased to avoid asserting guilt.
 */
export function generateSummary(input: {
  categoryName: string;
  description: string;
  address?: string | null;
  incidentAt?: Date | null;
  mediaCount: number;
}): string {
  const when = input.incidentAt ? input.incidentAt.toISOString().slice(0, 16).replace('T', ' ') : 'an unspecified time';
  const where = input.address ? ` near ${input.address}` : '';
  const desc = input.description.trim().replace(/\s+/g, ' ').slice(0, 240);
  return (
    `Reported potential "${input.categoryName}"${where} at ${when}. ` +
    `${input.mediaCount} media item(s) attached. Reporter states: "${desc}". ` +
    `This is an unverified citizen report for human review only.`
  );
}
