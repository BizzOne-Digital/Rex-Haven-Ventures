import "server-only";
import mongoose, { Schema, type Model, type Types } from "mongoose";
import { UPLOAD_FOLDERS, type UploadFolder } from "@/lib/upload-types";

/**
 * The bytes behind an uploaded image.
 *
 * Uploads live in MongoDB rather than on the filesystem because the site is
 * deployed to a serverless host: `public/uploads` is read-only there, and even
 * where it is writable the directory is thrown away on the next deploy. A
 * document per file survives both.
 *
 * The pair (`folder`, `filename`) is the address — it is exactly what
 * `/api/uploads/:folder/:filename` resolves — and is unique, so a generated
 * name can never silently overwrite an existing image.
 *
 * `data` is a binary blob, so keep queries that list uploads projected away
 * from it (`.select("-data")`); loading a page of images otherwise pulls every
 * byte of every one of them into memory.
 */

export type StoredUploadDocument = {
  _id: Types.ObjectId;
  folder: UploadFolder;
  /** Generated, collision-proof, and never derived from the client's name. */
  filename: string;
  mimeType: string;
  /** Bytes. Mirrors `data.length`, kept as a field so listings can skip `data`. */
  size: number;
  data: Buffer;
  createdAt: Date;
  updatedAt: Date;
};

const StoredUploadSchema = new Schema<StoredUploadDocument>(
  {
    folder: { type: String, required: true, enum: UPLOAD_FOLDERS },
    filename: { type: String, required: true, trim: true, maxlength: 200 },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
    data: { type: Buffer, required: true },
  },
  { timestamps: true },
);

// The public URL's two segments. Unique so a name collision fails loudly at
// write time instead of serving the wrong image later.
StoredUploadSchema.index({ folder: 1, filename: 1 }, { unique: true });
StoredUploadSchema.index({ createdAt: -1 });

export const StoredUpload: Model<StoredUploadDocument> =
  (mongoose.models.StoredUpload as Model<StoredUploadDocument>) ??
  mongoose.model<StoredUploadDocument>("StoredUpload", StoredUploadSchema);
