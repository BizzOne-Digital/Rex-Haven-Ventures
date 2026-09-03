import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Feedback } from "@/lib/db/models/Feedback";
import { errors, handleRouteError, ok, readJson, requireAdmin } from "@/lib/api";
import { toAdminFeedback } from "@/lib/feedback-view";
import { sanitizeText } from "@/lib/sanitize";
import { revalidateBlog } from "@/lib/post-payload";
import { feedbackStatuses } from "@/lib/blog-schema";

/**
 * Moderating one submission.
 *
 *   PATCH  /api/admin/feedback/:id — approve / reject / return to pending
 *   DELETE /api/admin/feedback/:id — remove it outright
 *
 * Approving is the only thing that makes a submission publicly readable, so the
 * article page is revalidated on every status change — including a reversal,
 * which has to take an already-published contribution back down.
 */

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/feedback/[id]">) {
  const { user: admin, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return errors.notFound("We couldn't find that submission.");

  const body = await readJson<{ status?: string; moderationNote?: string }>(request);
  if (!body) return errors.badRequest();

  const status = String(body.status ?? "");
  if (!(feedbackStatuses as readonly string[]).includes(status)) {
    return errors.validation({
      status: "Status must be pending, approved or rejected.",
    });
  }

  try {
    await connectToDatabase();
    const submission = await Feedback.findById(id);
    if (!submission) return errors.notFound("We couldn't find that submission.");

    submission.status = status;
    submission.moderatedBy = new Types.ObjectId(admin.id);
    submission.moderatedAt = new Date();

    if (typeof body.moderationNote === "string") {
      const note = sanitizeText(body.moderationNote).slice(0, 500);
      submission.moderationNote = note || undefined;
    }

    await submission.save();
    revalidateBlog([submission.postSlug]);

    return ok({ ok: true, submission: toAdminFeedback(submission) });
  } catch (error) {
    return handleRouteError(error, "admin/feedback/moderate");
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/admin/feedback/[id]">,
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return errors.notFound("We couldn't find that submission.");

  try {
    await connectToDatabase();
    const submission = await Feedback.findById(id);
    if (!submission) return errors.notFound("We couldn't find that submission.");

    const { postSlug, status } = submission;
    await submission.deleteOne();

    // Only an approved submission was on the public page, so that's the only
    // case where the article's cached HTML is now wrong.
    if (status === "approved") revalidateBlog([postSlug]);

    return ok({ ok: true });
  } catch (error) {
    return handleRouteError(error, "admin/feedback/delete");
  }
}
