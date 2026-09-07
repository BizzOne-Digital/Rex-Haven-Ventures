import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Service } from "@/lib/db/models/Service";
import { errors, handleRouteError, ok, readJson, requireAdmin } from "@/lib/api";
import { revalidateServices, toAdminService } from "@/lib/service-source";
import { buildServicePayload } from "@/lib/service-payload";
import { replaceUploadUrl, deleteUploadByUrl } from "@/lib/uploads";
import { slugify } from "@/lib/sanitize";
import {
  hasServiceErrors,
  validateService,
  type ServiceValues,
} from "@/lib/service-validation";

/**
 * A single service.
 *
 *   PATCH  /api/services/:id — edit it, or flip `published` / `showOnHome`
 *   DELETE /api/services/:id — remove it
 *
 * PATCH accepts a partial body, so the admin list's visibility toggles can send
 * `{ showOnHome: false }` on its own without round-tripping the whole record.
 *
 * Both operations clean up the panel image when it stops being referenced. The
 * URL is the only pointer to those bytes, so dropping it without deleting the
 * blob would orphan it permanently.
 */

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: RouteContext<"/api/services/[id]">) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return errors.notFound("We couldn't find that service.");

  const body = await readJson<Partial<ServiceValues>>(request);
  if (!body) return errors.badRequest();

  try {
    await connectToDatabase();
    const service = await Service.findById(id);
    if (!service) return errors.notFound("We couldn't find that service.");

    // Merge onto what is stored, so a partial body edits only what it names.
    const values: ServiceValues = {
      title: body.title ?? service.title,
      slug: body.slug ?? service.slug,
      icon: body.icon ?? service.icon,
      tagline: body.tagline ?? service.tagline,
      summary: body.summary ?? service.summary,
      intro: body.intro ?? service.intro,
      valueProp: body.valueProp ?? service.valueProp ?? "",
      involves: body.involves ?? (service.involves ?? []).join("\n"),
      forWho: body.forWho ?? service.forWho ?? "",
      ctaLabel: body.ctaLabel ?? service.ctaLabel,
      ctaHref: body.ctaHref ?? service.ctaHref,
      image: body.image ?? service.image ?? "",
      order: body.order ?? String(service.order),
      showOnHome: body.showOnHome ?? service.showOnHome,
      published: body.published ?? service.published,
    };
    if (!values.slug.trim()) values.slug = slugify(values.title);

    const fieldErrors = validateService(values);
    if (hasServiceErrors(fieldErrors)) {
      return errors.validation(fieldErrors as Record<string, string>);
    }

    const payload = buildServicePayload(values);

    if (
      payload.slug !== service.slug &&
      (await Service.exists({ slug: payload.slug, _id: { $ne: service._id } }))
    ) {
      return errors.validation(
        { slug: "A service with that slug already exists." },
        "That slug is already in use.",
      );
    }

    const previousImage = service.image;

    service.set(payload);
    // `set` skips undefined, so clearing the image has to be explicit.
    if (!payload.image) service.image = undefined;
    await service.save();

    // Only after the save succeeds — an image removed ahead of a failed write
    // would leave the record pointing at bytes that are already gone.
    await replaceUploadUrl(previousImage, payload.image);

    revalidateServices();
    return ok({ ok: true, service: toAdminService(service, 0) });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return errors.conflict("That slug is already in use.");
    }
    return handleRouteError(error, "services/update");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/services/[id]">) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return errors.notFound("We couldn't find that service.");

  try {
    await connectToDatabase();
    const service = await Service.findById(id);
    if (!service) return errors.notFound("We couldn't find that service.");

    const image = service.image;
    await service.deleteOne();

    if (image) {
      try {
        await deleteUploadByUrl(image);
      } catch (error) {
        // The record is gone either way; an orphaned blob is not worth
        // reporting a failed delete for.
        console.error("[services/delete] could not remove the panel image:", error);
      }
    }

    revalidateServices();
    return ok({ ok: true });
  } catch (error) {
    return handleRouteError(error, "services/delete");
  }
}
