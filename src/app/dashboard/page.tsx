"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function DashboardIndexPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.replace("/sign-in?next=/dashboard");
      return;
    }

    const role = (session?.user as { role?: string } | undefined)?.role;

    if (role === "admin") {
      router.replace("/dashboard/admin");
    } else if (role === "tutor") {
      router.replace("/dashboard/tutor/overview");
    } else {
      router.replace("/dashboard/student/overview");
    }
  }, [session, isPending, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="text-sm">Redirecting to your dashboard…</p>
      </div>
    </div>
  );
}
