import "server-only";
import mongoose, { Schema, type Model, type Types } from "mongoose";

/**
 * An uploaded image.
 *
 * This record is the index over the bytes (original name, size, dimensions, who
 * uploaded it). The bytes themselves are a `StoredUpload` document, addressed
 * by (`folder`, `filename`) and served from `/api/uploads/:folder/:filename`.
 *
 * `provider` is stored per image rather than inferred, because three
 * generations of records coexist: `mongo` for everything written now,
 * `cloudinary` for images uploaded while that integration existed, and `local`
 * (or no value at all) for the oldest, written to a filesystem that is gone.
 * `lib/media.ts` dispatches deletes on it.
 */

export type MediaDocument = {
  _id: Types.ObjectId;
  /**
   * Which back end holds the bytes. Absent on the oldest records, which
   * `lib/media.ts` treats as `"local"`.
   */
  provider?: "mongo" | "cloudinary" | "local";
  /** Upload folder the bytes are filed under. Present on `mongo` records. */
  folder?: string;
  /** Stored filename, unique and URL-safe. Half of a stored upload's address. */
  filename: string;
  /** Name the file arrived with, shown in the library. */
  originalName: string;
  mimeType: string;
  /** Bytes. */
  size: number;
  /**
   * Public URL — `/api/uploads/gallery/1757000000000-a1b2c3.jpg`. This is the
   * value blog posts reference as `coverImage`.
   */
  url: string;
  /** Legacy Cloudinary asset identifier. Only on records from that era. */
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
    provider: { type: String, enum: ["mongo", "cloudinary", "local"] },
    folder: { type: String, trim: true },
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
