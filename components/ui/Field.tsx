import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Form primitives.
 *
 * The control styling is lifted verbatim from `components/contact/ContactForm.tsx`
 * so every form added by the member and admin features is visually identical to
 * the one the site already had. ContactForm itself is left untouched.
 */

export const controlBase =
  "w-full rounded-[4px] border bg-cream px-4 py-3 text-[0.95rem] text-ink transition-colors placeholder:text-muted/60 focus:outline-none focus:border-burgundy/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy disabled:cursor-not-allowed disabled:opacity-60";

export function controlClass(hasError?: boolean, className?: string): string {
  return cn(controlBase, hasError ? "border-danger/70 bg-danger/[0.02]" : "border-line", className);
}

export function FieldLabel({
  htmlFor,
  children,
  optional,
  hint,
}: {
  htmlFor: string;
  children: ReactNode;
  optional?: boolean;
  hint?: ReactNode;
}) {
  return (
    <span className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-charcoal">
        {children}
        {optional && <span className="ml-1.5 font-normal text-muted">(optional)</span>}
      </label>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </span>
  );
}

/** Error text wired to its control via `aria-describedby`. */
export function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-danger">
      {children}
    </p>
  );
}

type FieldWrapperProps = {
  id: string;
  label: ReactNode;
  error?: string;
  optional?: boolean;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Helper text shown beneath the control when there is no error. */
  description?: ReactNode;
};

export function Field({
  id,
  label,
  error,
  optional,
  hint,
  children,
  className,
  description,
}: FieldWrapperProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <FieldLabel htmlFor={id} optional={optional} hint={hint}>
        {label}
      </FieldLabel>
      {children}
      {error ? (
        <FieldError id={`${id}-error`}>{error}</FieldError>
      ) : (
        description && (
          <p id={`${id}-description`} className="mt-1.5 text-xs leading-relaxed text-muted">
            {description}
          </p>
        )
      )}
    </div>
  );
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean };

export function TextInput({ hasError, className, ...props }: TextInputProps) {
  return <input {...props} className={controlClass(hasError, className)} />;
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean };

export function TextArea({ hasError, className, ...props }: TextAreaProps) {
  return (
    <textarea {...props} className={controlClass(hasError, cn("resize-y", className))} />
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean };

export function Select({ hasError, className, children, ...props }: SelectProps) {
  return (
    <select {...props} className={controlClass(hasError, cn("appearance-none pr-10", className))}>
      {children}
    </select>
  );
}

/** Checkbox with an inline label, styled to the brand accent. */
export function Checkbox({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded-[2px] border-line accent-burgundy disabled:cursor-not-allowed disabled:opacity-60"
      />
      <span className="flex flex-col">
        <label htmlFor={id} className="text-sm font-medium text-charcoal">
          {label}
        </label>
        {description && (
          <span className="mt-0.5 text-xs leading-relaxed text-muted">{description}</span>
        )}
      </span>
    </div>
  );
}
