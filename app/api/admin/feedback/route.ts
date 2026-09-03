import { connectToDatabase } from "@/lib/db/mongoose";
import { Feedback, type FeedbackDocument } from "@/lib/db/models/Feedback";
import { handleRouteError, ok, requireAdmin } from "@/lib/api";
import { toAdminFeedback } from "@/lib/feedback-view";
import { feedbackStatuses } from "@/lib/blog-schema";
import { containsRegex } from "@/lib/regex-escape";

/**
 * GET /api/admin/feedback — the moderation queue.
 *
 * Query: `?status=all|pending|approved|rejected`, `?q=` (author, article or
 * body text), `?page=`. Counts for every status come back with each response so
 * the filter tabs can show totals without a second round trip.
 */

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.trim() ?? "pending";
  const q = url.searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);

  try {
    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    if ((feedbackStatuses as readonly string[]).includes(status)) filter.status = status;
    if (q) {
      const safe = containsRegex(q);
      filter.$or = [
        { authorName: safe },
        { authorEmail: safe },
        { postTitle: safe },
        { postSlug: safe },
        { body: safe },
      ];
    }

    const [items, total, pending, approved, rejected] = await Promise.all([
      Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean<FeedbackDocument[]>(),
      Feedback.countDocuments(filter),
      Feedback.countDocuments({ status: "pending" }),
      Feedback.countDocuments({ status: "approved" }),
      Feedback.countDocuments({ status: "rejected" }),
    ]);

    return ok({
      items: items.map(toAdminFeedback),
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      counts: {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected,
      },
    });
  } catch (error) {
    return handleRouteError(error, "admin/feedback/list");
  }
}
