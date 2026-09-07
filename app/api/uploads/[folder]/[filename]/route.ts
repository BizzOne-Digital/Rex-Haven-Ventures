import { connectToDatabase } from "@/lib/db/mongoose";
import { StoredUpload } from "@/lib/db/models/StoredUpload";
import { handleRouteError } from "@/lib/api";
import { isSafeUploadFilename, isUploadFolder } from "@/lib/upload-types";

/**
 * GET /api/uploads/:folder/:filename — serve an uploaded image.
 *
 * Public and unauthenticated: these URLs are embedded in blog covers, service
 * panels and product images on the marketing site, so anyone who can see the
 * page can see the image. The filenames are random, which is what keeps the
 * collection from being enumerable.
 *
 * Both path segments are validated before they reach the query. `folder` must
 * be one of the four known values and `filename` must match the shape this
 * system generates — no separators, no `..` — so no request can address a
 * document outside the upload collection.
 *
 * Responses are immutable: a stored upload's filename is unique per write, so a
 * given URL always resolves to the same bytes and can be cached for a year.
 */

// The Mongo driver and Buffer both need Node APIs.
export const runtime = "nodejs";

const notFound = () =>
  new Response("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/uploads/[folder]/[filename]">,
) {
  const { folder, filename } = await params;

  if (!isUploadFolder(folder) || !isSafeUploadFilename(filename)) return notFound();

  try {
    await connectToDatabase();

    const upload = await StoredUpload.findOne({ folder, filename })
      .select("data mimeType size")
      .lean<{ data: unknown; mimeType: string; size: number }>();

    if (!upload) return notFound();

    const bytes = toBuffer(upload.data);
    if (!bytes) return notFound();

    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": upload.mimeType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        // These are images, and some arrive from an operator's own machine.
        // Tell the browser to render them as their declared type and nothing else.
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleRouteError(error, "uploads/serve");
  }
}

/**
 * A lean read gives back whatever BSON produced — a Node `Buffer` in most
 * cases, a driver `Binary` wrapper in others. Normalise both.
 */
function toBuffer(value: unknown): Buffer | null {
  if (Buffer.isBuffer(value)) return value;

  const binary = value as { buffer?: unknown } | null;
  if (binary && Buffer.isBuffer(binary.buffer)) return binary.buffer;
  if (binary?.buffer instanceof ArrayBuffer) return Buffer.from(binary.buffer);
  if (value instanceof Uint8Array) return Buffer.from(value);

  return null;
}
