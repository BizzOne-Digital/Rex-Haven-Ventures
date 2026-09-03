import type { Metadata } from "next";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export const metadata: Metadata = {
  title: "Media",
  robots: { index: false, follow: false },
};

export default function AdminMediaPage() {
  return <MediaLibrary />;
}
