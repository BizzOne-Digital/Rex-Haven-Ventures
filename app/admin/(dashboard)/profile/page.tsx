import type { Metadata } from "next";
import { AdminProfile } from "@/components/admin/AdminProfile";

export const metadata: Metadata = {
  title: "Profile & Settings",
  robots: { index: false, follow: false },
};

export default function AdminProfilePage() {
  return <AdminProfile />;
}
