import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Users,
  ShieldCheck,
  Search,
  UserCheck,
  CreditCard,
  GraduationCap,
  CheckCircle2,
  Target,
  HeartHandshake,
} from "lucide-react";

export const metadata = {
  title: "About Us | MentorLagbe",
  description:
    "Learn about MentorLagbe, our mission, features and how our tuition platform works.",
};

const features = [
  {
    icon: Search,
    title: "Find the Right Tuition",
    description:
      "Students can browse available tuitions and find opportunities using subject, class, mode and fee filters.",
  },
  {
    icon: Users,
    title: "Connect with Tutors",
    description:
      "Students and tutors can connect through a simple application and tuition management system.",
  },
  {
    icon: ShieldCheck,
    title: "Admin Approval",
    description:
      "Admins review tuition posts and approve or reject them to maintain platform quality.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description:
      "Stripe-powered payments allow students and tutors to upgrade their accounts to Pro plans.",
  },
];

const steps = [
  {
    number: "01",
    icon: GraduationCap,
    title: "Create an Account",
    description:
      "Sign up as a student or tutor and complete your profile to get started.",
  },
  {
    number: "02",
    icon: Search,
    title: "Explore Opportunities",
    description:
      "Students browse available tuitions, while tutors can create and manage tuition posts.",
  },
  {
    number: "03",
    icon: UserCheck,
    title: "Connect & Apply",
    description:
      "Students apply for suitable tuitions and tutors manage incoming applications.",
  },
  {
    number: "04",
    icon: CheckCircle2,
    title: "Manage Everything",
    description:
      "Track applications, manage tuition activities and upgrade your plan when needed.",
  },
];

const benefits = [
  "Easy tuition search and filtering",
  "Dedicated student and tutor dashboards",
  "Application and tuition management",
  "Admin-controlled tuition approval",
  "Free and Pro subscription plans",
  "Stripe-powered payment system",
];

const primaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90";

const outlineButton =
  "inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-semibold transition-colors hover:bg-muted";

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary/5 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <BookOpen className="size-4" />
            About MentorLagbe
          </span>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Connecting Students with the{" "}
            <span className="text-primary">Right Tutors</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            MentorLagbe is a smart tuition and mentorship platform designed
            to make finding tuition opportunities and connecting with tutors
            easier, simpler and more accessible.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link href="/tuitions" className={primaryButton}>
              Explore Tuitions
              <ArrowRight className="size-4" />
            </Link>

            <Link href="/pricing" className={outlineButton}>
              Explore Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:grid-cols-2 sm:px-6 lg:px-8">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Our Mission
            </span>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Making Education Opportunities More Accessible
            </h2>

            <p className="mt-6 leading-8 text-muted-foreground">
              Finding the right tutor or a suitable tuition opportunity
              should not be complicated. MentorLagbe brings students and
              tutors together through one organized platform.
            </p>

            <p className="mt-4 leading-8 text-muted-foreground">
              Our goal is to simplify tuition discovery, application
              management and communication while providing useful tools
              for students, tutors and administrators.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border bg-card p-6">
              <GraduationCap className="size-9 text-primary" />
              <h3 className="mt-5 font-semibold">For Students</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Discover suitable tuition opportunities and manage
                applications.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border bg-card p-6">
              <Users className="size-9 text-primary" />
              <h3 className="mt-5 font-semibold">For Tutors</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Post tuition opportunities and manage student applications.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <ShieldCheck className="size-9 text-primary" />
              <h3 className="mt-5 font-semibold">For Admins</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Manage users, review tuitions and monitor transactions.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border bg-card p-6">
              <HeartHandshake className="size-9 text-primary" />
              <h3 className="mt-5 font-semibold">One Platform</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A simple platform connecting the entire tuition community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              What We Offer
            </span>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Everything You Need in One Platform
            </h2>

            <p className="mt-4 leading-7 text-muted-foreground">
              Useful features designed to make tuition management easier
              for everyone.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Simple Process
            </span>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              How MentorLagbe Works
            </h2>

            <p className="mt-4 leading-7 text-muted-foreground">
              Get started with just a few simple steps.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.number}>
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-7" />
                  </div>

                  <span className="mt-6 block text-sm font-bold text-primary">
                    STEP {step.number}
                  </span>

                  <h3 className="mt-2 text-xl font-semibold">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Target className="size-7" />
          </div>

          <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
            Why Choose MentorLagbe?
          </h2>

          <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
            {benefits.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border bg-card p-4"
              >
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to Get Started?
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-7 opacity-90">
            Whether you are looking for a tutor or searching for tuition
            opportunities, MentorLagbe is here to help you take the next step.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/tuitions"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-background/90"
            >
              Find Tuitions
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/sign-up"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-primary-foreground/40 px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground hover:text-primary"
            >
              Join MentorLagbe
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}