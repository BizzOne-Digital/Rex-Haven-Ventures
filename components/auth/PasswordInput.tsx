"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { Eye, EyeOff } from "@/components/ui/Icons";
import { controlClass } from "@/components/ui/Field";
import { passwordStrength } from "@/lib/auth-validation";

/**
 * Password input with a show/hide toggle and an optional strength meter.
 *
 * The toggle is a real button with an accessible label rather than an icon
 * alone, and the strength readout is mirrored in text so it is not conveyed by
 * the bar's colour alone. Strength is advisory: the actual rules are enforced
 * by `validatePassword` on both the client and the server.
 */
export function PasswordInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  hasError,
  autoComplete,
  placeholder,
  disabled,
  describedBy,
  showStrength = false,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
  autoComplete?: string;
  placeholder?: string;
  disabled?: boolean;
  describedBy?: string;
  showStrength?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const meterId = useId();
  const strength = showStrength ? passwordStrength(value) : null;

  const barTone = (index: number) => {
    if (!strength || index >= strength.score) return "bg-line";
    if (strength.score <= 1) return "bg-danger";
    if (strength.score === 2) return "bg-burgundy-soft";
    if (strength.score === 3) return "bg-burgundy";
    return "bg-success";
  };

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={
            [describedBy, showStrength && value ? meterId : null].filter(Boolean).join(" ") ||
            undefined
          }
          className={controlClass(hasError, "pr-12")}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          // The input keeps its own label; this button needs its own name.
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[3px] text-muted transition-colors hover:text-burgundy"
        >
          {visible ? <EyeOff className="h-[1.15rem] w-[1.15rem]" /> : <Eye className="h-[1.15rem] w-[1.15rem]" />}
        </button>
      </div>

      {showStrength && value && strength && (
        <div id={meterId} className="mt-2.5 flex items-center gap-3">
          <span aria-hidden className="flex flex-1 gap-1">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={cn("h-1 flex-1 rounded-full transition-colors", barTone(index))}
              />
            ))}
          </span>
          <span className="w-16 shrink-0 text-right text-xs text-muted">
            {strength.label}
          </span>
        </div>
      )}
    </div>
  );
}
