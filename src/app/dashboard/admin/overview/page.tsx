import { redirect } from "next/navigation";

export default function AdminOverviewRedirectPage() {
  redirect("/dashboard/admin");
}
