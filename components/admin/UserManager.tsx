"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock, Spinner } from "@/components/ui/Spinner";
import { StatusPill } from "@/components/ui/StatusPill";
import { Select, TextInput } from "@/components/ui/Field";
import { ArrowRight, Search, Trash, Users } from "@/components/ui/Icons";
import {
  deleteUser,
  fetchUsers,
  updateUser,
  type AdminUserRow,
  type UserQuery,
} from "@/services/admin";
import { isAbort } from "@/services/api-client";

/**
 * Registered account management.
 *
 * Passwords are never displayed or transmitted here — the API returns a safe
 * projection and the stored hash is excluded at the schema level, so there is
 * nothing sensitive on this screen to leak.
 *
 * Renders as a table on desktop and as cards on narrow screens, since a
 * six-column table is unusable on a phone.
 */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function UserManager({ currentAdminId }: { currentAdminId: string }) {
  const [items, setItems] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  /** Applies a fetch result. Separate from the request so state updates always
   *  happen in a promise callback, never synchronously inside an effect. */
  const apply = useCallback((result: Awaited<ReturnType<typeof fetchUsers>>) => {
    if (isAbort(result)) return;

    if (result.ok) {
      setItems(result.data.items);
      setTotal(result.data.total);
      setTotalPages(result.data.totalPages);
      setLoadError(null);
    } else {
      setLoadError(result.error.message);
    }
    setIsLoading(false);
  }, []);

  const load = useCallback(
    async (query: UserQuery) => {
      apply(await fetchUsers(query));
    },
    [apply],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchUsers({ q: debouncedSearch, role, status, page }, controller.signal).then(apply);
    return () => controller.abort();
  }, [apply, debouncedSearch, role, status, page]);

  function reload() {
    void load({ q: debouncedSearch, role, status, page });
  }

  async function toggleActive(user: AdminUserRow) {
    setBusyId(user.id);
    setActionError(null);
    setActionNotice(null);

    const result = await updateUser(user.id, { isActive: !user.isActive });
    setBusyId(null);

    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }

    setItems((current) =>
      current.map((row) =>
        row.id === user.id ? { ...row, isActive: result.data.user.isActive } : row,
      ),
    );
    setActionNotice(
      result.data.user.isActive
        ? `${user.name} can sign in again.`
        : `${user.name} has been deactivated and can no longer sign in.`,
    );
  }

  async function changeRole(user: AdminUserRow, nextRole: string) {
    setBusyId(user.id);
    setActionError(null);
    setActionNotice(null);

    const result = await updateUser(user.id, { role: nextRole });
    setBusyId(null);

    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }

    setItems((current) =>
      current.map((row) =>
        row.id === user.id ? { ...row, role: result.data.user.role } : row,
      ),
    );
    setActionNotice(
      `${user.name} is now ${result.data.user.role === "admin" ? "an administrator" : "a member"}.`,
    );
  }

  async function remove(user: AdminUserRow) {
    setBusyId(user.id);
    setActionError(null);
    setActionNotice(null);

    const result = await deleteUser(user.id);
    setBusyId(null);
    setConfirmDeleteId(null);

    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }

    const removed = result.data.deletedSubmissions;
    setActionNotice(
      `${user.name} was deleted${
        removed > 0 ? `, along with ${removed} contribution${removed === 1 ? "" : "s"}` : ""
      }.`,
    );
    reload();
  }

  return (
    <div>
      <div>
        <h2 className="font-serif text-2xl text-ink">Registered users</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Member and administrator accounts. Passwords are stored only as bcrypt hashes and are
          never shown here or returned by the API.
        </p>
      </div>

      {/* Filters */}
      <div className="mt-7 flex flex-col gap-4 border-b border-line pb-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div>
            <label htmlFor="filter-role" className="sr-only">
              Filter by role
            </label>
            <Select
              id="filter-role"
              value={role}
              className="py-2.5 text-sm"
              onChange={(event) => {
                setRole(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All roles</option>
              <option value="member">Members</option>
              <option value="admin">Administrators</option>
            </Select>
          </div>
          <div>
            <label htmlFor="filter-status" className="sr-only">
              Filter by account status
            </label>
            <Select
              id="filter-status"
              value={status}
              className="py-2.5 text-sm"
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </Select>
          </div>
        </div>

        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <label htmlFor="user-search" className="sr-only">
            Search users by name or email
          </label>
          <TextInput
            id="user-search"
            type="search"
            value={search}
            placeholder="Search name or email…"
            className="rounded-full py-2.5 pl-10 pr-4 text-sm"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {actionNotice && (
        <Alert tone="success" className="mt-6">
          {actionNotice}
        </Alert>
      )}
      {actionError && (
        <Alert tone="error" className="mt-6" title="That didn't work">
          {actionError}
        </Alert>
      )}

      {isLoading ? (
        <LoadingBlock label="Loading users…" />
      ) : loadError ? (
        <Alert
          tone="error"
          className="mt-8"
          title="We couldn't load the user list"
          action={
            <button
              type="button"
              onClick={reload}
              className="text-sm font-medium underline underline-offset-4"
            >
              Retry
            </button>
          }
        >
          {loadError}
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Users className="h-5 w-5" />}
          title={debouncedSearch ? "No users match that search" : "No accounts yet"}
          description={
            debouncedSearch
              ? "Try a different name or email address."
              : "Registered members will appear here once people sign up."
          }
          action={
            debouncedSearch ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-sm font-medium text-burgundy underline-offset-4 hover:underline"
              >
                Clear search
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="mt-6 text-sm text-muted">
            {total} account{total === 1 ? "" : "s"}
            {debouncedSearch && ` matching “${debouncedSearch}”`}
          </p>

          {/* Desktop table */}
          <div className="mt-4 hidden overflow-x-auto rounded-[6px] border border-line lg:block">
            <table className="w-full min-w-[62rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Registered accounts with role, status, sign-up date and contribution count
              </caption>
              <thead className="bg-beige-light/70">
                <tr>
                  {["Name", "Email", "Role", "Status", "Registered", "Contributions", "Actions"].map(
                    (heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((user) => {
                  const busy = busyId === user.id;
                  const isSelf = user.id === currentAdminId;

                  return (
                    <tr key={user.id} className="border-t border-line align-middle">
                      <th scope="row" className="px-4 py-3 font-medium text-ink">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="transition-colors hover:text-burgundy hover:underline"
                        >
                          {user.name}
                        </Link>
                        {isSelf && <span className="ml-2 text-xs text-muted">(you)</span>}
                      </th>
                      <td className="max-w-[16rem] truncate px-4 py-3 text-muted">{user.email}</td>
                      <td className="px-4 py-3">
                        <StatusPill tone={user.role === "admin" ? "brand" : "neutral"}>
                          {user.role}
                        </StatusPill>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill tone={user.isActive ? "approved" : "rejected"}>
                          {user.isActive ? "Active" : "Deactivated"}
                        </StatusPill>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-muted">{user.submissionCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {busy && <Spinner className="h-3.5 w-3.5 text-burgundy" />}
                          {/* Self-protection: an admin can't lock themselves out. */}
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="whitespace-nowrap text-sm font-medium text-charcoal underline-offset-4 hover:text-burgundy hover:underline"
                          >
                            View
                          </Link>
                          {!isSelf && (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void toggleActive(user)}
                                className="whitespace-nowrap text-sm font-medium text-burgundy underline-offset-4 hover:underline disabled:opacity-60"
                              >
                                {user.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void changeRole(user, user.role === "admin" ? "member" : "admin")
                                }
                                className="whitespace-nowrap text-sm font-medium text-muted underline-offset-4 hover:text-burgundy hover:underline disabled:opacity-60"
                              >
                                {user.role === "admin" ? "Make member" : "Make admin"}
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setConfirmDeleteId(user.id)}
                                aria-label={`Delete ${user.name}`}
                                className="text-muted transition-colors hover:text-danger disabled:opacity-60"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {isSelf && (
                            <span className="text-xs text-muted">
                              Your own account is protected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="mt-4 flex flex-col gap-4 lg:hidden">
            {items.map((user) => {
              const busy = busyId === user.id;
              const isSelf = user.id === currentAdminId;

              return (
                <li
                  key={user.id}
                  className="rounded-[6px] border border-line bg-cream p-5 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="transition-colors hover:text-burgundy hover:underline"
                        >
                          {user.name}
                        </Link>
                        {isSelf && <span className="ml-2 text-xs text-muted">(you)</span>}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted">{user.email}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <StatusPill tone={user.role === "admin" ? "brand" : "neutral"}>
                        {user.role}
                      </StatusPill>
                      <StatusPill tone={user.isActive ? "approved" : "rejected"}>
                        {user.isActive ? "Active" : "Off"}
                      </StatusPill>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                        Registered
                      </dt>
                      <dd className="mt-1 text-charcoal">{formatDate(user.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                        Contributions
                      </dt>
                      <dd className="mt-1 text-charcoal">{user.submissionCount}</dd>
                    </div>
                  </dl>

                  {isSelf ? (
                    <p className="mt-4 border-t border-line pt-4 text-xs text-muted">
                      Your own account is protected from deactivation, demotion and deletion.
                    </p>
                  ) : (
                    <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line pt-4">
                      {busy && <Spinner className="h-3.5 w-3.5 text-burgundy" />}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void toggleActive(user)}
                        className="text-sm font-medium text-burgundy underline-offset-4 hover:underline disabled:opacity-60"
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void changeRole(user, user.role === "admin" ? "member" : "admin")
                        }
                        className="text-sm font-medium text-muted underline-offset-4 hover:text-burgundy hover:underline disabled:opacity-60"
                      >
                        {user.role === "admin" ? "Make member" : "Make admin"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmDeleteId(user.id)}
                        className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted underline-offset-4 hover:text-danger hover:underline disabled:opacity-60"
                      >
                        <Trash className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Delete confirmation */}
          {confirmDeleteId && (
            <Alert tone="error" className="mt-6" title="Delete this account?">
              {(() => {
                const user = items.find((row) => row.id === confirmDeleteId);
                if (!user) return null;
                const busy = busyId === user.id;
                return (
                  <>
                    <p>
                      This permanently deletes <span className="font-medium">{user.name}</span>
                      {user.submissionCount > 0 && (
                        <>
                          {" "}
                          and their {user.submissionCount} contribution
                          {user.submissionCount === 1 ? "" : "s"}
                        </>
                      )}
                      . To block sign-in without losing anything, deactivate instead.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void remove(user)}
                        className="inline-flex items-center gap-2 rounded-[3px] bg-danger px-4 py-2 text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
                      >
                        {busy ? <Spinner /> : <Trash className="h-3.5 w-3.5" />}
                        {busy ? "Deleting…" : "Delete permanently"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-sm font-medium underline underline-offset-4 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                );
              })()}
            </Alert>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              aria-label="User list pages"
              className={cn(
                "mt-10 flex items-center justify-between gap-4 border-t border-line pt-6",
              )}
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex items-center gap-2 text-sm font-medium text-burgundy disabled:cursor-not-allowed disabled:text-muted disabled:opacity-60"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Previous
              </button>
              <p className="text-sm text-muted">
                Page {page} of {totalPages}
              </p>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="inline-flex items-center gap-2 text-sm font-medium text-burgundy disabled:cursor-not-allowed disabled:text-muted disabled:opacity-60"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
