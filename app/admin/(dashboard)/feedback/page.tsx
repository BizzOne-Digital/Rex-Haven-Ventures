import type { Metadata } from "next";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export const metadata: Metadata = {
  title: "Moderation",
  robots: { index: false, follow: false },
};

export default function AdminFeedbackPage() {
  return <ModerationQueue />;
}
