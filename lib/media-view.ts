import "server-only";
import type { MediaDocument } from "@/lib/db/models/Media";
import type { MediaItem } from "@/lib/media-types";

/** Projection of a Media document for the admin library. */
export function toMediaItem(doc: MediaDocument, usedByPosts = 0): MediaItem {
  return {
    id: String(doc._id),
    filename: doc.filename,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    size: doc.size,
    url: doc.url,
    width: doc.width ?? null,
    height: doc.height ?? null,
    alt: doc.alt ?? "",
    usedByPosts,
    createdAt: doc.createdAt.toISOString(),
  };
}
