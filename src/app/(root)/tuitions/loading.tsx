import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const FILTER_ROWS = Array.from({ length: 5 });
const CARD_ROWS = Array.from({ length: 4 });

export default function TuitionsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <span className="sr-only">Loading tuitions…</span>

      <div className="max-w-2xl space-y-3">
        <Skeleton className="h-6 w-44 rounded-full" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            {FILTER_ROWS.map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <section className="min-w-0">
          <div className="mb-4 space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-28" />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {CARD_ROWS.map((_, index) => (
              <Card key={index} className="overflow-hidden pt-0">
                <Skeleton className="h-44 w-full rounded-none" />
                <CardContent className="space-y-3 py-4">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </CardContent>
                <div className="flex items-center justify-between border-t p-4">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-10 w-28" />
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
