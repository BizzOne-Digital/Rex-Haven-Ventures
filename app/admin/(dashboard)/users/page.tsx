import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserManager } from "@/components/admin/UserManager";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Users",
  robots: { index: false, follow: false },
};

/**
 * User management.
 *
 * The signed-in administrator's id is resolved on the server and handed to the
 * client component so it can mark and protect their own row. The API enforces
 * the same self-protection rules regardless of what the UI sends.
 */
export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  // The (dashboard) layout has already guarded this, but a page must not
  // depend on a parent's check for a value it needs.
  if (!user || user.role !== "admin") redirect("/admin/login");

  return <UserManager currentAdminId={user.id} />;
}
