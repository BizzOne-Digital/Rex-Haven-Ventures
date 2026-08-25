import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TextLink } from "@/components/ui/TextLink";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { services } from "@/lib/services";

export function ServicesPreview() {
  return (
    <section className="bg-beige-light py-24 md:py-32">
      <Container size="wide">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="What We Do"
            title={
              <>
                Where capital meets{" "}
                <span className="accent-italic text-burgundy">execution.</span>
              </>
            }
            description="Four ways we help ideas become enduring businesses — each grounded in partnership, and each a starting point for a conversation."
            className="max-w-2xl"
          />
          <div className="hidden shrink-0 md:block">
            <TextLink href="/services">View all services</TextLink>
          </div>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((service, i) => (
            <ServiceCard key={service.id} service={service} delay={i * 80} />
          ))}
        </div>

        <div className="mt-10 md:hidden">
          <TextLink href="/services">View all services</TextLink>
        </div>
      </Container>
    </section>
  );
}
