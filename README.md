This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Authentication architecture

- BetterAuth (email/password + Google) runs inside this Next.js app at `/api/auth/*`.
- The BetterAuth **JWT plugin** issues a short-lived token at `/api/auth/token` and
  publishes verification keys at `/api/auth/jwks`.
- Browser calls to the Express API go through the same-origin proxy at
  `/api/proxy/*` (`src/app/api/proxy/[...path]/route.ts`). The proxy reads the
  BetterAuth session cookie, mints a JWT, and forwards both the cookie and
  `Authorization: Bearer <jwt>` to Express. Express verifies the JWT, loads the
  user from MongoDB, and applies `verifyStudent` / `verifyTutor` / `verifyAdmin`.
- Because the browser never calls Express cross-origin, auth works on localhost
  and Vercel without third-party cookies. `SameSite=Lax` + `Secure` (on HTTPS) is
  sufficient.

### Required environment variables

Next.js (`.env` locally, Project Settings on Vercel):

```bash
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://your-app.vercel.app   # public app origin
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
API_ORIGIN=https://your-express-api.example.com
MONGODB_URI=...
GOOGLE_CLIENT_ID=...
GOOGLE_SECRET=...
```

Express (`mentorLagbe-server/.env`):

```bash
PORT=5000
CLIENT_URL=https://your-app.vercel.app
BETTER_AUTH_URL=https://your-app.vercel.app   # used to fetch /api/auth/jwks
JWT_ISSUER=mentorlagbe
JWT_AUDIENCE=mentorlagbe
MONGODB_URI=...
```

`JWT_ISSUER` and `JWT_AUDIENCE` must match in both apps. If they are omitted,
both default to `mentorlagbe`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
