"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchCurrentUser, logout as logoutRequest, type SessionUser } from "@/services/auth";
import { isAbort } from "@/services/api-client";

/**
 * Client-side session context.
 *
 * The session itself is an HttpOnly cookie the browser sends automatically;
 * this only caches *who* that cookie belongs to, so the header and member pages
 * can render the right thing without each fetching separately.
 *
 * Resolved on the client on purpose. Reading `cookies()` in the root layout
 * would opt every page — including the static marketing pages — into dynamic
 * rendering. Authorization is never decided here: it is re-checked on the
 * server for every protected page and API call.
 */

type SessionState = {
  user: SessionUser | null;
  /** True until the first `/api/auth/me` response lands. */
  isLoading: boolean;
  /** True when the session couldn't be resolved (offline, server down). */
  isUnavailable: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Adopts the user returned by a sign-in or sign-up, avoiding a re-fetch. */
  setUser: (user: SessionUser | null) => void;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnavailable, setIsUnavailable] = useState(false);

  /**
   * Applies a `/api/auth/me` result. Kept separate from the request so state
   * updates always happen in a promise callback rather than synchronously
   * inside an effect body.
   */
  const apply = useCallback((result: Awaited<ReturnType<typeof fetchCurrentUser>>) => {
    if (isAbort(result)) return;

    if (result.ok) {
      setUser(result.data.user);
      setIsUnavailable(false);
    } else {
      setUser(null);
      // 401/503 are legitimate "no session" answers; a zero status means we
      // genuinely couldn't ask, which the UI reports differently.
      setIsUnavailable(result.status === 0);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchCurrentUser(controller.signal).then(apply);
    return () => controller.abort();
  }, [apply]);

  const refresh = useCallback(async () => {
    apply(await fetchCurrentUser());
  }, [apply]);

  const signOut = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setIsUnavailable(false);
  }, []);

  const value = useMemo<SessionState>(
    () => ({ user, isLoading, isUnavailable, refresh, signOut, setUser }),
    [user, isLoading, isUnavailable, refresh, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside <SessionProvider>.");
  }
  return context;
}
