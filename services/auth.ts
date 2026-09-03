import { apiRequest, type ApiResult } from "@/services/api-client";
import type { SignupValues, LoginValues } from "@/lib/auth-validation";

/**
 * Client-side authentication calls. Talks to /api/auth/* and returns explicit
 * results — the session itself is an HttpOnly cookie the browser manages, so
 * nothing sensitive is handled here.
 */

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "member" | "admin";
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export function signup(values: SignupValues): Promise<ApiResult<{ user: SessionUser }>> {
  return apiRequest("/api/auth/signup", { method: "POST", body: values });
}

export function login(values: LoginValues): Promise<ApiResult<{ user: SessionUser }>> {
  return apiRequest("/api/auth/login", { method: "POST", body: values });
}

export function logout(): Promise<ApiResult<{ ok: true }>> {
  return apiRequest("/api/auth/logout", { method: "POST" });
}

export function fetchCurrentUser(
  signal?: AbortSignal,
): Promise<ApiResult<{ user: SessionUser | null }>> {
  return apiRequest("/api/auth/me", { signal });
}
