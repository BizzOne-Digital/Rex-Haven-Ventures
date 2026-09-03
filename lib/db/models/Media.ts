import "server-only";
import mongoose, { Schema, type Model, type Types } from "mongoose";

/**
 * An uploaded image.
 *
 * The bytes live on the local filesystem under `public/uploads`; this record is
 * the index over them (original name, size, dimensions, who uploaded it). That
 * keeps the feature dependency-free and works on any Node host, including the
 * project's current setup.
 *
 * It does NOT survive an ephemeral filesystem — a serverless deploy (Vercel,
 * Netlify functions) resets `public/uploads` on every build. `lib/media.ts`
 * documents the environment variables needed to move the bytes to Cloudinary or
 * S3 while keeping this collection as the index.
 */

export type MediaDocument = {
  _id: Types.ObjectId;
  /** Stored filename, unique and URL-safe. */
  filename: string;
  /** Name the file arrived with, shown in the library. */
  originalName: string;
  mimeType: string;
  /** Bytes. */
  size: number;
  /** Public URL, e.g. `/uploads/2026-09-abc123.jpg`. */
  url: string;
  width?: number;
  height?: number;
  /** Optional alt text, used when the image is a post's featured image. */
  alt?: string;
  uploadedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const MediaSchema = new Schema<MediaDocument>(
  {
    filename: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true, maxlength: 255 },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
    url: { type: String, required: true, trim: true },
    width: { type: Number },
    height: { type: Number },
    alt: { type: String, trim: true, maxlength: 300 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

MediaSchema.index({ filename: 1 }, { unique: true });
// Library listing: newest first.
MediaSchema.index({ createdAt: -1 });
// "Is this image still in use?" checks resolve a post by its coverImage URL.
MediaSchema.index({ url: 1 });

export const Media: Model<MediaDocument> =
  (mongoose.models.Media as Model<MediaDocument>) ??
  mongoose.model<MediaDocument>("Media", MediaSchema);
