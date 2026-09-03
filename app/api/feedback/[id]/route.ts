import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Feedback } from "@/lib/db/models/Feedback";
import { errors, handleRouteError, ok, readJson, requireUser } from "@/lib/api";
import { normalizeParagraphs } from "@/lib/sanitize";
import { toMySubmission } from "@/lib/feedback-view";
import { validateFeedback, hasFeedbackErrors } from "@/lib/feedback-validation";

/**
 * A member's own submission.
 *
 *   PATCH  /api/feedback/:id — edit the text while it is still pending
 *   DELETE /api/feedback/:id — withdraw it
 *
 * Ownership is enforced in the query filter itself (`author: session id`), not
 * with a fetch-then-compare, so there is no window in which another member's
 * record is loaded at all. A non-owner gets 404 — indistinguishable from a
 * record that doesn't exist, which is what we want.
 */

async function loadOwned(id: string, userId: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  return Feedback.findOne({
    _id: new Types.ObjectId(id),
    author: new Types.ObjectId(userId),
  });
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/feedback/[id]">) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const body = await readJson<{ body?: string; kind?: string }>(request);
  if (!body) return errors.badRequest();

  try {
    const submission = await loadOwned(id, user.id);
    if (!submission) return errors.notFound("We couldn't find that submission.");

    // Approved text is already public and rejected text has been ruled on;
    // editing either would bypass moderation.
    if (submission.status !== "pending") {
      return errors.forbidden(
        submission.status === "approved"
          ? "This contribution has already been published and can no longer be edited."
          : "This contribution has already been reviewed and can no longer be edited.",
      );
    }

    const values = {
      kind: String(body.kind ?? submission.kind),
      body: normalizeParagraphs(String(body.body ?? submission.body)),
    };

    const fieldErrors = validateFeedback(values);
    if (hasFeedbackErrors(fieldErrors)) {
      return errors.validation(fieldErrors as Record<string, string>);
    }

    submission.kind = values.kind;
    submission.body = values.body;
    await submission.save();

    return ok({ ok: true, submission: toMySubmission(submission) });
  } catch (error) {
    return handleRouteError(error, "feedback/update");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/feedback/[id]">) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { id } = await params;

  try {
    const submission = await loadOwned(id, user.id);
    if (!submission) return errors.notFound("We couldn't find that submission.");

    await submission.deleteOne();
    return ok({ ok: true });
  } catch (error) {
    return handleRouteError(error, "feedback/delete");
  }
}
