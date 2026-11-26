"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";

function LoadingShell() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="text-sm">Checking your account…</p>
      </div>
    </div>
  );
}

export default function TutorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isTutor = Boolean(session) && role === "tutor";

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (role && role !== "tutor") {
      router.replace(`/dashboard/${role}/overview`);
      return;
    }

    if (!role) router.replace("/");
  }, [isPending, pathname, role, router, session]);

  if (isPending || !isTutor) return <LoadingShell />;

  return children;
}
