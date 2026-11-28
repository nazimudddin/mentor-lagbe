import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "@better-auth/mongo-adapter";

const client = new MongoClient(process.env.MONGODB_URI as string);
const db = client.db("mentor-lagbe");

// BetterAuth needs a stable public origin so cookies, OAuth callbacks and JWT
// issuer/audience are identical on every deployment. On Vercel set
// BETTER_AUTH_URL to the production URL (for example https://app.vercel.app).
const vercelOrigins = [
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_URL,
]
  .filter((host): host is string => Boolean(host))
  .map((host) => `https://${host}`);

const appUrl = (
  process.env.BETTER_AUTH_URL ||
  vercelOrigins[0] ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

// Comma-separated allowlist. Localhost and the Vercel deployment URLs are added
// automatically so email and Google sign-in keep working on both.
const trustedOrigins = Array.from(
  new Set(
    [
      appUrl,
      process.env.NEXT_PUBLIC_APP_URL,
      ...vercelOrigins,
      "http://localhost:3000",
      ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS || "").split(","),
    ]
      .map((origin) => origin?.trim().replace(/\/$/, ""))
      .filter((origin): origin is string => Boolean(origin))
  )
);

// Keep these values stable across the Next.js app and the Express API. The
// backend verifies JWTs against the same issuer/audience (see server/index.js).
const jwtIssuer = process.env.JWT_ISSUER || "mentorlagbe";
const jwtAudience = process.env.JWT_AUDIENCE || "mentorlagbe";

export const auth = betterAuth({
  baseURL: appUrl,
  trustedOrigins,

  database: mongodbAdapter(db, {
    client,
  }),

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: true,
      },

      plan: {
        type: "string",
        required: false,
        defaultValue: "free",
        input: false,
      },
    },
  },

  plugins: [
    // Issues short-lived JWTs at /api/auth/token and exposes the public keys
    // at /api/auth/jwks for the Express backend to verify them.
    jwt({
      jwt: {
        issuer: jwtIssuer,
        audience: jwtAudience,
        expirationTime: "1h",
      },
    }),
  ],

  advanced: {
    // The Next.js proxy keeps auth and API requests on the same origin, so
    // SameSite=Lax is enough and avoids the cross-site cookie problems that
    // appear when the browser calls Express directly on another domain.
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
  },
});
