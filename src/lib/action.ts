export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

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
  tutorName?: string;
  monthlyFee?: number;
  studentPlan?: "free" | "pro" | string;
  studentIsPro?: boolean;
};

export type TutorOverview = {
  stats: {
    totalTuitions: number;
    approvedActiveTuitions: number;
    totalApplicants: number;
    acceptedApplications: number;
    tuitionLimit: number | null;
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

export type StudentPlan = {
  plan: "free" | "pro" | string;
  status?: "active" | "free" | string;
  isPro: boolean;
  price: number;
  currency: string;
  since?: string | null;
  expiresAt?: string | null;
  savedCount?: number;
  savedLimit?: number | null;
  canSaveMore?: boolean;
};

export type PaymentRecord = {
  id: string;
  plan: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded" | string;
  createdAt?: string;
  completedAt?: string;
};

export type AdminTransaction = {
  id: string;
  userName: string;
  userEmail: string;
  role: string;
  plan: string;
  planName: string;
  amount: number;
  currency: string;
  status: "completed" | string;
  transactionId: string;
  paymentDate?: string | null;
};

export type AdminRole = "student" | "tutor" | "admin";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole | string;
  plan?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AdminOverview = {
  stats: {
    totalUsers: number;
    totalStudents: number;
    totalTutors: number;
    totalAdmins: number;
    totalTuitions: number;
    pendingTuitions: number;
    approvedTuitions: number;
    rejectedTuitions: number;
    completedPayments: number;
    totalRevenue: number;
    currency: string;
  };
};

export type StudentOverview = {
  stats: {
    totalApplications: number;
    pendingApplications: number;
    acceptedApplications: number;
    rejectedApplications: number;
    savedTuitions: number;
    plan: "free" | "pro" | string;
  };
  recentApplications: Application[];
};

export type ProfileData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  image: string;
  role: string;
  plan: string;
  proSince?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SavedTuition = Tuition & {
  savedAt?: string;
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
  rejectionReason?: string;
  isActive: boolean;
  tutorId?: string;
  tutorName?: string;
  tutorEmail?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
  applicationsCount?: number;
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

type RawTuition = Partial<Omit<Tuition, "id">> & {
  _id?: string;
  id?: string;
};

function normalizeTuition(raw: RawTuition): Tuition {
  return {
    id: raw.id ?? raw._id ?? "",
    title: raw.title ?? "Untitled tuition",
    subject: raw.subject ?? "General",
    classLevel: raw.classLevel ?? "Not specified",
    mode: raw.mode ?? "Online",
    monthlyFee: Number(raw.monthlyFee) || 0,
    daysPerWeek: Number(raw.daysPerWeek) || 0,
    description: raw.description ?? "",
    bannerImage: raw.bannerImage,
    approvalStatus: raw.approvalStatus ?? "pending",
    rejectionReason: raw.rejectionReason,
    isActive: raw.isActive !== false,
    tutorId: raw.tutorId,
    tutorName: raw.tutorName,
    tutorEmail: raw.tutorEmail,
    location: raw.location,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// The public list endpoint returns raw Mongo documents (`_id`). Normalise the
// shape and additionally keep approved, active tuitions only so the public
// Browse Tuitions page can never render a pending or rejected post.
export type TuitionSearchParams = {
  q?: string;
  subject?: string;
  classLevel?: string;
  mode?: string;
  minFee?: string;
  maxFee?: string;
};

export const getApprovedTuitions = async (
  params?: TuitionSearchParams
): Promise<Tuition[]> => {
  const searchParams = new URLSearchParams();

  if (params?.q) searchParams.set("q", params.q);
  if (params?.subject) searchParams.set("subject", params.subject);
  if (params?.classLevel) searchParams.set("classLevel", params.classLevel);
  if (params?.mode) searchParams.set("mode", params.mode);
  if (params?.minFee) searchParams.set("minFee", params.minFee);
  if (params?.maxFee) searchParams.set("maxFee", params.maxFee);

  const query = searchParams.toString();

  const res = await fetch(
    `${API_URL}/add-tuitions${query ? `?${query}` : ""}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to fetch tuitions"));
  }

  const data: unknown = await res.json();

  if (!Array.isArray(data)) return [];

  return (data as RawTuition[])
    .map(normalizeTuition)
    .filter(
      (tuition) =>
        Boolean(tuition.id) &&
        tuition.approvalStatus === "approved" &&
        tuition.isActive
    );
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

export const getAdminTuitions = async (): Promise<Tuition[]> => {
  const res = await fetch(`${API_URL}/admin/tuitions`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to load tuitions.")
    );
  }

  const data: unknown = await res.json();

  if (!Array.isArray(data)) return [];

  return (data as RawTuition[])
    .map(normalizeTuition)
    .filter((tuition) => Boolean(tuition.id));
};

export const getAdminTransactions = async (): Promise<AdminTransaction[]> => {
  const res = await fetch(`${API_URL}/admin/transactions`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to load transactions.")
    );
  }

  const data: unknown = await res.json();

  if (!Array.isArray(data)) return [];

  return data as AdminTransaction[];
};

export const getAdminOverview = async (): Promise<AdminOverview> => {
  const res = await fetch(`${API_URL}/admin/overview`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to load admin statistics.")
    );
  }

  return res.json();
};

export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const res = await fetch(`${API_URL}/admin/users`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to load users."));
  }

  const data: unknown = await res.json();

  if (!Array.isArray(data)) return [];

  return data as AdminUser[];
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

export const getPublicTuitionById = async (id: string): Promise<Tuition> => {
  const res = await fetch(`${API_URL}/public-tuitions/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to load this tuition."));
  }

  return normalizeTuition((await res.json()) as RawTuition);
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

export const getStudentPlan = async (): Promise<StudentPlan> => {
  const res = await fetch(`${API_URL}/student/plan`, {
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

export const getMyPayments = async (): Promise<PaymentRecord[]> => {
  const res = await fetch(`${API_URL}/payments/mine`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to load your payment history.")
    );
  }

  const data: unknown = await res.json();

  if (!Array.isArray(data)) return [];

  return data as PaymentRecord[];
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


export const getMyApplications = async (): Promise<Application[]> => {
  const res = await fetch(`${API_URL}/student/applications`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to load your applications.")
    );
  }

  return res.json();
};

export const getStudentOverview = async (): Promise<StudentOverview> => {
  const res = await fetch(`${API_URL}/student/overview`, {
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

export const getSavedTuitions = async (): Promise<SavedTuition[]> => {
  const res = await fetch(`${API_URL}/saved-tuitions`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to load your saved tuitions.")
    );
  }

  const data: unknown = await res.json();

  if (!Array.isArray(data)) return [];

  return (data as (RawTuition & { savedAt?: string })[])
    .map((raw) => ({
      ...normalizeTuition(raw),
      savedAt: raw.savedAt,
    }))
    .filter((tuition) => Boolean(tuition.id));
};

export const getMyProfile = async (): Promise<ProfileData> => {
  const res = await fetch(`${API_URL}/profile`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to load your profile."));
  }

  return res.json();
};
