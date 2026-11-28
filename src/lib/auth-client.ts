import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

// Keep every auth operation on the same client instance. Creating a second
// client for useSession caused dashboard navigation to use different config
// from sign-in/sign-up.
export const authClient = createAuthClient({
  // When unset, BetterAuth uses the current origin (localhost or Vercel), which
  // keeps cookies first-party and avoids production-only cookie failures.
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || undefined,
  plugins: [jwtClient()],
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, useSession } = authClient;
