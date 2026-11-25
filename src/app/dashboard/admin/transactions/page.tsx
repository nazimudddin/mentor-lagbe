"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CreditCard,
  RefreshCw,
  Receipt,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAdminTransactions,
  type AdminTransaction,
} from "@/lib/action";
import { cn } from "@/lib/utils";

const roleStyles: Record<string, string> = {
  student: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  tutor: "bg-violet-50 text-violet-700 ring-violet-200",
  admin: "bg-slate-100 text-slate-700 ring-slate-200",
};

function formatAmount(amount: number, currency: string) {
  const value = (Number(amount) || 0) / 100;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAdminTransactions();
      setTransactions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load transactions."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getAdminTransactions();
        if (!cancelled) {
          setTransactions(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load transactions."
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

  const totalRevenue = useMemo(
    () =>
      transactions.reduce(
        (total, transaction) => total + (Number(transaction.amount) || 0),
        0
      ),
    [transactions]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Transaction Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Successful Stripe payments for Tutor Pro and Student Pro upgrades.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => void loadTransactions()}
          disabled={isLoading}
          className="w-fit gap-1.5"
        >
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card size="sm">
          <CardContent className="flex items-center gap-3 py-1">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Receipt className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">
                Successful transactions
              </p>
              <p className="text-lg font-bold text-foreground">
                {isLoading ? "—" : transactions.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardContent className="flex items-center gap-3 py-1">
            <span className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <TrendingUp className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Total revenue</p>
              <p className="text-lg font-bold text-foreground">
                {isLoading
                  ? "—"
                  : formatAmount(totalRevenue, "usd")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <Card className="overflow-hidden">
            <div className="border-b bg-muted/50 px-5 py-3">
              <Skeleton className="h-3 w-44" />
            </div>
            <div className="divide-y">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24 rounded-full" />
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
                Could not load transactions
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {error}
              </p>
              <Button
                variant="outline"
                onClick={() => void loadTransactions()}
                className="mt-4 gap-1.5"
              >
                <RefreshCw className="size-4" />
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CreditCard className="size-6" />
              </span>
              <h2 className="mt-3 text-base font-semibold">
                No successful transactions yet
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Completed Stripe payments will appear here once a tutor or
                student upgrades to Pro.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden pt-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Plan</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Transaction ID</th>
                    <th className="px-5 py-3 font-medium">Payment Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-muted/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <UserRound className="size-4" />
                          </span>
                          <p className="max-w-[180px] truncate font-medium text-foreground">
                            {transaction.userName || "Unknown user"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-[220px] truncate text-muted-foreground">
                          {transaction.userEmail || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset",
                            roleStyles[transaction.role] ??
                              "bg-slate-50 text-slate-700 ring-slate-200"
                          )}
                        >
                          {transaction.role || "unknown"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">
                          {transaction.planName || "—"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {transaction.plan}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground">
                          {formatAmount(
                            transaction.amount,
                            transaction.currency
                          )}
                        </p>
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Paid
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p
                          className="max-w-[220px] truncate font-mono text-xs text-muted-foreground"
                          title={transaction.transactionId || undefined}
                        >
                          {transaction.transactionId || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {formatDate(transaction.paymentDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {!isLoading && !error && transactions.length > 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          Showing {transactions.length} successful transaction
          {transactions.length === 1 ? "" : "s"}. Pending and failed payments are
          excluded.
        </p>
      ) : null}
    </div>
  );
}
