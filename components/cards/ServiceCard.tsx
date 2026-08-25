import Link from "next/link";
import type { Service } from "@/lib/services";
import { Icon } from "@/components/ui/Icons";
import { ArrowRight } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";

/** Compact service card used in the homepage overview grid. Links to /services. */
export function ServiceCard({ service, delay = 0 }: { service: Service; delay?: number }) {
  return (
    <Reveal className="h-full" delay={delay}>
      <Link
        href="/services"
        aria-label={`${service.title} — learn more`}
        className="group relative flex h-full flex-col rounded-[4px] border border-line bg-cream p-8 shadow-soft transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:border-burgundy/35 hover:shadow-lift md:p-9"
      >
        <div className="flex items-start justify-between">
          <span className="grid h-12 w-12 place-items-center rounded-[3px] bg-burgundy/8 text-burgundy transition-colors duration-500 group-hover:bg-burgundy group-hover:text-cream">
            <Icon name={service.icon} className="h-6 w-6" />
          </span>
          <span className="index-num text-sm text-muted/70">{service.index}</span>
        </div>

        <h3 className="mt-7 font-serif text-2xl text-ink">{service.title}</h3>
        <p className="mt-2 text-sm font-medium text-burgundy/90">{service.tagline}</p>
        <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">{service.summary}</p>

        <span className="mt-8 inline-flex items-center gap-2 pt-2 text-sm font-medium text-burgundy">
          Learn more
          <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
        </span>
      </Link>
    </Reveal>
  );
}
