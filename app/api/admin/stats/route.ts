import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { BlogPost } from "@/lib/db/models/BlogPost";
import { Feedback } from "@/lib/db/models/Feedback";
import { handleRouteError, ok, requireAdmin } from "@/lib/api";

/**
 * GET /api/admin/stats — dashboard counters.
 *
 * All counts run as `countDocuments` against indexed fields rather than
 * fetching documents, so the dashboard stays cheap as the collections grow.
 */
export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    await connectToDatabase();

    const [
      totalUsers,
      activeUsers,
      members,
      admins,
      totalPosts,
      publishedPosts,
      draftPosts,
      pendingFeedback,
      approvedFeedback,
      rejectedFeedback,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: "member" }),
      User.countDocuments({ role: "admin" }),
      BlogPost.countDocuments({}),
      BlogPost.countDocuments({ status: "published" }),
      BlogPost.countDocuments({ status: "draft" }),
      Feedback.countDocuments({ status: "pending" }),
      Feedback.countDocuments({ status: "approved" }),
      Feedback.countDocuments({ status: "rejected" }),
    ]);

    return ok({
      users: { total: totalUsers, active: activeUsers, members, admins },
      posts: { total: totalPosts, published: publishedPosts, drafts: draftPosts },
      feedback: {
        pending: pendingFeedback,
        approved: approvedFeedback,
        rejected: rejectedFeedback,
        total: pendingFeedback + approvedFeedback + rejectedFeedback,
      },
    });
  } catch (error) {
    return handleRouteError(error, "admin/stats");
  }
}
