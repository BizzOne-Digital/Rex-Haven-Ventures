import type { ContactValues, FieldErrors } from "@/lib/contact-validation";

/**
 * Client-side submission abstraction. Talks to /api/contact and maps the
 * response to an explicit, honest result — including the "not configured" case,
 * where the UI must NOT claim the message was delivered.
 */
export type ContactResult =
  | { status: "success" }
  | { status: "unconfigured" }
  | { status: "error"; message: string; fieldErrors?: FieldErrors };

const GENERIC_ERROR =
  "Something went wrong on our end. Please try again, or reach us directly.";

export async function submitContact(
  values: ContactValues & { company?: string },
): Promise<ContactResult> {
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data: {
      code?: string;
      message?: string;
      fieldErrors?: FieldErrors;
    } = await res.json().catch(() => ({}));

    if (res.ok) return { status: "success" };

    if (res.status === 503 && data.code === "unconfigured") {
      return { status: "unconfigured" };
    }

    if (res.status === 400 && data.code === "validation") {
      return {
        status: "error",
        message: data.message ?? "Please review the highlighted fields.",
        fieldErrors: data.fieldErrors,
      };
    }

    return { status: "error", message: data.message ?? GENERIC_ERROR };
  } catch {
    return {
      status: "error",
      message: "Network error. Please check your connection and try again.",
    };
  }
}
