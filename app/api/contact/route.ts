import { validateContact, hasErrors, type ContactValues } from "@/lib/contact-validation";

/**
 * Contact submission endpoint.
 *
 * Delivery is intentionally honest:
 *  - If an email provider is configured via env, we actually send.
 *  - If nothing is configured, we return 503 `unconfigured` so the UI can fall
 *    back to direct contact details. We never fake a successful send.
 *
 * Configure ONE of the following (see .env.example):
 *  - CONTACT_WEBHOOK_URL                              (POSTs the JSON payload)
 *  - RESEND_API_KEY + CONTACT_TO_EMAIL + CONTACT_FROM_EMAIL   (sends via Resend)
 */

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmail(v: ContactValues) {
  const rows: [string, string][] = [
    ["Name", v.fullName],
    ["Email", v.email],
    ["Phone", v.phone || "—"],
    ["I am an", v.inquiryType],
    ["Subject", v.subject],
  ];
  const text =
    rows.map(([k, val]) => `${k}: ${val}`).join("\n") + `\n\nMessage:\n${v.message}`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#1a1715;line-height:1.6">
      <h2 style="font-family:Georgia,serif;color:#641f2b;margin:0 0 16px">New inquiry — Rex Haven Ventures</h2>
      <table style="border-collapse:collapse;width:100%;max-width:560px">
        ${rows
          .map(
            ([k, val]) =>
              `<tr><td style="padding:6px 12px 6px 0;color:#6b635c;white-space:nowrap;vertical-align:top">${escapeHtml(
                k,
              )}</td><td style="padding:6px 0">${escapeHtml(val)}</td></tr>`,
          )
          .join("")}
      </table>
      <p style="margin:20px 0 6px;color:#6b635c">Message</p>
      <p style="margin:0;white-space:pre-wrap">${escapeHtml(v.message)}</p>
    </div>`;
  return { text, html };
}

export async function POST(request: Request) {
  let body: Partial<ContactValues> & { company?: string };
  try {
    body = await request.json();
  } catch {
    return json({ code: "bad_request", message: "Invalid request body." }, 400);
  }

  // Honeypot: bots fill hidden fields. Silently accept without sending.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return json({ ok: true });
  }

  const values: ContactValues = {
    fullName: String(body.fullName ?? ""),
    email: String(body.email ?? ""),
    phone: String(body.phone ?? ""),
    inquiryType: String(body.inquiryType ?? ""),
    subject: String(body.subject ?? ""),
    message: String(body.message ?? ""),
  };

  const errors = validateContact(values);
  if (hasErrors(errors)) {
    return json(
      { code: "validation", message: "Please review the highlighted fields.", fieldErrors: errors },
      400,
    );
  }

  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  try {
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, source: "rexhavenventures.com/contact" }),
      });
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      return json({ ok: true });
    }

    if (resendKey && toEmail && fromEmail) {
      const { text, html } = buildEmail(values);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          reply_to: values.email,
          subject: `New inquiry: ${values.subject}`,
          text,
          html,
        }),
      });
      if (!res.ok) throw new Error(`Resend responded ${res.status}`);
      return json({ ok: true });
    }

    // No provider configured — be honest.
    return json(
      {
        code: "unconfigured",
        message: "Email delivery isn't configured yet. Please reach us directly.",
      },
      503,
    );
  } catch {
    // Never leak provider internals to the client.
    return json(
      { code: "provider_error", message: "We couldn't send your message just now." },
      502,
    );
  }
}
