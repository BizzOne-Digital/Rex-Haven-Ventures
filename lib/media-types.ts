/**
 * Wire shape for uploaded images. Pure types, no imports.
 */

export type MediaItem = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  width: number | null;
  height: number | null;
  alt: string;
  /** How many blog posts currently use this image as their featured image. */
  usedByPosts: number;
  createdAt: string;
};
