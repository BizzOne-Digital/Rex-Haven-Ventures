import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      width={24}
      height={24}
      {...props}
    >
      {children}
    </svg>
  );
}

/* ---- Directional ---- */
export const ArrowRight = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 12h15" />
    <path d="M13 6l6 6-6 6" />
  </Base>
);

export const ArrowUpRight = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 17L17 7" />
    <path d="M8 7h9v9" />
  </Base>
);

export const ChevronDown = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 9l6 6 6-6" />
  </Base>
);

/* ---- UI ---- */
export const Menu = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 8h18" />
    <path d="M3 16h18" />
  </Base>
);

export const Close = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </Base>
);

export const Check = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 6L9 17l-5-5" />
  </Base>
);

export const Mail = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
    <path d="M21 6.5l-9 6-9-6" />
  </Base>
);

export const Phone = (p: IconProps) => (
  <Base {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </Base>
);

export const Search = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Base>
);

export const Clock = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Base>
);

/* ---- Service icons ---- */
const Compass = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3 6.3-2.1z" />
  </Base>
);

const Layers = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
    <path d="M3 16.5L12 21l9-4.5" />
    <path d="M3 12l9 4.5L21 12" />
  </Base>
);

const Trend = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </Base>
);

const Orbit = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <ellipse cx="12" cy="12" rx="10" ry="4.4" transform="rotate(-30 12 12)" />
    <circle cx="20.4" cy="7.4" r="1.2" fill="currentColor" stroke="none" />
  </Base>
);

/* ---- Principle icons ---- */
const Horizon = (p: IconProps) => (
  <Base {...p}>
    <path d="M2 18h20" />
    <path d="M6.5 18a5.5 5.5 0 0 1 11 0" />
    <path d="M12 5.5V4" />
    <path d="M5.2 8.2l-1-1" />
    <path d="M18.8 8.2l1-1" />
  </Base>
);

const Spark = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 2.5l2.2 7.3 7.3 2.2-7.3 2.2L12 21.5l-2.2-7.3L2.5 12l7.3-2.2L12 2.5z" />
  </Base>
);

const Link = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="12" r="5.2" />
    <circle cx="15" cy="12" r="5.2" />
  </Base>
);

const Ascend = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 13l8-7 8 7" />
    <path d="M4 19l8-7 8 7" />
  </Base>
);

const registry = {
  compass: Compass,
  layers: Layers,
  trend: Trend,
  orbit: Orbit,
  horizon: Horizon,
  spark: Spark,
  link: Link,
  ascend: Ascend,
} as const;

export type IconName = keyof typeof registry;

export function Icon({ name, ...props }: IconProps & { name: IconName }) {
  const Cmp = registry[name];
  return <Cmp {...props} />;
}
