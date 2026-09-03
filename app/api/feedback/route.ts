import { Types } from "mongoose";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db/mongoose";
import { Feedback, type FeedbackDocument } from "@/lib/db/models/Feedback";
import { BlogPost, type BlogPostDocument } from "@/lib/db/models/BlogPost";
import { errors, handleRouteError, ok, readJson, requireUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { normalizeParagraphs } from "@/lib/sanitize";
import { articles as builtInArticles } from "@/lib/articles";
import {
  validateFeedback,
  hasFeedbackErrors,
  type FeedbackValues,
} from "@/lib/feedback-validation";
import { toPublicFeedback } from "@/lib/feedback-view";
import type { PublicFeedback } from "@/lib/feedback-types";

/**
 * Member feedback and insights on blog posts.
 *
 *   GET  /api/feedback?postSlug=...  — approved submissions only (public)
 *   POST /api/feedback               — submit one (members, enters moderation)
 *
 * The GET handler can never return a pending or rejected submission: `status`
 * is pinned in the query rather than filtered afterwards, so a future refactor
 * can't accidentally widen it.
 */

export async function GET(request: Request) {
  const postSlug = new URL(request.url).searchParams.get("postSlug")?.trim().toLowerCase();
  if (!postSlug) return errors.badRequest("A postSlug query parameter is required.");

  // No database configured yet: an empty list is the honest answer, and it lets
  // the blog render its "no contributions yet" state instead of an error.
  if (!isDatabaseConfigured()) return ok({ items: [] as PublicFeedback[], total: 0 });

  try {
    await connectToDatabase();
    const items = await Feedback.find({ postSlug, status: "approved" })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean<FeedbackDocument[]>();

    return ok({ items: items.map(toPublicFeedback), total: items.length });
  } catch (error) {
    return handleRouteError(error, "feedback/list");
  }
}

type SubmitBody = Partial<FeedbackValues> & { postSlug?: string };

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  // Per-account throttle: stops one member flooding the moderation queue.
  const limit = rateLimit(`feedback:${user.id}`, 6, 60 * 60 * 1000);
  if (!limit.allowed) return errors.rateLimited(limit.retryAfterSeconds);

  const body = await readJson<SubmitBody>(request);
  if (!body) return errors.badRequest();

  const postSlug = String(body.postSlug ?? "").trim().toLowerCase();
  if (!postSlug) return errors.badRequest("A postSlug is required.");

  const values: FeedbackValues = {
    kind: String(body.kind ?? "feedback"),
    body: normalizeParagraphs(String(body.body ?? "")),
  };

  const fieldErrors = validateFeedback(values);
  if (hasFeedbackErrors(fieldErrors)) {
    return errors.validation(fieldErrors as Record<string, string>);
  }

  try {
    await connectToDatabase();

    // Resolve the article being discussed. Database posts win; the built-in
    // content is accepted too, so members can contribute to articles that
    // haven't been migrated into MongoDB yet.
    const post = await BlogPost.findOne({ slug: postSlug, status: "published" })
      .select("_id title slug")
      .lean<Pick<BlogPostDocument, "_id" | "title" | "slug"> | null>();

    const builtIn = builtInArticles.find((a) => a.slug === postSlug);

    if (!post && !builtIn) {
      return errors.notFound("We couldn't find the article you're responding to.");
    }

    const postId: Types.ObjectId | null = post ? post._id : null;
    const postTitle = post?.title ?? builtIn?.title ?? postSlug;

    // One pending submission per member per article keeps the queue meaningful
    // and stops accidental double-submits from a slow network.
    const alreadyPending = await Feedback.exists({
      author: new Types.ObjectId(user.id),
      postSlug,
      status: "pending",
    });
    if (alreadyPending) {
      return errors.conflict(
        "You already have a contribution awaiting review on this article. We'll publish it once it's approved.",
      );
    }

    const created = await Feedback.create({
      post: postId,
      postSlug,
      postTitle,
      author: new Types.ObjectId(user.id),
      authorName: user.name,
      authorEmail: user.email,
      kind: values.kind,
      body: values.body,
      // Never trust a client-supplied status — moderation always starts here.
      status: "pending",
    });

    return ok(
      {
        ok: true,
        submission: {
          id: String(created._id),
          status: created.status,
          createdAt: created.createdAt.toISOString(),
        },
      },
      201,
    );
  } catch (error) {
    return handleRouteError(error, "feedback/create");
  }
}
