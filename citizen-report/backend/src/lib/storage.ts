/**
 * Cloudinary object storage. Media is uploaded as `authenticated` (private):
 * it is only reachable through short-lived signed delivery URLs, mirroring the
 * old private-S3-bucket + presigned-URL model. All assets live under the
 * `citizen-report` folder.
 */
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuid } from 'uuid';
import { env } from '../config/env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const CLOUDINARY_FOLDER = 'citizen-report';

export type ResourceType = 'image' | 'video';

/** Fully-qualified Cloudinary public_id (folder-prefixed). */
function publicId(key: string): string {
  return `${CLOUDINARY_FOLDER}/${key}`;
}

function resourceTypeFor(contentType: string): ResourceType {
  return contentType.startsWith('video/') ? 'video' : 'image';
}

/** Random, opaque storage key — original filenames are never used. */
export function newStorageKey(prefix: string, ext: string): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'bin';
  // Kept in the key for traceability; Cloudinary tracks the real format itself.
  return `${prefix}/${uuid()}-${safeExt}`;
}

/** Upload a buffer to the private `citizen-report` folder under `key`. */
export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  const resource_type = resourceTypeFor(contentType);
  await new Promise<void>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId(key),
        resource_type,
        // Private delivery: requires a signed URL to view.
        type: 'authenticated',
        overwrite: true,
      },
      (err) => (err ? reject(err) : resolve()),
    );
    stream.end(body);
  });
}

/** Signed delivery URL for viewing private media. */
export async function getSignedDownloadUrl(
  key: string,
  resourceType: ResourceType = 'image',
): Promise<string> {
  return cloudinary.url(publicId(key), {
    resource_type: resourceType,
    type: 'authenticated',
    sign_url: true,
    secure: true,
  });
}

export async function deleteObject(
  key: string,
  resourceType: ResourceType = 'image',
): Promise<void> {
  await cloudinary.uploader.destroy(publicId(key), {
    resource_type: resourceType,
    type: 'authenticated',
  });
}
