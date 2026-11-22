"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  UserRound,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Browse Tuitions", href: "/tuitions" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
];

const NavbarPage = () => {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: session, isPending } = authClient.useSession();

  const user = session?.user;

  const role = (user as { role?: string } | undefined)?.role || "student";

  const userName = user?.name || "User";

  const userImage = user?.image;

  const userEmail = user?.email;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await authClient.signOut();

    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/90 backdrop-blur-xl">

      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-content shadow-md">
            <GraduationCap size={26} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Mentor<span className="text-primary">Lagbe</span>
            </h1>

            <p className="text-[10px] font-medium tracking-widest opacity-60">
              FIND YOUR PERFECT MENTOR
            </p>
          </div>

        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 lg:flex">

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                isActive(link.href)
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-base-200"
              }`}
            >
              {link.name}
            </Link>
          ))}

        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {/* Session Loading */}
          {isPending ? (
            <div className="skeleton h-10 w-28 rounded-full" />
          ) : user ? (

            /* Logged In User Dropdown */
            <div className="dropdown dropdown-end hidden lg:block">

              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-base-300 p-1.5 pr-3 transition hover:bg-base-200"
              >

                {/* Avatar */}
                <div className="avatar">

                  <div className="h-9 w-9 rounded-full">

                    {userImage ? (
                      <img
                        src={userImage}
                        alt={userName}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-content">
                        {getInitials(userName)}
                      </div>
                    )}

                  </div>

                </div>

                {/* User Info */}
                <div className="text-left">

                  <p className="max-w-28 truncate text-sm font-semibold">
                    {userName}
                  </p>

                  <p className="text-xs capitalize opacity-60">
                    {role}
                  </p>

                </div>

                <ChevronDown size={16} />

              </button>

              {/* Dropdown Content */}
              {dropdownOpen && (
                <div className="dropdown-content z-50 mt-3 w-64 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl">

                  {/* User Information */}
                  <div className="px-3 py-3">

                    <p className="font-semibold">
                      {userName}
                    </p>

                    <p className="truncate text-xs opacity-60">
                      {userEmail}
                    </p>

                    <div className="mt-2">
                      <span className="badge badge-primary badge-sm capitalize">
                        {role}
                      </span>
                    </div>

                  </div>

                  <div className="divider my-1" />

                  {/* Dashboard */}
                  <Link
                    href={`/dashboard/${role}/overview`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-base-200"
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </Link>

                  {/* Profile */}
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-base-200"
                  >
                    <UserRound size={18} />
                    Update Profile
                  </Link>

                  <div className="divider my-1" />

                  {/* Sign Out */}
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-error hover:bg-error/10"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>

                </div>
              )}

            </div>

          ) : (

            /* Logged Out */
            <div className="hidden items-center gap-2 lg:flex">

              <Link
                href="/sign-in"
                className="btn btn-ghost rounded-full"
              >
                Sign In
              </Link>

              <Link
                href="/sign-up"
                className="btn btn-primary rounded-full px-6"
              >
                Get Started
              </Link>

            </div>

          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost btn-square lg:hidden"
          >
            {mobileMenuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>

        </div>

      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-base-300 bg-base-100 lg:hidden">

          <div className="mx-auto max-w-7xl space-y-2 px-4 py-5">

            {/* Navigation Links */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm font-medium ${
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-base-200"
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="divider my-3" />

            {/* Mobile Logged In User */}
            {user ? (

              <div className="space-y-3">

                {/* User Info */}
                <div className="flex items-center gap-3 rounded-xl bg-base-200 p-3">

                  <div className="avatar">

                    <div className="h-11 w-11 rounded-full">

                      {userImage ? (
                        <img src={userImage} alt={userName} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary text-primary-content">
                          {getInitials(userName)}
                        </div>
                      )}

                    </div>

                  </div>

                  <div className="min-w-0">

                    <p className="truncate font-semibold">
                      {userName}
                    </p>

                    <p className="truncate text-xs opacity-60">
                      {userEmail}
                    </p>

                    <span className="badge badge-primary badge-sm mt-1 capitalize">
                      {role}
                    </span>

                  </div>

                </div>

                {/* Dashboard */}
                <Link
                  href={`/dashboard/${role}/overview`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-outline w-full justify-start"
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>

                {/* Profile */}
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-outline w-full justify-start"
                >
                  <UserRound size={18} />
                  Update Profile
                </Link>

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="btn btn-error btn-outline w-full"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>

              </div>

            ) : (

              /* Mobile Logged Out */
              <div className="flex flex-col gap-3">

                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-outline w-full"
                >
                  Sign In
                </Link>

                <Link
                  href="/sign-up"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-primary w-full"
                >
                  Get Started
                </Link>

              </div>

            )}

          </div>

        </div>
      )}

    </header>
  );
};

export default NavbarPage;