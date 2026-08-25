/**
 * Shared contact-form validation — used by both the client form and the
 * server route so the rules never drift. No framework imports; safe on both sides.
 */

export const inquiryTypes = [
  "Entrepreneur",
  "Investor",
  "Business Owner",
  "Potential Partner",
  "Other",
] as const;

export type InquiryType = (typeof inquiryTypes)[number];

export type ContactValues = {
  fullName: string;
  email: string;
  phone: string;
  inquiryType: string;
  subject: string;
  message: string;
};

export type FieldErrors = Partial<Record<keyof ContactValues, string>>;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return emailRe.test(email.trim());
}

export const emptyContactValues: ContactValues = {
  fullName: "",
  email: "",
  phone: "",
  inquiryType: "",
  subject: "",
  message: "",
};

export function validateContact(values: Partial<ContactValues>): FieldErrors {
  const errors: FieldErrors = {};
  const v = { ...emptyContactValues, ...values };

  if (!v.fullName.trim()) {
    errors.fullName = "Please enter your name.";
  } else if (v.fullName.trim().length < 2) {
    errors.fullName = "That name looks a little short.";
  }

  if (!v.email.trim()) {
    errors.email = "Please enter your email.";
  } else if (!isValidEmail(v.email)) {
    errors.email = "Please enter a valid email address.";
  }

  // Phone is optional; validate only when provided.
  if (v.phone.trim()) {
    const digits = v.phone.replace(/[^\d]/g, "");
    if (digits.length < 7) {
      errors.phone = "Please enter a valid phone number.";
    }
  }

  if (!v.inquiryType.trim()) {
    errors.inquiryType = "Please choose an option.";
  } else if (!inquiryTypes.includes(v.inquiryType as InquiryType)) {
    errors.inquiryType = "Please choose a valid option.";
  }

  if (!v.subject.trim()) {
    errors.subject = "Please add a subject.";
  } else if (v.subject.trim().length < 3) {
    errors.subject = "Please add a slightly longer subject.";
  }

  if (!v.message.trim()) {
    errors.message = "Please include a short message.";
  } else if (v.message.trim().length < 10) {
    errors.message = "Please add a little more detail (at least 10 characters).";
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
