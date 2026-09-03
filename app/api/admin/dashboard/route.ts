import { connectToDatabase } from "@/lib/db/mongoose";
import { User, type UserDocument } from "@/lib/db/models/User";
import { BlogPost, type BlogPostDocument } from "@/lib/db/models/BlogPost";
import { Feedback, type FeedbackDocument } from "@/lib/db/models/Feedback";
import { Category } from "@/lib/db/models/Category";
import { Media } from "@/lib/db/models/Media";
import { handleRouteError, ok, requireAdmin } from "@/lib/api";

/**
 * GET /api/admin/dashboard — counters plus recent activity.
 *
 * Supersedes `/api/admin/stats`, which remains for the statistics-only case.
 * Counts use `countDocuments` against indexed fields; the activity feeds are
 * capped, projected queries rather than full document reads.
 */

const RECENT_LIMIT = 5;

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    await connectToDatabase();

    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      totalUsers,
      activeUsers,
      members,
      admins,
      pendingFeedback,
      approvedFeedback,
      rejectedFeedback,
      totalCategories,
      totalMedia,
      recentPosts,
      recentMembers,
      recentFeedback,
    ] = await Promise.all([
      BlogPost.countDocuments({}),
      BlogPost.countDocuments({ status: "published" }),
      BlogPost.countDocuments({ status: "draft" }),
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: "member" }),
      User.countDocuments({ role: "admin" }),
      Feedback.countDocuments({ status: "pending" }),
      Feedback.countDocuments({ status: "approved" }),
      Feedback.countDocuments({ status: "rejected" }),
      Category.countDocuments({}),
      Media.countDocuments({}),

      BlogPost.find({ status: "published" })
        .sort({ date: -1, createdAt: -1 })
        .limit(RECENT_LIMIT)
        .select("title slug category date status")
        .lean<Pick<BlogPostDocument, "_id" | "title" | "slug" | "category" | "date" | "status">[]>(),

      User.find({})
        .sort({ createdAt: -1 })
        .limit(RECENT_LIMIT)
        .select("name email role isActive createdAt")
        .lean<
          Pick<UserDocument, "_id" | "name" | "email" | "role" | "isActive" | "createdAt">[]
        >(),

      Feedback.find({})
        .sort({ createdAt: -1 })
        .limit(RECENT_LIMIT)
        .select("authorName postTitle postSlug kind status body createdAt")
        .lean<
          Pick<
            FeedbackDocument,
            | "_id"
            | "authorName"
            | "postTitle"
            | "postSlug"
            | "kind"
            | "status"
            | "body"
            | "createdAt"
          >[]
        >(),
    ]);

    return ok({
      stats: {
        posts: { total: totalPosts, published: publishedPosts, drafts: draftPosts },
        users: { total: totalUsers, active: activeUsers, members, admins },
        feedback: {
          pending: pendingFeedback,
          approved: approvedFeedback,
          rejected: rejectedFeedback,
          total: pendingFeedback + approvedFeedback + rejectedFeedback,
        },
        categories: totalCategories,
        media: totalMedia,
      },
      recent: {
        posts: recentPosts.map((post) => ({
          id: String(post._id),
          title: post.title,
          slug: post.slug,
          category: post.category,
          date: post.date,
          status: post.status,
        })),
        members: recentMembers.map((user) => ({
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
        })),
        feedback: recentFeedback.map((item) => ({
          id: String(item._id),
          authorName: item.authorName,
          postTitle: item.postTitle,
          postSlug: item.postSlug,
          kind: item.kind,
          status: item.status,
          // Enough to recognise the submission without rendering the whole thing.
          excerpt: item.body.slice(0, 140),
          createdAt: item.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    return handleRouteError(error, "admin/dashboard");
  }
}
