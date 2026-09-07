import type { Metadata } from "next";
import { ServiceManager } from "@/components/admin/ServiceManager";

export const metadata: Metadata = {
  title: "Services",
  robots: { index: false, follow: false },
};

export default function AdminServicesPage() {
  return <ServiceManager />;
}
