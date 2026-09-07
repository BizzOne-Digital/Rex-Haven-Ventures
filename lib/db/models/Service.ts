import "server-only";
import mongoose, { Schema, type Model, type Types } from "mongoose";
import { SERVICE_ICONS, type ServiceIcon } from "@/lib/service-types";

/**
 * A service offering.
 *
 * These were a hard-coded array in `lib/services.ts`, which meant changing the
 * homepage's "What We Do" grid took a deploy. They are now records, with two
 * independent switches so an administrator can stage work without publishing
 * it and curate the homepage without hiding a service entirely:
 *
 *   published   off  →  hidden from the whole public site
 *   showOnHome  off  →  on /services, but not in the homepage grid
 *
 * `lib/services.ts` survives as the seed content and as the fallback the public
 * pages render when the collection is empty or the database is unreachable, so
 * the site never comes up with an empty services section.
 */

export type ServiceDocument = {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  icon: ServiceIcon;
  tagline: string;
  summary: string;
  intro: string;
  valueProp?: string;
  involves: string[];
  forWho?: string;
  ctaLabel: string;
  ctaHref: string;
  /** Panel image URL — an `/api/uploads/...` path. Empty means built-in artwork. */
  image?: string;
  order: number;
  showOnHome: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const ServiceSchema = new Schema<ServiceDocument>(
  {
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    icon: { type: String, required: true, enum: SERVICE_ICONS, default: "compass" },
    tagline: { type: String, required: true, trim: true, maxlength: 120 },
    summary: { type: String, required: true, trim: true, maxlength: 300 },
    intro: { type: String, required: true, trim: true, maxlength: 2000 },
    valueProp: { type: String, trim: true, maxlength: 600 },
    involves: { type: [String], default: [] },
    forWho: { type: String, trim: true, maxlength: 400 },
    ctaLabel: { type: String, required: true, trim: true, maxlength: 40 },
    ctaHref: { type: String, required: true, trim: true, maxlength: 300 },
    image: { type: String, trim: true, maxlength: 500 },
    order: { type: Number, default: 0 },
    showOnHome: { type: Boolean, default: true },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

ServiceSchema.index({ slug: 1 }, { unique: true });
// Every public and admin listing reads in this order.
ServiceSchema.index({ order: 1, title: 1 });

export const Service: Model<ServiceDocument> =
  (mongoose.models.Service as Model<ServiceDocument>) ??
  mongoose.model<ServiceDocument>("Service", ServiceSchema);
