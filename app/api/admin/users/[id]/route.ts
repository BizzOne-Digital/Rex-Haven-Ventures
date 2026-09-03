import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User, type UserDocument } from "@/lib/db/models/User";
import { Feedback, type FeedbackDocument } from "@/lib/db/models/Feedback";
import { errors, handleRouteError, ok, readJson, requireAdmin } from "@/lib/api";
import { toSafeUser } from "@/lib/auth/session";
import { toAdminFeedback } from "@/lib/feedback-view";
import { sanitizeText } from "@/lib/sanitize";
import { NAME_MAX_LENGTH, NAME_MIN_LENGTH } from "@/lib/auth-validation";

/**
 * A single account, for administrators.
 *
 *   GET    /api/admin/users/:id — details plus that member's submissions
 *   PATCH  /api/admin/users/:id — rename, activate/deactivate, change role
 *   DELETE /api/admin/users/:id — remove the account and its submissions
 *
 * Two self-protection rules apply, both to avoid an unrecoverable state:
 * an admin cannot deactivate, demote or delete their own account.
 */

export async function GET(_request: Request, { params }: RouteContext<"/api/admin/users/[id]">) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return errors.notFound("We couldn't find that user.");

  try {
    await connectToDatabase();
    const user = await User.findById(id).lean<UserDocument | null>();
    if (!user) return errors.notFound("We couldn't find that user.");

    const submissions = await Feedback.find({ author: user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean<FeedbackDocument[]>();

    return ok({
      user: toSafeUser(user),
      submissions: submissions.map(toAdminFeedback),
    });
  } catch (error) {
    return handleRouteError(error, "admin/users/get");
  }
}

type UpdateBody = { name?: string; isActive?: boolean; role?: string };

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/users/[id]">) {
  const { user: admin, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return errors.notFound("We couldn't find that user.");

  const body = await readJson<UpdateBody>(request);
  if (!body) return errors.badRequest();

  const isSelf = admin.id === id;

  try {
    await connectToDatabase();
    const user = await User.findById(id);
    if (!user) return errors.notFound("We couldn't find that user.");

    if (typeof body.name === "string") {
      const name = sanitizeText(body.name).trim();
      if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
        return errors.validation({
          name: `Please enter a name between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters.`,
        });
      }
      user.name = name;
    }

    if (typeof body.isActive === "boolean") {
      if (isSelf && !body.isActive) {
        return errors.forbidden("You can't deactivate your own administrator account.");
      }
      user.isActive = body.isActive;
    }

    if (typeof body.role === "string") {
      if (body.role !== "member" && body.role !== "admin") {
        return errors.validation({ role: "Role must be either member or admin." });
      }
      if (isSelf && body.role !== "admin") {
        return errors.forbidden("You can't remove your own administrator access.");
      }
      user.role = body.role;
    }

    await user.save();
    return ok({ ok: true, user: toSafeUser(user) });
  } catch (error) {
    return handleRouteError(error, "admin/users/update");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/users/[id]">) {
  const { user: admin, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return errors.notFound("We couldn't find that user.");
  if (admin.id === id) {
    return errors.forbidden("You can't delete your own administrator account.");
  }

  try {
    await connectToDatabase();
    const user = await User.findById(id);
    if (!user) return errors.notFound("We couldn't find that user.");

    // Remove their submissions too — leaving them orphaned would keep the
    // member's name and email visible in the moderation queue after deletion.
    const { deletedCount } = await Feedback.deleteMany({ author: user._id });
    await user.deleteOne();

    return ok({ ok: true, deletedSubmissions: deletedCount ?? 0 });
  } catch (error) {
    return handleRouteError(error, "admin/users/delete");
  }
}
