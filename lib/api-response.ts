/**
 * Shared API response vocabulary.
 *
 * Isomorphic on purpose: route handlers build these codes and the client
 * `services/*` modules switch on them, so the contract can't drift.
 */

export type ApiErrorCode =
  | "bad_request"
  | "validation"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "unconfigured"
  | "server_error";

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
};

/** Message shown when the server gives us nothing more specific. */
export const GENERIC_ERROR =
  "Something went wrong on our end. Please try again in a moment.";

export const NETWORK_ERROR =
  "Network error. Please check your connection and try again.";
