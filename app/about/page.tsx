import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CTASection } from "@/components/ui/CTASection";
import { Icon } from "@/components/ui/Icons";
import { principles } from "@/lib/philosophy";

export const metadata: Metadata = {
  title: "About",
  description:
    "Rex Haven Ventures is an investment and entrepreneurship firm built on a simple conviction: the best returns come from building great businesses, with great people, over the long term.",
  alternates: { canonical: "/about" },
};

const steps = [
  {
    title: "We start with a conversation",
    body: "Every relationship begins by understanding what you're building or looking for — and whether we're the right partners for it.",
  },
  {
    title: "We look for lasting potential",
    body: "We look past the headline opportunity to the fundamentals: the people, the model, and what the business can genuinely become.",
  },
  {
    title: "We commit and get involved",
    body: "When we partner, we bring capital, perspective, and hands-on support — and we stay close as the work unfolds.",
  },
  {
    title: "We build for the long term",
    body: "We measure success in durable value created together, not in quick wins that fade with the cycle.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="A partner for the people building what's next."
        description="Rex Haven Ventures is an investment and entrepreneurship firm built on a simple conviction: the best returns come from building great businesses, with great people, over the long term."
      />

      {/* Approach / narrative */}
      <section className="bg-beige-light py-24 md:py-32">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <Reveal>
                <Eyebrow>Our Approach</Eyebrow>
              </Reveal>
              <Reveal as="h2" delay={80} className="display-2 mt-6 text-ink">
                We invest in potential, then help it{" "}
                <span className="accent-italic text-burgundy">become real.</span>
              </Reveal>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <Reveal as="p" className="text-lg leading-relaxed text-charcoal/85">
                We built Rex Haven Ventures to work the way we always wished investors would —
                closely, honestly, and for the long term. We are drawn to founders with
                conviction and businesses with genuine substance, and we bring far more than
                capital to the table.
              </Reveal>
              <Reveal as="p" delay={90} className="mt-6 leading-relaxed text-muted">
                Our role changes with the venture. Sometimes we are the first believer in an
                early idea; sometimes we are the strategic partner helping an established
                business reach its next stage. What stays constant is our commitment to building
                something that lasts — and to winning together with the people we back.
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* How we work */}
      <section className="bg-cream py-24 md:py-32">
        <Container size="wide">
          <SectionHeading
            eyebrow="How We Work"
            title="A deliberate way of partnering."
            description="Our process is intentionally unhurried. We would rather begin the right relationship slowly than the wrong one quickly."
            className="max-w-2xl"
          />
          <ol className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {steps.map((step, i) => (
              <Reveal as="li" key={step.title} delay={(i % 2) * 90} className="flex gap-6">
                <span className="index-num shrink-0 text-3xl text-burgundy/40">
                  0{i + 1}
                </span>
                <div className="border-t border-line pt-1">
                  <h3 className="font-serif text-xl text-ink">{step.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* Principles */}
      <section className="bg-burgundy-deep py-24 text-cream md:py-32">
        <Container size="wide">
          <SectionHeading
            tone="light"
            eyebrow="What We Believe"
            title="The principles behind every partnership."
            description="These values are not marketing. They are the standard we hold ourselves to in every conversation and every commitment."
            className="max-w-2xl"
          />
          <div className="mt-16 grid gap-x-12 gap-y-12 md:grid-cols-2">
            {principles.map((p, i) => (
              <Reveal
                as="article"
                key={p.index}
                delay={(i % 2) * 90}
                className="flex gap-6 border-t border-cream/15 pt-8"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[3px] border border-cream/25 text-beige">
                  <Icon name={p.icon} className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-serif text-2xl text-cream">{p.title}</h3>
                  <p className="mt-3 leading-relaxed text-cream/70">{p.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <CTASection
        eyebrow="Let's Talk"
        title="Think we might be the right partners?"
        description="The best way to find out is a conversation. Tell us what you're building or looking for, and we'll take it from there."
        primary={{ label: "Start a Conversation", href: "/contact" }}
        secondary={{ label: "See What We Do", href: "/services" }}
      />
    </>
  );
}
