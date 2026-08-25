"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Check } from "@/components/ui/Icons";
import { siteConfig, mailtoHref, telHref } from "@/lib/site";
import { submitContact } from "@/services/contact";
import {
  validateContact,
  hasErrors,
  inquiryTypes,
  emptyContactValues,
  type ContactValues,
  type FieldErrors,
} from "@/lib/contact-validation";

type Status = "idle" | "submitting" | "success" | "unconfigured" | "error";

const fieldOrder: (keyof ContactValues)[] = [
  "fullName",
  "email",
  "phone",
  "inquiryType",
  "subject",
  "message",
];

const controlBase =
  "w-full rounded-[4px] border bg-cream px-4 py-3 text-[0.95rem] text-ink transition-colors placeholder:text-muted/60 focus:outline-none focus:border-burgundy/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy";

function controlClass(hasError: boolean) {
  return cn(controlBase, hasError ? "border-danger/70 bg-danger/[0.02]" : "border-line");
}

export function ContactForm() {
  const [values, setValues] = useState<ContactValues>(emptyContactValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ContactValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [formMessage, setFormMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot

  const submitting = status === "submitting";

  const showError = (name: keyof ContactValues) =>
    (touched[name] || submitted) && errors[name] ? errors[name] : undefined;

  function update<K extends keyof ContactValues>(name: K, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);
    if (submitted || touched[name]) setErrors(validateContact(next));
    if (status === "error") setStatus("idle");
  }

  function handleBlur(name: keyof ContactValues) {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors(validateContact(values));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = validateContact(values);
    setErrors(found);
    setSubmitted(true);

    if (hasErrors(found)) {
      const first = fieldOrder.find((f) => found[f]);
      if (first) document.getElementById(first)?.focus();
      return;
    }

    setStatus("submitting");
    setFormMessage("");
    const result = await submitContact({ ...values, company });

    if (result.status === "success") {
      setStatus("success");
    } else if (result.status === "unconfigured") {
      setStatus("unconfigured");
    } else {
      setStatus("error");
      setFormMessage(result.message);
      if (result.fieldErrors) setErrors((prev) => ({ ...prev, ...result.fieldErrors }));
    }
  }

  function reset() {
    setValues(emptyContactValues);
    setErrors({});
    setTouched({});
    setSubmitted(false);
    setStatus("idle");
    setFormMessage("");
  }

  // ---- Success ----
  if (status === "success") {
    return (
      <div className="flex flex-col items-start rounded-[6px] border border-line bg-cream p-8 shadow-soft md:p-10">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-success/10 text-success">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="mt-6 font-serif text-2xl text-ink">Your message is on its way.</h3>
        <p className="mt-3 max-w-md leading-relaxed text-muted">
          Thank you for reaching out. We read every message personally and will reply as soon
          as we can — usually within a couple of business days.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 text-sm font-medium text-burgundy underline-offset-4 hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  // ---- Unconfigured (honest fallback — no fake success) ----
  if (status === "unconfigured") {
    const prefilledMail =
      `${mailtoHref}?subject=${encodeURIComponent(values.subject || "Inquiry")}` +
      `&body=${encodeURIComponent(
        `${values.message}\n\n— ${values.fullName}${values.phone ? ` · ${values.phone}` : ""}`,
      )}`;
    return (
      <div className="rounded-[6px] border border-line bg-cream p-8 shadow-soft md:p-10">
        <h3 className="font-serif text-2xl text-ink">Let&rsquo;s connect directly.</h3>
        <p className="mt-3 max-w-md leading-relaxed text-muted">
          Online delivery isn&rsquo;t enabled on this demo just yet — but your message matters
          to us. Reach us directly and we&rsquo;ll respond personally.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button href={prefilledMail} withArrow>
            Email Us Directly
          </Button>
          <Button href={telHref} variant="outline">
            Call {siteConfig.contact.phone}
          </Button>
        </div>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-7 text-sm font-medium text-burgundy underline-offset-4 hover:underline"
        >
          Back to the form
        </button>
      </div>
    );
  }

  // ---- Form ----
  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-[6px] border border-line bg-cream p-6 shadow-soft sm:p-8 md:p-10">
      <p aria-live="polite" className="sr-only">
        {submitting ? "Sending your message" : formMessage}
      </p>

      {status === "error" && formMessage && (
        <div
          role="alert"
          className="mb-6 rounded-[4px] border border-danger/30 bg-danger/[0.04] px-4 py-3 text-sm text-danger"
        >
          {formMessage}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Full name */}
        <div className="sm:col-span-1">
          <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-ink">
            Full name <span aria-hidden className="text-burgundy">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            value={values.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            onBlur={() => handleBlur("fullName")}
            aria-required="true"
            aria-invalid={!!showError("fullName")}
            aria-describedby={showError("fullName") ? "fullName-error" : undefined}
            className={controlClass(!!showError("fullName"))}
            placeholder="Your name"
          />
          {showError("fullName") && (
            <p id="fullName-error" className="mt-1.5 text-sm text-danger">
              {showError("fullName")}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="sm:col-span-1">
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
            Email <span aria-hidden className="text-burgundy">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            aria-required="true"
            aria-invalid={!!showError("email")}
            aria-describedby={showError("email") ? "email-error" : undefined}
            className={controlClass(!!showError("email"))}
            placeholder="you@company.com"
          />
          {showError("email") && (
            <p id="email-error" className="mt-1.5 text-sm text-danger">
              {showError("email")}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="sm:col-span-1">
          <label htmlFor="phone" className="mb-2 block text-sm font-medium text-ink">
            Phone <span className="text-muted">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
            onBlur={() => handleBlur("phone")}
            aria-invalid={!!showError("phone")}
            aria-describedby={showError("phone") ? "phone-error" : undefined}
            className={controlClass(!!showError("phone"))}
            placeholder="+1 (555) 000-0000"
          />
          {showError("phone") && (
            <p id="phone-error" className="mt-1.5 text-sm text-danger">
              {showError("phone")}
            </p>
          )}
        </div>

        {/* Inquiry type */}
        <div className="sm:col-span-1">
          <label htmlFor="inquiryType" className="mb-2 block text-sm font-medium text-ink">
            I am an… <span aria-hidden className="text-burgundy">*</span>
          </label>
          <select
            id="inquiryType"
            name="inquiryType"
            value={values.inquiryType}
            onChange={(e) => update("inquiryType", e.target.value)}
            onBlur={() => handleBlur("inquiryType")}
            aria-required="true"
            aria-invalid={!!showError("inquiryType")}
            aria-describedby={showError("inquiryType") ? "inquiryType-error" : undefined}
            className={cn(controlClass(!!showError("inquiryType")), values.inquiryType === "" && "text-muted/70")}
          >
            <option value="" disabled>
              Select one…
            </option>
            {inquiryTypes.map((t) => (
              <option key={t} value={t} className="text-ink">
                {t}
              </option>
            ))}
          </select>
          {showError("inquiryType") && (
            <p id="inquiryType-error" className="mt-1.5 text-sm text-danger">
              {showError("inquiryType")}
            </p>
          )}
        </div>

        {/* Subject */}
        <div className="sm:col-span-2">
          <label htmlFor="subject" className="mb-2 block text-sm font-medium text-ink">
            Subject <span aria-hidden className="text-burgundy">*</span>
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={values.subject}
            onChange={(e) => update("subject", e.target.value)}
            onBlur={() => handleBlur("subject")}
            aria-required="true"
            aria-invalid={!!showError("subject")}
            aria-describedby={showError("subject") ? "subject-error" : undefined}
            className={controlClass(!!showError("subject"))}
            placeholder="How can we help?"
          />
          {showError("subject") && (
            <p id="subject-error" className="mt-1.5 text-sm text-danger">
              {showError("subject")}
            </p>
          )}
        </div>

        {/* Message */}
        <div className="sm:col-span-2">
          <label htmlFor="message" className="mb-2 block text-sm font-medium text-ink">
            Message <span aria-hidden className="text-burgundy">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={values.message}
            onChange={(e) => update("message", e.target.value)}
            onBlur={() => handleBlur("message")}
            aria-required="true"
            aria-invalid={!!showError("message")}
            aria-describedby={showError("message") ? "message-error" : undefined}
            className={cn(controlClass(!!showError("message")), "resize-y")}
            placeholder="Tell us a little about what you're building or looking for."
          />
          {showError("message") && (
            <p id="message-error" className="mt-1.5 text-sm text-danger">
              {showError("message")}
            </p>
          )}
        </div>
      </div>

      {/* Honeypot — hidden from users & AT */}
      <div aria-hidden className="hidden">
        <label htmlFor="company">Company (leave blank)</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={submitting} withArrow={!submitting}>
          {submitting ? "Sending…" : "Send Inquiry"}
        </Button>
        <p className="text-xs leading-relaxed text-muted">
          We&rsquo;ll only use your details to respond to your inquiry.
        </p>
      </div>
    </form>
  );
}
