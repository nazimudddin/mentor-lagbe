"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import {
  getAdminUsers,
  type AdminRole,
  type AdminUser,
} from "@/lib/action";
import { updateUserRole } from "@/lib/mutation";
import { cn } from "@/lib/utils";

const roleOptions: AdminRole[] = ["student", "tutor", "admin"];

const roleStyles: Record<string, string> = {
  student: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  tutor: "bg-violet-50 text-violet-700 ring-violet-200",
  admin: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim() || "U";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AdminUsersPage() {
  const { data: session } = authClient.useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const currentUserId = session?.user?.id;

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getAdminUsers();
        if (!cancelled) {
          setUsers(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load users."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(
    () =>
      users.reduce(
        (result, user) => {
          const role = user.role === "tutor" || user.role === "admin"
            ? user.role
            : "student";
          result[role] += 1;
          return result;
        },
        { student: 0, tutor: 0, admin: 0 } as Record<AdminRole, number>
      ),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter(
      (user) =>
        (user.name || "").toLowerCase().includes(query) ||
        (user.email || "").toLowerCase().includes(query)
    );
  }, [users, search]);

  const handleRoleChange = async (user: AdminUser, nextRole: AdminRole) => {
    if (updatingId || user.role === nextRole) return;

    setUpdatingId(user.id);

    try {
      const result = await updateUserRole(user.id, nextRole);
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? result.user : item))
      );
      toast.success(
        `${user.name || user.email} is now a ${nextRole}.`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update user role."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            User Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review registered accounts and change roles between student, tutor,
            and admin.
          </p>
          {!isLoading && !error ? (
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {users.length} total · {counts.student} student
              {counts.student === 1 ? "" : "s"} · {counts.tutor} tutor
              {counts.tutor === 1 ? "" : "s"} · {counts.admin} admin
              {counts.admin === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>

        <Button
          variant="outline"
          onClick={() => void loadUsers()}
          disabled={isLoading}
          className="w-fit gap-1.5"
        >
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {!isLoading && !error && users.length > 0 ? (
        <div className="relative mt-5 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email…"
            aria-label="Search users by name or email"
            className="pl-9"
          />
        </div>
      ) : null}

      <div className="mt-5">
        {isLoading ? (
          <Card className="overflow-hidden">
            <div className="border-b bg-muted/50 px-5 py-3">
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="divide-y">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
              ))}
            </div>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="size-6" />
              </span>
              <h2 className="mt-3 text-base font-semibold">
                Could not load users
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {error}
              </p>
              <Button
                variant="outline"
                onClick={() => void loadUsers()}
                className="mt-4 gap-1.5"
              >
                <RefreshCw className="size-4" />
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                {users.length === 0 ? (
                  <Users className="size-6" />
                ) : (
                  <Search className="size-6" />
                )}
              </span>
              <h2 className="mt-3 text-base font-semibold">
                {users.length === 0
                  ? "No registered users yet"
                  : "No users match your search"}
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {users.length === 0
                  ? "Registered accounts will appear here for role management."
                  : "Try a different name or email address."}
              </p>
              {users.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => setSearch("")}
                  className="mt-4"
                >
                  Clear search
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden pt-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Registered</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Change Role
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredUsers.map((user) => {
                    const isSelf = user.id === currentUserId;
                    const isUpdating = updatingId === user.id;
                    const role = user.role || "student";

                    return (
                      <tr key={user.id} className="hover:bg-muted/40">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
                              {getInitials(user.name, user.email)}
                            </span>
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 truncate font-medium text-foreground">
                                {user.name || "Unnamed user"}
                                {isSelf ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                    <ShieldCheck className="size-3" />
                                    You
                                  </span>
                                ) : null}
                              </p>
                              {user.plan ? (
                                <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                                  {user.plan} plan
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[240px] truncate text-muted-foreground">
                            {user.email || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset",
                              roleStyles[role] ??
                                "bg-slate-50 text-slate-700 ring-slate-200"
                            )}
                          >
                            {role}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {isUpdating ? (
                              <Loader2 className="size-4 animate-spin text-muted-foreground" />
                            ) : null}
                            <select
                              value={role}
                              onChange={(event) =>
                                void handleRoleChange(
                                  user,
                                  event.target.value as AdminRole
                                )
                              }
                              disabled={Boolean(updatingId) || isSelf}
                              aria-label={`Change role for ${
                                user.name || user.email
                              }`}
                              title={
                                isSelf
                                  ? "You cannot change your own admin role."
                                  : "Change this user's role"
                              }
                              className="h-8 min-w-28 rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-60 dark:bg-input/30"
                            >
                              {roleOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option.charAt(0).toUpperCase() +
                                    option.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {!isLoading && !error && filteredUsers.length > 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserRound className="size-3.5" />
          Showing {filteredUsers.length} of {users.length} registered user
          {users.length === 1 ? "" : "s"}.
        </p>
      ) : null}
    </div>
  );
}
