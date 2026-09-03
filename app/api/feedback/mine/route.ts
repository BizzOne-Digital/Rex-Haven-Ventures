import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Feedback, type FeedbackDocument } from "@/lib/db/models/Feedback";
import { handleRouteError, ok, requireUser } from "@/lib/api";
import { toMySubmission } from "@/lib/feedback-view";

/**
 * GET /api/feedback/mine — the signed-in member's own submissions.
 *
 * Scoped by the session's account id, never by a client-supplied one, so a
 * member cannot read anyone else's queue. Includes every status: this is where
 * members find out whether their contribution was published.
 */
export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    await connectToDatabase();
    const items = await Feedback.find({ author: new Types.ObjectId(user.id) })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean<FeedbackDocument[]>();

    const counts = items.reduce(
      (acc, item) => {
        if (item.status === "pending") acc.pending += 1;
        else if (item.status === "approved") acc.approved += 1;
        else if (item.status === "rejected") acc.rejected += 1;
        acc.total += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0, total: 0 },
    );

    return ok({ items: items.map(toMySubmission), counts });
  } catch (error) {
    return handleRouteError(error, "feedback/mine");
  }
}
