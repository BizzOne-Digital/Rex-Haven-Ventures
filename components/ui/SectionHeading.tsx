import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

type SectionHeadingProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  as?: ElementType;
  titleClassName?: string;
  className?: string;
  children?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
  as: Tag = "h2",
  titleClassName,
  className,
  children,
}: SectionHeadingProps) {
  const isLight = tone === "light";
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-5",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {eyebrow && <Eyebrow tone={isLight ? "light" : "burgundy"}>{eyebrow}</Eyebrow>}
      <Tag
        className={cn("display-2", isLight ? "text-cream" : "text-ink", titleClassName)}
      >
        {title}
      </Tag>
      {description && (
        <p
          className={cn(
            "lead max-w-2xl",
            align === "center" && "mx-auto",
            isLight && "text-cream/70",
          )}
        >
          {description}
        </p>
      )}
      {children}
    </Reveal>
  );
}
