import "server-only";
import mongoose, { Schema, type Model, type Types } from "mongoose";

/**
 * Blog category.
 *
 * Posts reference a category by its **name**, not its id. That is deliberate:
 * `BlogPost.category` is a plain string so the existing article components
 * (ArticleCard, BlogIndex, FeaturedArticle) keep rendering it unchanged, and a
 * post survives its category being deleted rather than becoming unreadable.
 *
 * The trade-off is that renaming a category has to update the posts that carry
 * the old name — the PATCH handler does exactly that, in the same request.
 */

export type CategoryDocument = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  /** Manual ordering for the public filter row; ties break on name. */
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Name is the join key with BlogPost.category, so it must be unique.
CategorySchema.index({ name: 1 }, { unique: true });
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ order: 1, name: 1 });

export const Category: Model<CategoryDocument> =
  (mongoose.models.Category as Model<CategoryDocument>) ??
  mongoose.model<CategoryDocument>("Category", CategorySchema);
