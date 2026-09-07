import { connectToDatabase } from "@/lib/db/mongoose";
import { Service } from "@/lib/db/models/Service";
import { errors, handleRouteError, ok, readJson, requireAdmin } from "@/lib/api";
import {
  getAllServices,
  getPublishedServices,
  revalidateServices,
  seedDefaultServices,
  toAdminService,
} from "@/lib/service-source";
import { buildServicePayload } from "@/lib/service-payload";
import { slugify } from "@/lib/sanitize";
import {
  emptyServiceValues,
  hasServiceErrors,
  validateService,
  type ServiceValues,
} from "@/lib/service-validation";

/**
 * Services.
 *
 *   GET  /api/services            — public list (published only)
 *   GET  /api/services?detail=1   — every service, drafts included (admin only)
 *   POST /api/services            — create one (admin only)
 *   POST /api/services?seed=1     — import the built-in services (admin only)
 *
 * The public shape omits `published` and `showOnHome` entirely: a visitor has
 * no business knowing a service exists but is being held back.
 */

export const runtime = "nodejs";

export async function GET(request: Request) {
  const wantsDetail = new URL(request.url).searchParams.get("detail") === "1";

  try {
    if (!wantsDetail) {
      const items = await getPublishedServices();
      return ok({ items, total: items.length });
    }

    const { response } = await requireAdmin();
    if (response) return response;

    const items = await getAllServices();
    return ok({ items, total: items.length });
  } catch (error) {
    return handleRouteError(error, "services/list");
  }
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  // Seeding is a different operation on the same collection, and giving it its
  // own verb-shaped route would be a route for a button pressed once.
  if (new URL(request.url).searchParams.get("seed") === "1") {
    try {
      const seeded = await seedDefaultServices();
      if (seeded > 0) revalidateServices();
      return ok({ ok: true, seeded });
    } catch (error) {
      return handleRouteError(error, "services/seed");
    }
  }

  const body = await readJson<Partial<ServiceValues>>(request);
  if (!body) return errors.badRequest();

  const values: ServiceValues = { ...emptyServiceValues, ...body };
  if (!values.slug.trim()) values.slug = slugify(values.title);

  const fieldErrors = validateService(values);
  if (hasServiceErrors(fieldErrors)) {
    return errors.validation(fieldErrors as Record<string, string>);
  }

  try {
    await connectToDatabase();

    const payload = buildServicePayload(values);

    if (await Service.exists({ slug: payload.slug })) {
      return errors.validation(
        { slug: "A service with that slug already exists." },
        "That slug is already in use.",
      );
    }

    const created = await Service.create(payload);
    revalidateServices();

    // Position is recomputed by the next listing; 0 is a placeholder that the
    // admin screen immediately replaces when it reloads.
    return ok({ ok: true, service: toAdminService(created, 0) }, 201);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return errors.conflict("That slug is already in use.");
    }
    return handleRouteError(error, "services/create");
  }
}
