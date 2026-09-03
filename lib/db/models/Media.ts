import "server-only";
import mongoose, { Schema, type Model, type Types } from "mongoose";

/**
 * An uploaded image.
 *
 * This record is the index over the bytes (original name, size, dimensions, who
 * uploaded it); `lib/media.ts` decides where the bytes themselves live —
 * Cloudinary when it is configured, `public/uploads` otherwise.
 *
 * `provider` is stored per image rather than inferred from the current
 * environment, because the two coexist: images uploaded before Cloudinary was
 * switched on still sit on disk, and their deletes must still go there. Records
 * predating this field have no `provider` and are read as local.
 */

export type MediaDocument = {
  _id: Types.ObjectId;
  /**
   * Which back end holds the bytes. Absent on records written before Cloudinary
   * support existed, which `lib/media.ts` treats as `"local"`.
   */
  provider?: "cloudinary" | "local";
  /** Stored filename, unique and URL-safe. Also the stem of the Cloudinary public id. */
  filename: string;
  /** Name the file arrived with, shown in the library. */
  originalName: string;
  mimeType: string;
  /** Bytes. */
  size: number;
  /**
   * Public URL — a Cloudinary `secure_url`, or `/uploads/2026-09-abc123.jpg`
   * for a local file. This is the value blog posts reference as `coverImage`.
   */
  url: string;
  /** Cloudinary asset identifier, used to delete it. Absent for local files. */
  publicId?: string;
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
    provider: { type: String, enum: ["cloudinary", "local"] },
    filename: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
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
