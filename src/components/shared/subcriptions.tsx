"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

interface PricingProps {
  user?: {
    email: string;
    name: string;
    role: "student" | "tutor" | "admin";
    plan: "free" | "pro";
  } | null;
}

export default function PricingSection({ user }: PricingProps) {
  const [activeTab, setActiveTab] = useState<"student" | "tutor">("student");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubscribe = async (targetRole: "student" | "tutor", amount: number, planName: string) => {
    if (!user) {
      toast.error("Please sign in first to upgrade your plan");
      router.push("/sign-in");
      return;
    }

    if (user.role !== targetRole) {
      toast.error(`This plan is only available for ${targetRole}s`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access-token")}`,
        },
        body: JSON.stringify({
          userEmail: user.email,
          userName: user.name,
          userRole: user.role,
          planName,
          amount,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to initiate Stripe checkout");
      }
    } catch {
      toast.error("Something went wrong with payment");
    } finally {
      setLoading(false);
    }
  };

  const plans = {
    student: {
      free: {
        name: "Student Free",
        price: 0,
        features: [
          "Browse & filter all approved tuitions",
          "Apply to tuition batches & 1-on-1 sessions",
          "Cancel pending applications anytime",
          "Save up to 5 tuition bookmarks",
        ],
      },
      pro: {
        name: "Student Pro",
        price: 10,
        features: [
          "Everything in Student Free",
          "Unlimited tuition bookmarks",
          "Priority booking on tuition applications",
          "Verified Pro Student profile badge",
        ],
      },
    },
    tutor: {
      free: {
        name: "Tutor Free",
        price: 0,
        features: [
          "Post up to 2 tuition listings",
          "Manage incoming student applicants",
          "Standard listing visibility",
          "Basic tutor profile",
        ],
      },
      pro: {
        name: "Tutor Pro",
        price: 15,
        features: [
          "Everything in Tutor Free",
          "Post unlimited tuition batches",
          "Verified Pro Tutor badge on listings",
          "Higher priority in search results",
        ],
      },
    },
  };

  const currentPlans = plans[activeTab];
  const isProUser = user?.role === activeTab && user?.plan === "pro";

  return (
    <section className="py-16 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-3">Upgrade Your Learning & Teaching Experience</h2>
        <p className="text-base-content/70 max-w-xl mx-auto">
          Start for free or unlock unlimited potential with MentorLagbe Pro.
        </p>

        {/* Role Toggle Tabs */}
        <div className="inline-flex rounded-lg border border-base-300 p-1 mt-6 bg-base-200">
          <button
            onClick={() => setActiveTab("student")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "student" ? "bg-primary text-primary-content shadow" : "hover:text-primary"
            }`}
          >
            For Students
          </button>
          <button
            onClick={() => setActiveTab("tutor")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition ${
              activeTab === "tutor" ? "bg-primary text-primary-content shadow" : "hover:text-primary"
            }`}
          >
            For Tutors
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Free Card */}
        <div className="border border-base-300 rounded-2xl p-8 bg-base-100 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-xl font-semibold">{currentPlans.free.name}</h3>
            <div className="my-4">
              <span className="text-4xl font-bold">${currentPlans.free.price}</span>
              <span className="text-base-content/60"> / lifetime</span>
            </div>
            <ul className="space-y-3 mt-6">
              {currentPlans.free.features.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            disabled
            className="btn btn-outline w-full mt-8"
          >
            {user?.role === activeTab && user?.plan === "free" ? "Current Plan" : "Default Free Tier"}
          </button>
        </div>

        {/* Pro Card */}
        <div className="border-2 border-primary rounded-2xl p-8 bg-base-100 flex flex-col justify-between shadow-lg relative">
          <span className="badge badge-primary absolute -top-3 right-6 gap-1 px-3 py-3">
            <Sparkles className="w-3 h-3" /> Recommended
          </span>
          <div>
            <h3 className="text-xl font-semibold">{currentPlans.pro.name}</h3>
            <div className="my-4">
              <span className="text-4xl font-bold">${currentPlans.pro.price}</span>
              <span className="text-base-content/60"> / one-time</span>
            </div>
            <ul className="space-y-3 mt-6">
              {currentPlans.pro.features.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            disabled={loading || isProUser || (user !== null && user !== undefined && user.role !== activeTab)}
            onClick={() => handleSubscribe(activeTab, currentPlans.pro.price, currentPlans.pro.name)}
            className="btn btn-primary w-full mt-8"
          >
            {isProUser
              ? "Active Pro Plan"
              : loading
              ? "Redirecting..."
              : "Subscribe with Stripe"}
          </button>
        </div>
      </div>
    </section>
  );
}