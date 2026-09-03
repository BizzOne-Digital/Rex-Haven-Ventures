import "server-only";
import { createHash } from "node:crypto";

/**
 * Cloudinary transport.
 *
 * Talks to the REST API over `fetch` with a signed request rather than pulling
 * in the `cloudinary` SDK: the two calls this project needs — upload and
 * destroy — are a handful of form fields each, and the SDK would add a Node-only
 * dependency for no gain.
 *
 * Credentials are read at call time, never at module load, so the media routes
 * can report "not configured" instead of crashing the process on boot. The API
 * secret stays server-side: nothing here is imported from a client component,
 * and `server-only` enforces that.
 *
 * Required environment variables (see `.env.example`):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 * Optional:
 *   CLOUDINARY_UPLOAD_FOLDER  defaults to "rex-haven"
 */

const API_BASE = "https://api.cloudinary.com/v1_1";

export type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
};

/** Reads and validates the credentials, or returns null if any are missing. */
export function getCloudinaryConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) return null;

  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "rex-haven",
  };
}

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryConfig() !== null;
}

/**
 * Cloudinary's signature scheme: the signed parameters sorted by name, joined
 * as `a=1&b=2`, with the API secret appended, then SHA-1 hashed. `file`,
 * `api_key` and `resource_type` are excluded by the API's own rules.
 */
function sign(params: Record<string, string>, apiSecret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export type CloudinaryUploadResult = {
  publicId: string;
  secureUrl: string;
  bytes: number;
  width?: number;
  height?: number;
  format?: string;
};

type UploadResponse = {
  public_id?: string;
  secure_url?: string;
  url?: string;
  bytes?: number;
  width?: number;
  height?: number;
  format?: string;
  error?: { message?: string };
};

/**
 * Uploads bytes and returns the fields the `Media` record needs.
 *
 * `publicId` is passed explicitly (rather than letting Cloudinary derive one
 * from the filename) so the stored identifier is the same collision-proof value
 * used for local files. That keeps one naming scheme across both back ends and
 * makes the record's `filename` meaningful either way.
 */
export async function uploadToCloudinary(
  config: CloudinaryConfig,
  publicId: string,
  mimeType: string,
  bytes: Buffer,
): Promise<CloudinaryUploadResult> {
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signedParams: Record<string, string> = {
    folder: config.folder,
    public_id: publicId,
    timestamp,
  };

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type: mimeType }));
  form.append("api_key", config.apiKey);
  for (const [key, value] of Object.entries(signedParams)) form.append(key, value);
  form.append("signature", sign(signedParams, config.apiSecret));

  const response = await fetch(`${API_BASE}/${config.cloudName}/image/upload`, {
    method: "POST",
    body: form,
    // Uploads are always a fresh write; never let a fetch cache sit in front.
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as UploadResponse | null;

  if (!response.ok || !body?.public_id || !(body.secure_url ?? body.url)) {
    throw new Error(
      body?.error?.message ?? `Cloudinary rejected the upload (HTTP ${response.status}).`,
    );
  }

  return {
    publicId: body.public_id,
    // `secure_url` is the https form; fall back only if the API omits it.
    secureUrl: (body.secure_url ?? body.url) as string,
    bytes: body.bytes ?? bytes.byteLength,
    ...(body.width ? { width: body.width } : {}),
    ...(body.height ? { height: body.height } : {}),
    ...(body.format ? { format: body.format } : {}),
  };
}

/**
 * Deletes an asset by public id.
 *
 * A `not found` result is treated as success: the database record is what the
 * library lists, and an asset already gone from Cloudinary must not block
 * removing the row that points at it.
 */
export async function destroyOnCloudinary(
  config: CloudinaryConfig,
  publicId: string,
): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signedParams: Record<string, string> = {
    invalidate: "true",
    public_id: publicId,
    timestamp,
  };

  const form = new FormData();
  form.append("api_key", config.apiKey);
  for (const [key, value] of Object.entries(signedParams)) form.append(key, value);
  form.append("signature", sign(signedParams, config.apiSecret));

  const response = await fetch(`${API_BASE}/${config.cloudName}/image/destroy`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as
    | { result?: string; error?: { message?: string } }
    | null;

  if (body?.result === "ok" || body?.result === "not found") return;

  throw new Error(
    body?.error?.message ?? `Cloudinary refused to delete the asset (HTTP ${response.status}).`,
  );
}
