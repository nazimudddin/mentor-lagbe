import { API_URL, type Application, type Tuition } from "./action";

export type TuitionInput = {
  title: string;
  subject: string;
  classLevel: string;
  mode: "Online" | "Offline";
  monthlyFee: number;
  daysPerWeek: number;
  description: string;
  tutorName: string;
  tutorEmail: string;
  approvalStatus: "pending";
  isActive: boolean;
};

export type TuitionUpdateInput = {
  title: string;
  subject: string;
  classLevel: string;
  mode: "Online" | "Offline";
  monthlyFee: number;
  daysPerWeek: number;
  description: string;
};

async function uploadBanner(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
  if (!apiKey) throw new Error("Image upload is not configured.");

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: formData,
  });
  const json = await res.json();

  if (!res.ok || !json?.data?.url) {
    throw new Error(json?.error?.message || "Failed to upload banner image.");
  }

  return json.data.url as string;
}

async function readErrorMessage(res: Response, fallback: string) {
  const json = await res.json().catch(() => null);
  return json?.message || json?.error?.message || fallback;
}

export async function postTuition(
  data: TuitionInput,
  bannerFile: File | null
) {
  const bannerImage = bannerFile ? await uploadBanner(bannerFile) : "";

  const res = await fetch(`${API_URL}/add-tuitions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, bannerImage }),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to post tuition."));
  }

  return res.json();
}

export async function updateTuition(
  id: string,
  data: TuitionUpdateInput,
  bannerFile: File | null
): Promise<Tuition> {
  const body: TuitionUpdateInput & { bannerImage?: string } = { ...data };

  if (bannerFile) {
    body.bannerImage = await uploadBanner(bannerFile);
  }

  const res = await fetch(`${API_URL}/tuitions/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to update tuition."));
  }

  return res.json();
}

export async function deleteTuition(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/tuitions/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to delete tuition."));
  }
}

export async function toggleTuitionActive(
  id: string,
  isActive: boolean
): Promise<Tuition> {
  const res = await fetch(`${API_URL}/tuitions/${id}/active`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to update tuition status.")
    );
  }

  return res.json();
}

export async function updateApplicationStatus(
  id: string,
  status: "accepted" | "rejected"
): Promise<Application> {
  const res = await fetch(`${API_URL}/applications/${id}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to update application status.")
    );
  }

  return res.json();
}

// The backend returns a Stripe-hosted Checkout URL. The browser redirects to
// Stripe's payment page; no card data ever touches this app.
export type ProCheckout = {
  url: string;
  sessionId: string;
  publishableKey?: string;
};

export async function createProCheckout(): Promise<ProCheckout> {
  const res = await fetch(`${API_URL}/payments/checkout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan: "tutor_pro" }),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to start checkout."));
  }

  return res.json();
}


export type ProfileUpdateInput = {
  name: string;
  phone: string;
  bio: string;
  image?: string;
};

export async function updateProfile(data: ProfileUpdateInput) {
  const res = await fetch(`${API_URL}/profile`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to update profile.")
    );
  }

  return res.json();
}

export async function uploadProfileImage(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error("Image upload is not configured.");
  }

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${apiKey}`,
    {
      method: "POST",
      body: formData,
    }
  );

  const json = await res.json();

  if (!res.ok || !json?.data?.url) {
    throw new Error(
      json?.error?.message || "Failed to upload profile image."
    );
  }

  return json.data.url;
}