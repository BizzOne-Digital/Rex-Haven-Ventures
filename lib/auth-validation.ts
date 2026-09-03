/**
 * Shared authentication validation — used by the client forms and the API
 * routes so the rules never drift. No framework imports; safe on both sides.
 *
 * Mirrors the conventions in `lib/contact-validation.ts`.
 */

export type SignupValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginValues = {
  email: string;
  password: string;
};

export type AuthFieldErrors = Partial<Record<keyof SignupValues, string>>;

export const emptySignupValues: SignupValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export const emptyLoginValues: LoginValues = {
  email: "",
  password: "",
};

// Same pragmatic pattern the contact form uses — deliberately permissive, since
// the only real proof an address works is sending to it.
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 200;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 80;

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  return trimmed.length <= 254 && emailRe.test(trimmed);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Password rules: length plus a mix of letters and numbers. Strict enough to
 * rule out the obvious, loose enough not to push people toward writing it down.
 */
export function validatePassword(password: string): string | undefined {
  if (!password) return "Please choose a password.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Please use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Please keep your password under ${PASSWORD_MAX_LENGTH} characters.`;
  }
  if (!/[a-zA-Z]/.test(password)) return "Please include at least one letter.";
  if (!/[0-9]/.test(password)) return "Please include at least one number.";
  return undefined;
}

/** Rough 0–4 strength score for the signup meter. Advisory only. */
export function passwordStrength(password: string): {
  score: number;
  label: string;
} {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  const clamped = Math.min(score, 4);
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return { score: clamped, label: labels[clamped] };
}

export function validateSignup(values: Partial<SignupValues>): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const v = { ...emptySignupValues, ...values };

  const name = v.name.trim();
  if (!name) {
    errors.name = "Please enter your name.";
  } else if (name.length < NAME_MIN_LENGTH) {
    errors.name = "That name looks a little short.";
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Please keep your name under ${NAME_MAX_LENGTH} characters.`;
  }

  if (!v.email.trim()) {
    errors.email = "Please enter your email.";
  } else if (!isValidEmail(v.email)) {
    errors.email = "Please enter a valid email address.";
  }

  const passwordError = validatePassword(v.password);
  if (passwordError) errors.password = passwordError;

  if (!v.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (v.confirmPassword !== v.password) {
    errors.confirmPassword = "Those passwords don't match.";
  }

  return errors;
}

export function validateLogin(values: Partial<LoginValues>): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const v = { ...emptyLoginValues, ...values };

  if (!v.email.trim()) {
    errors.email = "Please enter your email.";
  } else if (!isValidEmail(v.email)) {
    errors.email = "Please enter a valid email address.";
  }

  // Deliberately only checks presence — never hint at the stored password's shape.
  if (!v.password) errors.password = "Please enter your password.";

  return errors;
}

export function hasAuthErrors(errors: AuthFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
