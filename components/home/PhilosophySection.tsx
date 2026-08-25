import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icons";
import { principles } from "@/lib/philosophy";

export function PhilosophySection() {
  return (
    <section className="bg-cream py-24 md:py-32">
      <Container size="wide">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Intro column */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <Eyebrow>Our Philosophy</Eyebrow>
              </Reveal>
              <Reveal as="h2" delay={80} className="display-2 mt-6 text-ink">
                Principles that shape every decision.
              </Reveal>
              <Reveal as="p" delay={160} className="lead mt-6 max-w-md">
                We hold ourselves to a consistent way of thinking — one that favors
                substance over spectacle and partnership over transaction.
              </Reveal>
            </div>
          </div>

          {/* Principles grid */}
          <div className="lg:col-span-8">
            <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
              {principles.map((p, i) => (
                <Reveal as="article" key={p.index} delay={(i % 2) * 90}>
                  <div className="flex items-center gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[3px] border border-burgundy/20 bg-burgundy/[0.06] text-burgundy">
                      <Icon name={p.icon} className="h-6 w-6" />
                    </span>
                    <span className="index-num text-lg text-muted/60">{p.index}</span>
                  </div>
                  <h3 className="mt-6 font-serif text-2xl text-ink">{p.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{p.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
