import { connectToDatabase } from "@/lib/db/mongoose";
import { User, type UserDocument } from "@/lib/db/models/User";
import { Feedback } from "@/lib/db/models/Feedback";
import { handleRouteError, ok, requireAdmin } from "@/lib/api";
import { toSafeUser } from "@/lib/auth/session";
import { containsRegex } from "@/lib/regex-escape";

/**
 * GET /api/admin/users — searchable, paginated list of registered accounts.
 *
 * Query: `?q=` search term, `?role=`, `?status=active|inactive`, `?page=`.
 *
 * Every row goes through `toSafeUser`, and `passwordHash` is `select: false` on
 * the schema, so a password hash cannot reach this response.
 */

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const role = url.searchParams.get("role")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);

  try {
    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    if (q) {
      const safe = containsRegex(q);
      filter.$or = [{ name: safe }, { email: safe }];
    }
    if (role === "member" || role === "admin") filter.role = role;
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean<UserDocument[]>(),
      User.countDocuments(filter),
    ]);

    // Submission counts per listed user, in one grouped query rather than N.
    const ids = users.map((user) => user._id);
    const grouped = await Feedback.aggregate<{ _id: unknown; count: number }>([
      { $match: { author: { $in: ids } } },
      { $group: { _id: "$author", count: { $sum: 1 } } },
    ]);
    const submissionCounts = new Map(grouped.map((row) => [String(row._id), row.count]));

    return ok({
      items: users.map((user) => ({
        ...toSafeUser(user),
        submissionCount: submissionCounts.get(String(user._id)) ?? 0,
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    return handleRouteError(error, "admin/users");
  }
}
