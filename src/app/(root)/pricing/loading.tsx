import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PricingLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <span className="sr-only">Loading pricing…</span>

      <div className="mx-auto max-w-3xl space-y-3 text-center">
        <Skeleton className="mx-auto h-6 w-40 rounded-full" />
        <Skeleton className="mx-auto h-10 w-96 max-w-full" />
        <Skeleton className="mx-auto h-4 w-full max-w-xl" />
        <Skeleton className="mx-auto h-4 w-4/5 max-w-lg" />
      </div>

      <div className="mt-12 space-y-2 text-center">
        <Skeleton className="mx-auto h-7 w-32" />
        <Skeleton className="mx-auto h-4 w-80 max-w-full" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="overflow-hidden pt-0">
            <Skeleton className="h-1.5 w-full rounded-none" />
            <CardContent className="space-y-4 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <Skeleton className="size-11 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-52 max-w-full" />
                </div>
              </div>
              <Skeleton className="h-10 w-28" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
