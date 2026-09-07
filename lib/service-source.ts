import "server-only";
import { revalidatePath } from "next/cache";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db/mongoose";
import { Service, type ServiceDocument } from "@/lib/db/models/Service";
import { services as builtInServices } from "@/lib/services";
import { resolveImageUrl } from "@/lib/image-url";
import type { AdminService, PublicService, ServiceIcon } from "@/lib/service-types";

/**
 * Service resolution, mirroring `lib/category-source.ts`.
 *
 * Database first, the built-in array in `lib/services.ts` as the fallback — so
 * the homepage's "What We Do" grid and the Services page keep rendering before
 * anything has been created in the admin, and if the database is unreachable.
 * A visitor should never meet an empty services section because of an
 * infrastructure problem.
 */

/** Display numbers are positional, so hiding a service renumbers the rest. */
function withIndexes(items: Omit<PublicService, "index">[]): PublicService[] {
  return items.map((item, position) => ({
    ...item,
    index: String(position + 1).padStart(2, "0"),
  }));
}

function toPublicShape(doc: ServiceDocument): Omit<PublicService, "index"> {
  return {
    id: String(doc._id),
    slug: doc.slug,
    icon: doc.icon,
    title: doc.title,
    tagline: doc.tagline,
    summary: doc.summary,
    intro: doc.intro,
    valueProp: doc.valueProp ?? "",
    involves: doc.involves ?? [],
    forWho: doc.forWho ?? "",
    // A record written before uploads moved into MongoDB points at bytes that
    // are gone; render the placeholder rather than a broken panel.
    image: resolveImageUrl(doc.image),
    cta: { label: doc.ctaLabel, href: doc.ctaHref },
  };
}

export function toAdminService(doc: ServiceDocument, position: number): AdminService {
  return {
    ...toPublicShape(doc),
    index: String(position + 1).padStart(2, "0"),
    order: doc.order,
    showOnHome: doc.showOnHome,
    published: doc.published,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** The built-in array, in the same shape the database records produce. */
function builtInFallback(): Omit<PublicService, "index">[] {
  return builtInServices.map((service) => ({
    id: service.id,
    slug: service.slug,
    icon: service.icon as ServiceIcon,
    title: service.title,
    tagline: service.tagline,
    summary: service.summary,
    intro: service.intro,
    valueProp: service.valueProp,
    involves: service.involves,
    forWho: service.forWho,
    image: null,
    cta: service.cta,
  }));
}

async function readPublished(filter: Record<string, unknown> = {}): Promise<PublicService[]> {
  if (!isDatabaseConfigured()) return withIndexes(builtInFallback());

  try {
    await connectToDatabase();
    const docs = await Service.find({ published: true, ...filter })
      .sort({ order: 1, title: 1 })
      .lean<ServiceDocument[]>();

    // An empty collection means "not seeded yet", not "no services offered".
    // Every service being hidden, though, is a deliberate choice — respect it,
    // which is only distinguishable by checking whether any record exists.
    if (docs.length === 0) {
      const total = await Service.estimatedDocumentCount();
      if (total === 0) return withIndexes(builtInFallback());
      return [];
    }

    return withIndexes(docs.map(toPublicShape));
  } catch (error) {
    console.error("[service-source] falling back to built-in services:", error);
    return withIndexes(builtInFallback());
  }
}

/** Everything published, for the Services page. */
export function getPublishedServices(): Promise<PublicService[]> {
  return readPublished();
}

/** Published *and* flagged for the homepage grid. */
export function getHomeServices(): Promise<PublicService[]> {
  return readPublished({ showOnHome: true });
}

/** Every service, drafts included, for the admin screen. */
export async function getAllServices(): Promise<AdminService[]> {
  await connectToDatabase();
  const docs = await Service.find({}).sort({ order: 1, title: 1 }).lean<ServiceDocument[]>();
  return docs.map(toAdminService);
}

/**
 * Creates the built-in services if the collection is empty. Idempotent —
 * existing slugs are skipped, never overwritten, so running it again cannot
 * clobber an administrator's edits.
 */
export async function seedDefaultServices(): Promise<number> {
  await connectToDatabase();

  const existing = new Set(
    (await Service.find({}).select("slug").lean<{ slug: string }[]>()).map((s) => s.slug),
  );

  const toInsert = builtInServices
    .filter((service) => !existing.has(service.slug))
    .map((service, position) => ({
      slug: service.slug,
      title: service.title,
      icon: service.icon as ServiceIcon,
      tagline: service.tagline,
      summary: service.summary,
      intro: service.intro,
      valueProp: service.valueProp,
      involves: service.involves,
      forWho: service.forWho,
      ctaLabel: service.cta.label,
      ctaHref: service.cta.href,
      order: existing.size + position,
      // The original homepage grid is a four-column row; seeding all six into
      // it would reflow the design. The first four match what shipped.
      showOnHome: existing.size + position < 4,
      published: true,
    }));

  if (toInsert.length === 0) return 0;
  await Service.insertMany(toInsert, { ordered: false });
  return toInsert.length;
}

/**
 * Invalidates every cached surface that renders services.
 *
 * The homepage grid, the Services page and the footer's "What We Do" column all
 * read from here, and all three are statically generated — without this an
 * admin edit wouldn't appear until the next deploy.
 */
export function revalidateServices(): void {
  revalidatePath("/", "layout"); // the footer renders on every page
  revalidatePath("/services");
}
