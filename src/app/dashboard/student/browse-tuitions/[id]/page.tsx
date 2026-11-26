import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  GraduationCap,
  MapPin,
  UserRound,
} from "lucide-react";

import { ApplyButton } from "@/components/tuitions/apply-button";
import { SaveTuitionButton } from "@/components/tuitions/save-tuition-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicTuitionById } from "@/lib/action";

export default async function TuitionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let tuition;

  try {
    tuition = await getPublicTuitionById(id);
  } catch {
    notFound();
  }

  const fee = Number(tuition.monthlyFee) || 0;

  return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Button variant="ghost" className="gap-1.5" render={<Link href="/dashboard/student/browse-tuitions" />}>
          <ArrowLeft className="size-4" />
          Back to browse
        </Button>

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="min-w-0 space-y-6">
            <Card className="overflow-hidden pt-0">
              {tuition.bannerImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tuition.bannerImage} alt={tuition.title} className="h-64 w-full object-cover sm:h-80" />
              ) : (
                <div className="flex h-64 items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-secondary/40 sm:h-80">
                  <BookOpen className="size-16 text-primary/40" />
                </div>
              )}
              <CardContent className="p-5 sm:p-7">
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{tuition.subject}</span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{tuition.mode}</span>
                </div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{tuition.title}</h1>
                <p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted-foreground">{tuition.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 sm:p-6">
                <h2 className="text-base font-semibold">Tuition details</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Detail icon={GraduationCap} label="Class level" value={tuition.classLevel} />
                  <Detail icon={CalendarDays} label="Schedule" value={`${tuition.daysPerWeek || "Flexible"}${tuition.daysPerWeek ? " days/week" : ""}`} />
                  <Detail icon={MapPin} label="Location" value={tuition.location || "Not specified"} />
                  <Detail icon={UserRound} label="Tutor" value={tuition.tutorName || "Verified Tutor"} />
                </div>
              </CardContent>
            </Card>
          </main>

          <aside className="h-fit lg:sticky lg:top-6">
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Monthly fee</p>
                <p className="mt-1 text-3xl font-bold">৳{fee.toLocaleString()}<span className="ml-1 text-sm font-normal text-muted-foreground">/month</span></p>
                <div className="mt-5 space-y-2">
                  <ApplyButton tuitionId={tuition.id} tuitionTitle={tuition.title} />
                  <SaveTuitionButton tuitionId={tuition.id} tuitionTitle={tuition.title} showLabel className="h-10 w-full gap-2 rounded-lg border bg-background px-4 text-sm font-medium" />
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
