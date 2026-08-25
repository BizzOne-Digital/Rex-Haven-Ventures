import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { ChevronDown } from "@/components/ui/Icons";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-burgundy-deep text-cream">
      {/* Base gradient wash */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(158deg, #3b1119 0%, var(--color-burgundy-deep) 44%, #4f0f1c 100%)",
        }}
      />
      {/* Warm glow, upper-left */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 22% 18%, rgba(143,69,81,0.38), transparent 60%)",
        }}
      />
      {/* Arch motif rising from bottom — echoes the mark */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 opacity-[0.16]">
        <svg
          className="mx-auto h-[70vh] w-full max-w-[70rem]"
          viewBox="0 0 400 300"
          fill="none"
          stroke="var(--color-cream)"
          strokeWidth={0.6}
          preserveAspectRatio="xMidYMax slice"
        >
          {Array.from({ length: 9 }).map((_, i) => {
            const r = 30 + i * 34;
            return <path key={i} d={`M${200 - r} 300 A ${r} ${r} 0 0 1 ${200 + r} 300`} />;
          })}
        </svg>
      </div>
      {/* Subtle grain */}
      <div aria-hidden className="grain absolute inset-0 -z-10" />

      <Container size="wide" className="relative flex flex-1 flex-col justify-center pb-24 pt-36 md:pt-40">
        <div className="max-w-4xl">
          <Reveal>
            <Eyebrow tone="light">Investment &middot; Venture Building &middot; Partnership</Eyebrow>
          </Reveal>

          <Reveal as="h1" delay={90} className="display-1 mt-7 text-cream">
            We invest, we build,{" "}
            <span className="whitespace-nowrap">
              we <span className="accent-italic text-beige">win together</span>.
            </span>
          </Reveal>

          <Reveal
            as="p"
            delay={200}
            className="mt-8 max-w-2xl text-lg leading-relaxed text-cream/75 md:text-xl"
          >
            Rex Haven Ventures partners with entrepreneurs and investors to identify
            opportunities, build businesses, and create lasting value — bringing capital,
            conviction, and hands-on partnership to every venture.
          </Reveal>

          <Reveal delay={320} className="mt-11 flex flex-col gap-4 sm:flex-row">
            <Button href="/contact" size="lg" variant="light" withArrow>
              Start a Conversation
            </Button>
            <Button href="/about" size="lg" variant="lightOutline">
              Explore Our Approach
            </Button>
          </Reveal>
        </div>
      </Container>

      {/* Scroll cue */}
      <div
        aria-hidden
        className="relative z-10 flex justify-center pb-8 text-cream/45"
      >
        <ChevronDown className="h-5 w-5 animate-[nudge_2.4s_ease-in-out_infinite]" />
      </div>
    </section>
  );
}
