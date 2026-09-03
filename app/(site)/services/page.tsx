import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { CTASection } from "@/components/ui/CTASection";
import { ServiceBlock } from "@/components/services/ServiceBlock";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Investment, venture building, strategic growth, and partnership. Four ways Rex Haven Ventures helps entrepreneurs and investors turn opportunity into lasting value.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="What We Do"
        title="Where capital meets execution."
        description="We work across the full arc of a venture — from the first investment to long-term growth. Every engagement is a partnership, and every partnership starts with a conversation."
      />

      <section className="bg-cream pb-24 pt-4 md:pb-32">
        <Container size="wide">
          <div className="flex flex-col gap-24 md:gap-32">
            {services.map((service, i) => (
              <ServiceBlock key={service.id} service={service} reversed={i % 2 === 1} />
            ))}
          </div>
        </Container>
      </section>

      <CTASection
        tone="cream"
        eyebrow="Not sure where you fit?"
        title="Let's figure it out together."
        description="You don't need to know exactly what you need. Tell us what you're working on or looking for, and we'll help you find the right starting point."
        primary={{ label: "Start a Conversation", href: "/contact" }}
        secondary={{ label: "Read Our Perspectives", href: "/blog" }}
      />
    </>
  );
}
