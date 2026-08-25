import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

const values = [
  { title: "Long-term by default", note: "We build for durability, not for the next quarter." },
  { title: "Hands-on by nature", note: "We stay close to the work and the people doing it." },
  { title: "Aligned by design", note: "We succeed when the ventures we back succeed." },
];

export function IntroSection() {
  return (
    <section className="bg-cream py-24 md:py-32">
      <Container size="wide">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <Eyebrow>Who We Are</Eyebrow>
            </Reveal>
            <Reveal as="h2" delay={80} className="display-2 mt-6 text-ink">
              Built around opportunity.{" "}
              <span className="accent-italic text-burgundy">Driven by partnership.</span>
            </Reveal>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal as="p" className="text-lg leading-relaxed text-charcoal/85">
              Rex Haven Ventures exists at the meeting point of capital and creativity.
              We partner with founders and investors to turn promising ideas into businesses
              of lasting substance — and to make the journey there a shared one.
            </Reveal>
            <Reveal as="p" delay={90} className="mt-6 leading-relaxed text-muted">
              We are not passive backers. We bring conviction, judgment, and a genuine
              willingness to build alongside the people we invest in. Every relationship
              begins the same way: with an honest conversation about what could be.
            </Reveal>

            <div className="hairline mt-12" />

            <dl className="mt-10 grid gap-8 sm:grid-cols-3">
              {values.map((v, i) => (
                <Reveal as="div" key={v.title} delay={i * 90}>
                  <dt className="font-serif text-lg text-ink">{v.title}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted">{v.note}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  );
}
