"use client";

import Link from "next/link";
import { Loader2, LockKeyhole, LogIn } from "lucide-react";

import { ApplyButton } from "@/components/tuitions/apply-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type PublicApplyActionProps = {
  tuitionId: string;
  tuitionTitle: string;
};

/**
 * Public catalog CTA. Only students get the apply flow; guests are sent to
 * sign-in and other roles see why they cannot apply.
 */
export function PublicApplyAction({
  tuitionId,
  tuitionTitle,
}: PublicApplyActionProps) {
  const { data: session, isPending } = authClient.useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (isPending) {
    return (
      <Button size="lg" disabled className="w-full sm:w-auto">
        <Loader2 className="animate-spin" />
        Checking…
      </Button>
    );
  }

  if (!session) {
    return (
      <Link
        href={`/sign-in?next=${encodeURIComponent("/tuitions")}`}
        className={cn(
          buttonVariants({ size: "lg" }),
          "w-full sm:w-auto"
        )}
      >
        <LogIn />
        Sign in to apply
      </Link>
    );
  }

  if (role !== "student") {
    return (
      <Button
        size="lg"
        variant="outline"
        disabled
        title="Only students can apply to tuitions."
        className="w-full sm:w-auto"
      >
        <LockKeyhole />
        Students only
      </Button>
    );
  }

  return <ApplyButton tuitionId={tuitionId} tuitionTitle={tuitionTitle} />;
}
