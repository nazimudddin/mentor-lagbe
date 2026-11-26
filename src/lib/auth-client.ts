import { createAuthClient } from "better-auth/react";

// Keep every auth operation on the same client instance. Creating a second
// client for useSession caused dashboard navigation to use different config
// from sign-in/sign-up.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

export const { signIn, signUp, useSession } = authClient;
