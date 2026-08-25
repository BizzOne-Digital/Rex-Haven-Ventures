import type { Service } from "@/lib/services";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Check } from "@/components/ui/Icons";

/** Detailed, alternating service section for the Services page. */
export function ServiceBlock({ service, reversed }: { service: Service; reversed: boolean }) {
  const burgundyPanel = !reversed;

  return (
    <article className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Visual panel */}
      <Reveal className={cn(reversed && "lg:order-2")}>
        <div
          className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[6px] shadow-soft"
          style={{
            background: burgundyPanel
              ? "linear-gradient(150deg, var(--color-burgundy-deep), var(--color-burgundy))"
              : "linear-gradient(160deg, var(--color-beige), var(--color-sand))",
          }}
        >
          {/* arch motif */}
          <div aria-hidden className="absolute inset-x-0 bottom-0 opacity-30">
            <svg
              viewBox="0 0 400 300"
              fill="none"
              stroke={burgundyPanel ? "var(--color-cream)" : "var(--color-burgundy)"}
              strokeWidth={0.6}
              preserveAspectRatio="xMidYMax slice"
              className="h-[80%] w-full"
            >
              {Array.from({ length: 7 }).map((_, i) => {
                const r = 34 + i * 34;
                return <path key={i} d={`M${200 - r} 300 A ${r} ${r} 0 0 1 ${200 + r} 300`} />;
              })}
            </svg>
          </div>

          <div className="relative flex flex-col items-center">
            <span
              className={cn(
                "grid h-20 w-20 place-items-center rounded-[4px] border",
                burgundyPanel ? "border-cream/30 text-cream" : "border-burgundy/25 text-burgundy",
              )}
            >
              <Icon name={service.icon} className="h-10 w-10" />
            </span>
            <span
              className={cn(
                "index-num mt-6 text-5xl",
                burgundyPanel ? "text-cream/40" : "text-burgundy/35",
              )}
            >
              {service.index}
            </span>
          </div>
        </div>
      </Reveal>

      {/* Content */}
      <Reveal delay={100} className={cn(reversed && "lg:order-1")}>
        <span className="eyebrow text-burgundy">Service {service.index}</span>
        <h2 className="display-3 mt-4 text-ink">{service.title}</h2>
        <p className="mt-3 font-serif text-xl italic text-burgundy">{service.tagline}</p>
        <p className="mt-6 leading-relaxed text-charcoal/85">{service.intro}</p>

        <p className="mt-6 border-l-2 border-burgundy/30 pl-5 leading-relaxed text-muted">
          {service.valueProp}
        </p>

        <div className="mt-8">
          <h3 className="eyebrow text-muted">What this involves</h3>
          <ul className="mt-4 grid gap-3">
            {service.involves.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-burgundy" />
                <span className="text-[0.95rem] leading-relaxed text-charcoal/85">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-sm leading-relaxed text-muted">
          <span className="font-semibold text-ink">Who it&rsquo;s for — </span>
          {service.forWho}
        </p>

        <div className="mt-9">
          <Button href={service.cta.href} withArrow>
            {service.cta.label}
          </Button>
        </div>
      </Reveal>
    </article>
  );
}
