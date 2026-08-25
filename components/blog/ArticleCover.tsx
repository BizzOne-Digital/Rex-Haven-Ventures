import Image from "next/image";
import { cn } from "@/lib/cn";
import type { ArticleCover as CoverKey } from "@/lib/articles";

/**
 * Cover art for articles. Renders a real photo (`image` prop) when one is
 * available; otherwise falls back to self-contained, on-brand abstract art
 * (CSS gradient + SVG line motif).
 */

type CoverConfig = {
  gradient: string;
  stroke: string;
  motif: "arch" | "ridge" | "orbit" | "column" | "grid" | "wave";
  scheme: "dark" | "light";
};

const configs: Record<CoverKey, CoverConfig> = {
  arch: {
    gradient: "linear-gradient(150deg, var(--color-burgundy-deep), var(--color-burgundy))",
    stroke: "rgba(244,239,230,0.18)",
    motif: "arch",
    scheme: "dark",
  },
  ridge: {
    gradient: "linear-gradient(155deg, var(--color-burgundy), var(--color-burgundy-warm))",
    stroke: "rgba(244,239,230,0.16)",
    motif: "ridge",
    scheme: "dark",
  },
  orbit: {
    gradient: "linear-gradient(200deg, #4d1922, var(--color-burgundy))",
    stroke: "rgba(244,239,230,0.17)",
    motif: "orbit",
    scheme: "dark",
  },
  wave: {
    gradient: "linear-gradient(150deg, var(--color-burgundy-warm), var(--color-burgundy-deep))",
    stroke: "rgba(244,239,230,0.16)",
    motif: "wave",
    scheme: "dark",
  },
  column: {
    gradient: "linear-gradient(160deg, var(--color-beige), var(--color-sand))",
    stroke: "rgba(100,31,43,0.20)",
    motif: "column",
    scheme: "light",
  },
  grid: {
    gradient: "linear-gradient(160deg, var(--color-cream), var(--color-beige-light))",
    stroke: "rgba(100,31,43,0.16)",
    motif: "grid",
    scheme: "light",
  },
};

function Motif({ motif, stroke }: { motif: CoverConfig["motif"]; stroke: string }) {
  const common = {
    fill: "none",
    stroke,
    strokeWidth: 1,
  };
  switch (motif) {
    case "arch":
      return (
        <g {...common}>
          {Array.from({ length: 6 }).map((_, i) => {
            const r = 46 + i * 34;
            return <path key={i} d={`M${200 - r} 300 A ${r} ${r} 0 0 1 ${200 + r} 300`} />;
          })}
        </g>
      );
    case "ridge":
      return (
        <g {...common}>
          {Array.from({ length: 9 }).map((_, i) => {
            const y = 34 + i * 30;
            return (
              <path
                key={i}
                d={`M0 ${y} C 110 ${y - 16}, 290 ${y + 16}, 400 ${y}`}
              />
            );
          })}
        </g>
      );
    case "orbit":
      return (
        <g {...common}>
          {Array.from({ length: 5 }).map((_, i) => (
            <ellipse
              key={i}
              cx="205"
              cy="150"
              rx={54 + i * 34}
              ry={22 + i * 16}
              transform="rotate(-20 205 150)"
            />
          ))}
          <circle cx="205" cy="150" r="4" fill={stroke} stroke="none" />
        </g>
      );
    case "wave":
      return (
        <g {...common}>
          {Array.from({ length: 6 }).map((_, i) => {
            const y = 52 + i * 40;
            return (
              <path
                key={i}
                d={`M-10 ${y} C 80 ${y - 34}, 150 ${y + 34}, 240 ${y} S 360 ${y - 34}, 410 ${y}`}
              />
            );
          })}
        </g>
      );
    case "column":
      return (
        <g {...common}>
          {Array.from({ length: 15 }).map((_, i) => (
            <path key={i} d={`M${16 + i * 26} 14 V 286`} />
          ))}
        </g>
      );
    case "grid":
      return (
        <g {...common}>
          {Array.from({ length: 11 }).map((_, i) => (
            <path key={`v${i}`} d={`M${i * 40} 0 V 300`} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <path key={`h${i}`} d={`M0 ${i * 40} H 400`} />
          ))}
          <rect x="150" y="110" width="60" height="60" fill="rgba(100,31,43,0.14)" stroke="none" />
        </g>
      );
  }
}

export function ArticleCover({
  cover,
  image,
  alt,
  className,
}: {
  cover: CoverKey;
  /** Real photo URL — rendered in place of the abstract art when provided. */
  image?: string;
  /** Accessible description of the photo (only used when `image` is set). */
  alt?: string;
  className?: string;
}) {
  const config = configs[cover];

  if (image) {
    return (
      <div className={cn("relative h-full w-full overflow-hidden", className)}>
        <Image
          src={image}
          alt={alt ?? ""}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ background: config.gradient }}
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        role="presentation"
      >
        <Motif motif={config.motif} stroke={config.stroke} />
      </svg>
      {/* soft vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            config.scheme === "dark"
              ? "radial-gradient(120% 90% at 30% 0%, rgba(255,255,255,0.06), transparent 55%)"
              : "radial-gradient(120% 90% at 70% 100%, rgba(66,20,29,0.05), transparent 55%)",
        }}
      />
    </div>
  );
}
