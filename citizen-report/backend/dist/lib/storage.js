"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLOUDINARY_FOLDER = void 0;
exports.newStorageKey = newStorageKey;
exports.putObject = putObject;
exports.getSignedDownloadUrl = getSignedDownloadUrl;
exports.deleteObject = deleteObject;
/**
 * Cloudinary object storage. Media is uploaded as `authenticated` (private):
 * it is only reachable through short-lived signed delivery URLs, mirroring the
 * old private-S3-bucket + presigned-URL model. All assets live under the
 * `citizen-report` folder.
 */
const cloudinary_1 = require("cloudinary");
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
cloudinary_1.v2.config({
    cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.env.CLOUDINARY_API_KEY,
    api_secret: env_1.env.CLOUDINARY_API_SECRET,
    secure: true,
});
exports.CLOUDINARY_FOLDER = 'citizen-report';
/** Fully-qualified Cloudinary public_id (folder-prefixed). */
function publicId(key) {
    return `${exports.CLOUDINARY_FOLDER}/${key}`;
}
function resourceTypeFor(contentType) {
    return contentType.startsWith('video/') ? 'video' : 'image';
}
/** Random, opaque storage key — original filenames are never used. */
function newStorageKey(prefix, ext) {
    const safeExt = ext.replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'bin';
    // Kept in the key for traceability; Cloudinary tracks the real format itself.
    return `${prefix}/${(0, uuid_1.v4)()}-${safeExt}`;
}
/** Upload a buffer to the private `citizen-report` folder under `key`. */
async function putObject(key, body, contentType) {
    const resource_type = resourceTypeFor(contentType);
    await new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({
            public_id: publicId(key),
            resource_type,
            // Private delivery: requires a signed URL to view.
            type: 'authenticated',
            overwrite: true,
        }, (err) => (err ? reject(err) : resolve()));
        stream.end(body);
    });
}
/** Signed delivery URL for viewing private media. */
async function getSignedDownloadUrl(key, resourceType = 'image') {
    return cloudinary_1.v2.url(publicId(key), {
        resource_type: resourceType,
        type: 'authenticated',
        sign_url: true,
        secure: true,
    });
}
async function deleteObject(key, resourceType = 'image') {
    await cloudinary_1.v2.uploader.destroy(publicId(key), {
        resource_type: resourceType,
        type: 'authenticated',
    });
}
//# sourceMappingURL=storage.js.map