export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ApplicationStatus = "pending" | "accepted" | "rejected";

export type Application = {
  id: string;
  tuitionId: string;
  tuitionTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  preferredSchedule?: string;
  note?: string;
  status: ApplicationStatus;
  tutorId?: string;
  tutorEmail?: string;
  createdAt?: string;
  updatedAt?: string;
  tuitionApprovalStatus?: string;
  tuitionIsActive?: boolean;
};

export type TutorOverview = {
  stats: {
    totalTuitions: number;
    approvedActiveTuitions: number;
    totalApplicants: number;
    plan: "free" | "pro" | string;
  };
  recentTuitions: Tuition[];
  recentApplicants: Application[];
};

export type TutorPlan = {
  plan: "free" | "pro" | string;
  tuitionCount: number;
  limit: number | null;
  canPost: boolean;
  isPro: boolean;
};

export type Tuition = {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  mode: "Online" | "Offline" | string;
  monthlyFee: number;
  daysPerWeek: number;
  description: string;
  bannerImage?: string;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  tutorId?: string;
  tutorName?: string;
  tutorEmail?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function readErrorMessage(res: Response, fallback: string) {
  const json = await res.json().catch(() => null);
  return json?.message || json?.error?.message || fallback;
}

export const getAllTuitions = async () => {
  const res = await fetch(`${API_URL}/add-tuitions`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to fetch tuitions"));
  }

  return res.json();
};

export const getMyTuitions = async (): Promise<Tuition[]> => {
  const res = await fetch(`${API_URL}/tuitions/mine`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to load your tuitions."));
  }

  return res.json();
};

export const getTuitionById = async (id: string): Promise<Tuition> => {
  const res = await fetch(`${API_URL}/tuitions/${id}`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to load this tuition."));
  }

  return res.json();
};

export const getTutorApplications = async (): Promise<Application[]> => {
  const res = await fetch(`${API_URL}/tutor/applications`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to load applications.")
    );
  }

  return res.json();
};

export const getTutorOverview = async (): Promise<TutorOverview> => {
  const res = await fetch(`${API_URL}/tutor/overview`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to load your dashboard.")
    );
  }

  return res.json();
};

export const getTutorPlan = async (): Promise<TutorPlan> => {
  const res = await fetch(`${API_URL}/tutor/plan`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to load your plan details.")
    );
  }

  return res.json();
};

export type PaymentVerification = {
  plan: "pro" | string;
  sessionId: string;
};

// The backend re-checks the Checkout Session with Stripe before upgrading.
// The redirect query string alone is never trusted.
export const verifyProPayment = async (
  sessionId: string
): Promise<PaymentVerification> => {
  const res = await fetch(
    `${API_URL}/payments/verify?session_id=${encodeURIComponent(sessionId)}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to verify your payment.")
    );
  }

  return res.json();
};
