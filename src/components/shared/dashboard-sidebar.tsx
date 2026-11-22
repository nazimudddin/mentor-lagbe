"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  BookOpen,
  Bookmark,
  User,
  FileText,
  Users,
  PlusCircle,
  CreditCard,
  GraduationCap,
  Settings,
} from "lucide-react";

import { useSession } from "@/lib/auth-client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
type UserRole = "student" | "tutor" | "admin";
const dashboardSidebarItem = {
  student: [
    {
      title: "Overview",
      href: "/dashboard/student/overview",
      icon: LayoutDashboard,
    },
    {
      title: "Browse Tuitions",
      href: "/tuitions",
      icon: BookOpen,
    },
    {
      title: "My Applications",
      href: "/dashboard/student/my-applications",
      icon: FileText,
    },
    {
      title: "Saved Tuitions",
      href: "/dashboard/student/saved-tuitions",
      icon: Bookmark,
    },
    {
      title: "Update Profile",
      href: "/dashboard/student/update-profile",
      icon: User,
    },
  ],

  tutor: [
    {
      title: "Overview",
      href: "/dashboard/tutor/overview",
      icon: LayoutDashboard,
    },
    {
      title: "Post Tuition",
      href: "/dashboard/tutor/post-tuition",
      icon: PlusCircle,
    },
    {
      title: "My Tuitions",
      href: "/dashboard/tutor/my-tuitions",
      icon: BookOpen,
    },
    {
      title: "Applicants",
      href: "/dashboard/tutor/applicants",
      icon: Users,
    },
    {
      title: "Update Profile",
      href: "/dashboard/tutor/update-profile",
      icon: User,
    },
  ],

  admin: [
    {
      title: "Overview",
      href: "/dashboard/admin/overview",
      icon: LayoutDashboard,
    },
    {
      title: "Manage Users",
      href: "/dashboard/admin/users",
      icon: Users,
    },
    {
      title: "Manage Tuitions",
      href: "/dashboard/admin/tuitions",
      icon: BookOpen,
    },
    {
      title: "Transactions",
      href: "/dashboard/admin/transactions",
      icon: CreditCard,
    },
    {
      title: "Update Profile",
      href: "/dashboard/admin/update-profile",
      icon: User,
    },
  ],
};

export function DashboardSidebar() {
  const pathname = usePathname();

  const { data: session } = useSession();

const role = (session?.user as { role?: UserRole } | undefined)?.role;
  const sidebarItems = role
    ? dashboardSidebarItem[role]
    : [];

  return (
    <Sidebar>
      {/* Sidebar Header */}
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-4"
        >
          <GraduationCap className="h-7 w-7 text-primary" />

          <span className="text-xl font-bold">
            MentorLagbe
          </span>
        </Link>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {role
              ? `${role.charAt(0).toUpperCase()}${role.slice(1)} Dashboard`
              : "Dashboard"}
          </SidebarGroupLabel>

          <SidebarMenu>
            {sidebarItems.map((item) => {
              const Icon = item.icon;

              const isActive = pathname === item.href;

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
  render={<Link href={item.href} />}
  isActive={isActive}
>
  <Icon />
  <span>{item.title}</span>
</SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
             <SidebarMenuButton
  render={<Link href="/" />}
>
  <Settings />
  <span>Back to Home</span>
</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}