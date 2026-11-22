import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  MapPin,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ApplyButton } from "@/components/tuitions/apply-button";
import type { Tuition } from "@/lib/action";

type TuitionCardProps = {
  tuition: Tuition;
};

function getInitials(name?: string) {
  if (!name) return "T";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function TuitionCard({ tuition }: TuitionCardProps) {
  const fee = Number(tuition.monthlyFee) || 0;

  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden pt-0">
      <div className="relative h-44 w-full overflow-hidden bg-muted">
        {tuition.bannerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tuition.bannerImage}
            alt={tuition.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-secondary/40">
            <BookOpen className="size-12 text-primary/40" />
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <span className="rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur">
            {tuition.mode}
          </span>
          <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
            {tuition.subject}
          </span>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 py-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            <GraduationCap className="size-3.5" />
            {tuition.classLevel}
          </span>

          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {tuition.daysPerWeek > 0
              ? `${tuition.daysPerWeek} days/week`
              : "Schedule flexible"}
          </span>
        </div>

        <div>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">
            {tuition.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {tuition.description || "No description provided."}
          </p>
        </div>

        <div className="mt-auto space-y-2 border-t pt-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(tuition.tutorName)}
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {tuition.tutorName || "Verified Tutor"}
              </p>
              {tuition.tutorEmail ? (
                <p className="truncate text-xs text-muted-foreground">
                  {tuition.tutorEmail}
                </p>
              ) : null}
            </div>
          </div>

          {tuition.location ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{tuition.location}</span>
            </p>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex-col items-stretch gap-3 border-t bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Monthly fee</p>
          <p className="text-lg font-bold text-foreground">
            ৳{fee.toLocaleString()}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              /month
            </span>
          </p>
        </div>

        <ApplyButton
          tuitionId={tuition.id}
          tuitionTitle={tuition.title}
        />
      </CardFooter>
    </Card>
  );
}
