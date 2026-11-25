# MentorLagbe — Agent Blueprint

> **Status:** Implementation in progress (updated 2026-11-24). The student dashboard
> features, the Student Pro $10 checkout/webhook flow, the Free 5-bookmark cap,
> unlimited Pro bookmarks, and Pro-first applicant ranking are implemented. See
> §19–§21 for the latest completed/remaining list.
>
> **Project root:** `mentor-lagbe` · **Database:** `mentor-lagbe` · **Today:** 2026-11-24

## Contents

1. [Product summary](#1-product-summary)
2. [Current repository audit](#2-current-repository-audit-2026-11-20)
3. [Locked architecture decisions](#3-locked-architecture-decisions)
4. [Target directory tree](#4-target-directory-tree)
5. [Data model](#5-data-model)
6. [Auth, session & authorization](#6-auth-session--authorization)
7. [API blueprint](#7-api-blueprint)
8. [Payments (Stripe)](#8-payments-stripe)
9. [Uploads (ImgBB)](#9-uploads-imgbb)
10. [Pages, routes & behaviors](#10-pages-routes--behaviors)
11. [UI/UX blueprint](#11-uiux-blueprint)
12. [Seed data & test accounts](#12-seed-data--test-accounts)
13. [Environment variables](#13-environment-variables)
14. [Delivery phases](#14-delivery-phases-implementation-order)
15. [Definition of done & QA matrix](#15-definition-of-done--qa-matrix)
16. [Progress log format](#16-progress-log-format-progressmd)
17. [Risks & gotchas](#17-risks-gotchas--edge-cases)
18. [Open decisions](#18-open-decisions-defaults-chosen)

---

## 0. Mandatory progress rule (read first)

After **every** task, update `PROGRESS.md` in the repo root with:

1. **Completed** — what was finished, with file paths and verification commands.
2. **Remaining** — what is still pending, in priority order.
3. **Blockers / decisions** — anything that needs a human answer.

Rules:

- Update `PROGRESS.md` in the **same commit** as the work it describes.
- Never delete history; add a new dated entry at the top.
- If a task changes an architectural decision, update this blueprint too.
- A task is not "done" until lint, type-check, and build pass (or the failure is
  recorded in `PROGRESS.md` with the exact error).

---

## 1. Product summary

MentorLagbe is a role-based **Smart Tuition & Mentorship Platform** that connects:

| Role | Main job |
|---|---|
| **Guest** | Browse approved tuitions, view details, read pricing, sign up |
| **Student** | Apply to tuitions, track/cancel applications, upgrade to Student Pro |
| **Tutor** | Post/manage tuitions, review applicants, upgrade to Tutor Pro |
| **Admin** | Moderate tuitions, manage users/roles, view Stripe revenue |

Core loop:

```
Tutor posts tuition (pending)
  → Admin approves it
  → Student searches and applies
  → Tutor accepts/rejects
  → Accepted student is connected with the tutor
```

Monetisation:

- **Free student:** max **5** saved tuitions; applying and tracking stay unlimited.
- **Free tutor:** max **2** tuition posts, otherwise full CRUD.
- **Tutor Pro:** **$15** one-time checkout → unlimited posts.
- **Student Pro:** **$10** one-time checkout → unlimited saved tuitions, pro badge, and
  priority applicant ranking (do not gate core applying).
- Payments update `users.plan` to `'pro'` and create a `payments` record.

---

## 2. Current repository audit (2026-11-20)

### 2.1 What exists

| Area | Current state | Verdict |
|---|---|---|
| Framework | Next.js **16.4.6** App Router, React **19.3**, TypeScript strict, Tailwind **v4** | Keep |
| UI base | shadcn `base-nova` (Base UI primitives), `lucide-react`, `cn` package | Keep, but incomplete |
| Auth | BetterAuth **1.7.26** + MongoDB adapter in `src/lib/auth.ts`; route handler at `src/app/api/auth/[...all]/route.ts`; client in `src/lib/auth-client.ts` | Partial |
| Sign-in / sign-up | Forms exist under `src/app/(auth)/`; they log to console and never redirect | Partial |
| Navbar | `src/components/shared/Navbar.tsx` is a client component with guest/logged-in states | Partial |
| Home | `src/app/(root)/page.tsx` renders the text `home page` | Placeholder |
| Root layout | Still has create-next-app metadata; no Toaster, no theme, no Footer | Placeholder |
| Config | `next.config.ts` enables `cacheComponents`, `partialPrefetching`, `reactCompiler` | Keep, account for it |
| Backend | **No Express server, no Stripe, no ImgBB, no uploads, no domain API** | Missing |
| Domain pages | No `/tuitions`, `/pricing`, `/payment/*`, `/dashboard/*` | Missing |
| Seed / docs | No seed script, no `PROGRESS.md`, README is the default create-next-app text | Missing |
| Git | Only the initial create-next-app commit; scaffold work is uncommitted | Needs clean commits |

### 2.2 Known defects to fix before feature work

1. **`src/lib/auth-client.ts` creates two clients.** `signIn`/`signUp` use the client with
   `baseURL`, but `useSession` is exported from a second `createAuthClient()` without a
   base URL. Export everything from one singleton.
2. **Role is collected but never sent.** The sign-up form reads `userData.role` and only
   `console.log`s it. `signUp.email` must receive `role` as an additional field.
3. **No `role`/`plan` in the BetterAuth user model.** `(user as any)?.role || "student"` in
   the Navbar is a silent fallback, not authorization. Declare `additionalFields`.
4. **DaisyUI classes are used but DaisyUI is not installed.** `btn`, `badge`, `dropdown`,
   `avatar`, `divider`, `skeleton`, `bg-base-100`, `text-primary-content`, etc. in the
   Navbar have no styles. Pick **one** UI system (this blueprint picks shadcn) and refactor.
5. **No route protection.** No `proxy.ts`, no dashboard layout guard, no role middleware.
6. **No error/loading/404 UI.** Only the default Next.js files exist.
7. **`.env` contains live-looking secrets.** It is git-ignored, but rotate
   `BETTER_AUTH_SECRET`, the MongoDB password, and any keys that were ever shared or
   committed. Never put secrets in `NEXT_PUBLIC_*`.
8. **The "Continue with Google" button is decorative.** No Google provider is configured.
   Remove it or configure the provider in BetterAuth; do not ship a dead auth button.
9. **`next dev` owns the rules block in `AGENTS.md`.** Do not delete it; committing it with
   your work keeps the tree clean. This blueprint lives in `AGENT.md` and is linked from
   `AGENTS.md`.

---

## 3. Locked architecture decisions

| Decision | Choice | Reason |
|---|---|---|
| Frontend | Next.js App Router under `src/`, TypeScript, Tailwind v4, shadcn/ui | Already scaffolded; App Router is the target |
| UI kit | **shadcn/ui only** (`base-nova`, Base UI, lucide icons) | DaisyUI is not installed; mixing systems caused the current breakage |
| Toasts | **`sonner`** | shadcn-native, one system only |
| Theme | `next-themes` with class strategy (optional feature) | Dark/light without hydration flash |
| Backend | **Express + TypeScript** in `server/`, port `5000` | Required by the brief; keeps all domain logic in one API |
| Database | MongoDB via the official `mongodb` driver | Already installed; no need for Mongoose |
| Auth | **BetterAuth inside Express**, MongoDB adapter, `usePlural: true` | One backend owns auth, sessions, and domain data |
| Auth transport | Next.js rewrites `/api/auth/*` and `/api/v1/*` to Express | Same-origin cookies, no CORS/cookie pain in dev |
| API auth | Session cookie **or** JWT (`jwt` plugin) via `verifyToken` | Satisfies the JWT requirement; browsers can use cookies |
| Validation | `zod` on every request body/query | Consistent 400 responses |
| Payments | Stripe Checkout (redirect) + webhook + success-page verification | Never trust the redirect alone |
| Uploads | Server-proxied ImgBB upload (multipart → ImgBB API) | Keeps `IMGBB_API_KEY` off the client |
| Package manager | npm (existing `package-lock.json`) | Consistency |

### Why Express instead of Next route handlers?

The brief explicitly requires Node/Express and named role middlewares
(`verifyToken`, `verifyStudent`, `verifyTutor`, `verifyAdmin`). Keeping the domain API in
Express also avoids duplicating Mongo access between Next and the API. Next remains the
UI layer; it only proxies `/api/*` in development.

### Deployment note

- **Local:** Next `:3000` rewrites `/api/auth/*` and `/api/v1/*` to Express `:5000`.
- **Production:** put both behind one origin (reverse proxy `/api/*` → Express) so
  BetterAuth cookies stay first-party. If they must live on different origins, configure
  `trustedOrigins`, `SameSite=None; Secure`, CORS with credentials, and an explicit
  `CLIENT_URL` allowlist.

---

## 4. Target directory tree

```text
mentor-lagbe/
├─ AGENT.md                     # this blueprint
├─ AGENTS.md                    # Next.js generated rules + pointer to AGENT.md
├─ PROGRESS.md                  # mandatory task log
├─ README.md                    # setup, env, seed, test accounts, architecture
├─ next.config.ts               # rewrites + image remotePatterns
├─ .env                         # server secrets (git-ignored)
├─ .env.local                   # Next public config (git-ignored)
├─ server/
│  ├─ index.ts                  # listen, graceful shutdown
│  ├─ app.ts                    # express app, middleware order, routes
│  ├─ config/env.ts             # validated env (zod), fail fast
│  ├─ db/mongo.ts               # MongoClient singleton, typed collections, indexes
│  ├─ auth.ts                   # BetterAuth config (Mongo adapter, plugins, fields)
│  ├─ middleware/
│  │  ├─ verifyToken.ts         # JWT or session cookie → req.user
│  │  ├─ roles.ts               # verifyStudent / verifyTutor / verifyAdmin
│  │  ├─ ownership.ts           # tutor owns tuition, student owns application
│  │  ├─ validate.ts            # zod body/query/params
│  │  ├─ upload.ts              # multer memory storage, type/size limits
│  │  └─ error.ts               # 404 + central error handler
│  ├─ modules/
│  │  ├─ users/                 # me, profile update, admin user list/role change
│  │  ├─ tuitions/              # public list/detail, tutor CRUD, moderation
│  │  ├─ applications/          # apply, my applications, withdraw, review
│  │  ├─ payments/              # checkout, webhook, verify, transactions
│  │  ├─ uploads/               # ImgBB proxy
│  │  └─ admin/                 # stats/revenue aggregation
│  ├─ scripts/seed.ts           # 12+ tuitions + test accounts (idempotent)
│  └─ types/express.d.ts        # Request.user augmentation
└─ src/
   ├─ proxy.ts                  # Next 16 proxy (optimistic auth check)
   ├─ app/
   │  ├─ layout.tsx             # fonts, metadata, <Toaster />, theme provider
   │  ├─ globals.css            # Tailwind + shadcn tokens only
   │  ├─ loading.tsx            # global skeleton
   │  ├─ not-found.tsx          # custom 404
   │  ├─ error.tsx              # client error boundary with reset
   │  ├─ (root)/
   │  │  ├─ layout.tsx          # Navbar + Footer
   │  │  ├─ page.tsx            # home
   │  │  ├─ tuitions/page.tsx
   │  │  ├─ tuitions/[id]/page.tsx
   │  │  ├─ pricing/page.tsx
   │  │  ├─ payment/success/page.tsx
   │  │  ├─ payment/cancel/page.tsx
   │  │  └─ about/page.tsx      # or remove the About nav link
   │  ├─ (auth)/
   │  │  ├─ layout.tsx          # centered auth shell
   │  │  ├─ sign-in/page.tsx
   │  │  └─ sign-up/page.tsx
   │  └─ dashboard/
   │     ├─ layout.tsx          # real session + role guard, sidebar
   │     ├─ page.tsx            # redirect to /dashboard/{role}
   │     ├─ profile/page.tsx
   │     ├─ student/
   │     │  ├─ page.tsx
   │     │  ├─ my-applications/page.tsx
   │     │  └─ saved/page.tsx   # optional bookmark feature
   │     ├─ tutor/
   │     │  ├─ page.tsx
   │     │  ├─ post-tuition/page.tsx
   │     │  ├─ my-tuitions/page.tsx
   │     │  ├─ my-tuitions/[id]/edit/page.tsx
   │     │  └─ applicants/page.tsx
   │     └─ admin/
   │        ├─ page.tsx
   │        ├─ users/page.tsx
   │        ├─ tuitions/page.tsx
   │        └─ transactions/page.tsx
   ├─ components/
   │  ├─ ui/                    # shadcn primitives only
   │  ├─ shared/                # Navbar, Footer, Logo, RoleBadge, ThemeToggle,
   │  │                         # StatCard, EmptyState, Pagination, ConfirmDialog
   │  ├─ tuitions/              # TuitionCard, Filters, SearchBar, TuitionGrid
   │  ├─ applications/          # StatusBadge, ApplicationCard
   │  ├─ dashboard/             # Sidebar, DashboardHeader, PlanBanner
   │  └─ forms/                 # TuitionForm, ProfileForm, ImageUpload, AuthForm
   ├─ lib/
   │  ├─ api.ts                 # fetch wrapper, credentials, error normalization
   │  ├─ auth-client.ts         # single BetterAuth client + jwtClient
   │  ├─ session.ts             # server-side session helper (cookie forwarding)
   │  ├─ constants.ts           # plans, prices, subjects, class levels, modes
   │  ├─ format.ts              # currency/date/status formatting
   │  └─ utils.ts               # cn
   ├─ hooks/                    # useSessionUser, usePagination, useUpload
   └─ types/                    # UI-facing API/domain types
```

**Remove:** `src/app/api/auth/[...all]/route.ts` and `src/lib/auth.ts` once BetterAuth is
mounted in Express. Keep `src/lib/auth-client.ts` on the frontend.

---

## 5. Data model

### 5.1 Collections overview

The brief names **four domain collections**: `users`, `tuitions`, `applications`,
`payments`. BetterAuth adds its own supporting collections. With the MongoDB adapter and
`usePlural: true`, expect:

| Collection | Owner | Purpose |
|---|---|---|
| `users` | BetterAuth + domain fields | Accounts, role, plan, profile |
| `sessions` | BetterAuth | Login sessions (cookie-backed) |
| `accounts` | BetterAuth | Email/password (and future OAuth) credentials |
| `verifications` | BetterAuth | Email verification / reset tokens (if enabled) |
| `jwks` | BetterAuth JWT plugin | Signing keys for JWT verification |
| `tuitions` | Domain | Tuition posts |
| `applications` | Domain | Student applications |
| `payments` | Domain | Stripe checkout records |

Do not claim the database has exactly four collections; the four **business** collections
are the ones above, and the auth collections are infrastructure.

### 5.2 `users`

BetterAuth core fields: `id`, `name`, `email`, `emailVerified`, `image`, `createdAt`,
`updatedAt`. Additional fields:

| Field | Type | Default | Input on sign-up | Notes |
|---|---|---|---|---|
| `role` | `'student' \| 'tutor' \| 'admin'` | `'student'` | Yes (student/tutor only) | Server clamps; admin is seeded only |
| `plan` | `'free' \| 'pro'` | `'free'` | **No** | Only Stripe webhook/verify changes it |
| `phone` | `string?` | — | No | Profile |
| `bio` | `string?` | — | No | Profile |
| `institution` | `string?` | — | No | Student/tutor profile |
| `classLevel` | `string?` | — | No | Student |
| `subjects` | `string[]` | `[]` | No | Tutor |
| `hourlyRate` | `number?` | — | No | Tutor, BDT |
| `location` | `string?` | — | No | Profile |
| `proSince` | `Date?` | — | No | Set with plan upgrade |
| `banned` | `boolean` | `false` | No | Optional admin control |

Rules:

- `role` is `input: true` only so the sign-up form can send it; a `databaseHooks.user.create.before`
  hook must reject `'admin'` and anything outside `student|tutor`.
- `plan` is `input: false`; never accept it from `updateUser` or a request body.
- Admin role changes go through `PATCH /api/v1/admin/users/:id/role` only.
- Indexes: unique `email` (BetterAuth), `role`, `plan`.

### 5.3 `tuitions`

| Field | Type | Notes |
|---|---|---|
| `_id` | `ObjectId` | Mongo id |
| `tutorId` | `string` | `users._id` as string |
| `tutorName` | `string` | Denormalized for cards; refresh on profile update |
| `tutorImage` | `string?` | Denormalized |
| `title` | `string` | Required, 10–120 chars |
| `subject` | `string` | Required, from a controlled list |
| `classLevel` | `string` | e.g. `Class 6-8`, `Class 9-10`, `HSC`, `Admission` |
| `mode` | `'online' \| 'offline' \| 'hybrid'` | Required |
| `location` | `string` | Required for offline/hybrid |
| `salary` | `number` | Monthly BDT, positive |
| `schedule` | `string` | e.g. `3 days/week, evening` |
| `description` | `string` | Required, 30–2000 chars |
| `requirements` | `string?` | Optional |
| `bannerUrl` | `string?` | ImgBB URL |
| `status` | `'pending' \| 'approved' \| 'rejected' \| 'closed'` | Workflow state |
| `rejectionReason` | `string?` | Admin |
| `applicationsCount` | `number` | Maintained atomically (`$inc`) |
| `createdAt` / `updatedAt` | `Date` | |

Status semantics:

- **`pending`** — submitted, not public, awaiting admin.
- **`approved`** — public and active.
- **`rejected`** — not public; tutor can edit and resubmit (reset to `pending`).
- **`closed`** — was approved, tutor paused it; not public, still owned.

"Latest approved & active" = `status: 'approved'`, newest first.
"Active/Closed toggle" = `approved ↔ closed`.
"Approve/Reject" = `pending → approved | rejected`.

Indexes:

- `{ status: 1, createdAt: -1 }` (public list/home)
- `{ tutorId: 1, createdAt: -1 }` (tutor dashboard)
- `{ subject: 1 }`, `{ classLevel: 1 }`, `{ mode: 1 }` (filters)
- Optional text index `{ title: 'text', description: 'text', subject: 'text' }`; for the
  demo, escaped case-insensitive regex on `title`/`subject` is acceptable.

Free-plan rule: a free tutor may own at most **2** tuition documents (count all statuses;
deleting frees a slot). Enforce server-side **before** insert and return `403 PLAN_LIMIT`.

### 5.4 `applications`

| Field | Type | Notes |
|---|---|---|
| `_id` | `ObjectId` | |
| `tuitionId` | `string` | `tuitions._id` as string |
| `studentId` | `string` | `users._id` as string |
| `tutorId` | `string` | Denormalized for tutor queries |
| `tuitionTitle` | `string` | Snapshot for dashboards |
| `studentName` / `studentEmail` | `string` | Snapshot |
| `message` | `string` | 20–1000 chars |
| `status` | `'pending' \| 'accepted' \| 'rejected' \| 'withdrawn'` | |
| `createdAt` / `updatedAt` | `Date` | |

Rules:

- Only `role: 'student'` may create one.
- Tuition must be `approved`; cannot apply twice (unique index + handle `E11000` → `409`).
- Student may cancel only while `pending` → `withdrawn`.
- Tutor may accept/reject only applications for their own tuition, only from `pending`.
- **Recommended accept rule:** on accept, set the application to `accepted`, set the
  tuition to `closed`, and reject remaining `pending` applications for that tuition.
  Implement in a transaction if the Mongo deployment supports it; otherwise sequential
  updates with a clear failure message.
- Indexes: unique `{ tuitionId: 1, studentId: 1 }`, `{ tutorId: 1, status: 1, createdAt: -1 }`,
  `{ studentId: 1, createdAt: -1 }`.

### 5.5 `payments`

| Field | Type | Notes |
|---|---|---|
| `_id` | `ObjectId` | |
| `userId` | `string` | `users._id` as string |
| `userEmail` | `string` | Snapshot for admin table |
| `plan` | `'student_pro' \| 'tutor_pro'` | Product purchased |
| `amount` | `number` | **Cents** (1000 / 1500) |
| `currency` | `'usd'` | |
| `stripeSessionId` | `string` | Unique; idempotency key |
| `stripePaymentIntentId` | `string?` | From webhook/verify |
| `status` | `'pending' \| 'completed' \| 'failed' \| 'refunded'` | |
| `createdAt` / `completedAt` | `Date` | |

Indexes: unique `{ stripeSessionId: 1 }`, `{ userId: 1, createdAt: -1 }`,
`{ status: 1, createdAt: -1 }`.

### 5.6 ID convention (important Mongo gotcha)

BetterAuth's MongoDB adapter stores `_id` as an `ObjectId` but returns `id` as a **string**
(hex). Domain collections therefore store `tutorId`, `studentId`, and `userId` as strings.
When querying `users` or `tuitions` by those values, use a helper:

- `toObjectId(id)` — validates a 24-char hex string and returns `new ObjectId(id)`.
- Always compare `_id` with `ObjectId`, never with the raw string.
- When returning documents, map `_id` → `id` in the API response so the frontend never
  deals with `ObjectId` instances.

---

## 6. Auth, session & authorization

### 6.1 BetterAuth configuration requirements (`server/auth.ts`)

- MongoDB adapter with the shared `MongoClient`, database `mentor-lagbe`,
  **`usePlural: true`** (so the collection is `users`, not `user`).
- `emailAndPassword: { enabled: true }`.
- `additionalFields` for `role`, `plan`, and the profile fields in §5.2. Set
  `plan.input = false`; set `role.input = true` with server-side clamping.
- `databaseHooks.user.create.before`: force `role` to `student|tutor` (default `student`),
  force `plan: 'free'`, normalize email.
- `plugins: [jwt()]` for signed JWTs and the `/api/auth/jwks` endpoint.
- `trustedOrigins: [CLIENT_URL]`.
- Session cookie: HttpOnly, `SameSite=Lax`, `Secure` in production, 7-day expiry with
  rolling refresh. Do not store session tokens in `localStorage`.
- Mount at `/api/auth/*` in Express with `toNodeHandler(auth)`.
- Email verification stays **off** for the demo; document that choice. If enabled later,
  add a verification page and resend endpoint.

### 6.2 Sign-up / sign-in / sign-out flows

**Sign-up (`/sign-up`)**

1. Fields: name, email, password (min 8), role (`student` or `tutor`).
2. Client calls `authClient.signUp.email({ name, email, password, role })`.
3. Server hook clamps role and sets `plan: 'free'`.
4. On success: toast, `router.push('/dashboard')`, `router.refresh()`.
5. On error: inline message + toast; never leave the button stuck in loading.

**Sign-in (`/sign-in`)**

1. Email + password.
2. `authClient.signIn.email({ email, password })`.
3. Redirect to `?next=` if it is a safe internal path, otherwise `/dashboard`.
4. Session cookie is set by BetterAuth; no manual token storage.

**Sign-out**

1. `authClient.signOut()`.
2. Close menus, `router.push('/')`, `router.refresh()`.
3. Navbar returns to the guest state.

**Session persistence on reload**

- The HttpOnly session cookie is the source of truth.
- `authClient.useSession()` runs on mount; while `isPending`, render a skeleton — do **not**
  default the role to `student`.
- `router.refresh()` after sign-in/out and after plan/role changes.
- Dashboard layouts re-check the session server-side on every navigation.
- `proxy.ts` only performs an **optimistic** cookie-presence check; it is not authorization.

### 6.3 Express middlewares

| Middleware | Behavior |
|---|---|
| `verifyToken` | 1) If `Authorization: Bearer <jwt>`, verify with `jose` against BetterAuth's JWKS (use `auth.api.getJwks()` locally, or cache `/api/auth/jwks`). 2) Else read the BetterAuth session cookie via `auth.api.getSession({ headers })`. 3) Load the fresh user from `users` by id. 4) Attach `req.user = { id, email, name, role, plan }`. 5) `401` if none. |
| `verifyStudent` | `req.user.role === 'student'`, else `403`. |
| `verifyTutor` | `req.user.role === 'tutor'`, else `403`. |
| `verifyAdmin` | `req.user.role === 'admin'`, else `403`. |
| `requireTuitionOwner` | Fetch tuition; `tutorId === req.user.id`, else `403`/`404`. |
| `requireApplicationOwner` | Student owns the application (withdraw) or tutor owns its tuition (review). |

**Why load the user from the DB on every request?** A JWT claim can be stale after an admin
changes a role or a webhook changes a plan. DB lookup keeps authorization correct. The JWT
still satisfies the "JWT verification" requirement and supports non-browser clients.

### 6.4 Three layers of route protection

1. **`src/proxy.ts` (optimistic):** matcher `['/dashboard/:path*']`; use
   `getSessionCookie(request)` from `better-auth/cookies`. If absent, redirect to
   `/sign-in?next=<path>`. Do not query Mongo here.
2. **`src/app/dashboard/layout.tsx` (real):** read the session server-side by forwarding
   cookies to `GET /api/auth/get-session` (or a server helper). If absent, redirect to
   sign-in. If the role does not match the route segment, redirect to
   `/dashboard/{actualRole}`. Wrap session-dependent UI in `<Suspense>` because
   `cacheComponents` is enabled.
3. **Express (authoritative):** every mutation and private read runs `verifyToken` +
   role/ownership middleware. The frontend is never trusted.

### 6.5 Role changes and plan changes

- Admin changes a role → the next request loads the fresh DB role; the user may need to
  refresh to see the new dashboard link. Redirect them if they hit a route their role no
  longer allows.
- Stripe webhook/verify sets `plan: 'pro'` and `proSince`; the success page calls
  `router.refresh()` so the Navbar/dashboard badge updates.
- Never downgrade a plan on a failed/cancelled checkout.

---

## 7. API blueprint

### 7.1 Conventions

- Base path: **`/api/v1`**. Auth stays at **`/api/auth/*`**.
- JSON only; `Content-Type: application/json` except uploads (multipart) and the Stripe
  webhook (raw body).
- Browser auth: session cookie. API clients/tests: `Authorization: Bearer <jwt>`.
- Success envelope:

  ```json
  { "success": true, "data": {}, "meta": { "page": 1, "limit": 12, "total": 42, "totalPages": 4 } }
  ```

- Error envelope:

  ```json
  { "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [] } }
  ```

- Pagination: `page` (1-based, default 1), `limit` (default 12, max 50).
- Sorting: `sort=newest|oldest|salary_asc|salary_desc` (allowlist only).
- Validation: `zod`; reject unknown fields; coerce query strings.
- Never accept `role`, `plan`, `amount`, `status`, `tutorId`, or `studentId` from the client
  where the server can derive them.

### 7.2 Endpoint table

**Public**

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/tuitions` | Filters: `q`, `subject`, `classLevel`, `mode`, `page`, `limit`, `sort`. Only `approved`. |
| `GET` | `/api/v1/tuitions/latest?limit=6` | Home cards; only `approved`. |
| `GET` | `/api/v1/tuitions/:id` | Public detail; only `approved` (owner/admin may see other statuses via auth routes). |
| `GET` | `/api/v1/stats/public` | Counts for the home stats strip (approved tuitions, tutors, students). |

**Authenticated (any role)**

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/me` | Current user (no secrets). |
| `PATCH` | `/api/v1/me` | Update name/phone/bio/institution/classLevel/subjects/hourlyRate/location/image. Never role/plan/email. |
| `POST` | `/api/v1/uploads` | Multipart `file`; returns `{ url }`. |

**Student**

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/v1/tuitions/:id/applications` | Body `{ message }`. Approved tuition only; duplicate → 409. |
| `GET` | `/api/v1/applications/mine` | Paginated; includes tuition snapshot/status. |
| `PATCH` | `/api/v1/applications/:id/withdraw` | Only `pending` → `withdrawn`. |
| `GET` | `/api/v1/saved` / `POST` / `DELETE` | Optional bookmark feature. |

**Tutor**

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/v1/tuitions` | Create `pending`; enforce free limit 2. |
| `GET` | `/api/v1/tuitions/mine` | Paginated; all statuses. |
| `PATCH` | `/api/v1/tuitions/:id` | Owner only; editing a rejected post resets it to `pending`. |
| `DELETE` | `/api/v1/tuitions/:id` | Owner only; cascade-delete applications or block if accepted (see §17). |
| `PATCH` | `/api/v1/tuitions/:id/status` | Body `{ status: 'approved' \| 'closed' }`; only the owner, only from `approved`/`closed`. |
| `GET` | `/api/v1/tutor/applications` | All applications for the tutor's tuitions; filter by `tuitionId`, `status`. |
| `PATCH` | `/api/v1/applications/:id/status` | Body `{ status: 'accepted' \| 'rejected' }`; owner only; `pending` only. |

**Admin**

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/admin/stats` | Users by role, tuitions by status, completed revenue, recent activity. |
| `GET` | `/api/v1/admin/users` | Paginated; search by name/email; filter by role/plan. |
| `PATCH` | `/api/v1/admin/users/:id/role` | Body `{ role }`; cannot demote the last admin/self (optional guard). |
| `GET` | `/api/v1/admin/tuitions` | Filter by `status`; default `pending`. |
| `PATCH` | `/api/v1/admin/tuitions/:id/moderate` | Body `{ status: 'approved' \| 'rejected', reason? }`. |
| `GET` | `/api/v1/admin/transactions` | Paginated payments + user email; filter by status/plan. |

**Payments**

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/v1/payments/checkout` | Body `{ plan: 'student_pro' \| 'tutor_pro' }`; role must match plan; returns `{ url }`. |
| `POST` | `/api/v1/payments/webhook` | Stripe signature; raw body; idempotent. |
| `GET` | `/api/v1/payments/verify?session_id=…` | Auth; verifies the Stripe session belongs to the current user; fallback for webhooks. |
| `GET` | `/api/v1/payments/mine` | Current user's payment history. |

### 7.3 Error codes

| HTTP | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Zod failure, bad query |
| 401 | `UNAUTHORIZED` | No/invalid session or JWT |
| 403 | `FORBIDDEN` | Wrong role or not the owner |
| 403 | `PLAN_LIMIT` | Free tutor already has 2 posts |
| 404 | `NOT_FOUND` | Missing tuition/application/user |
| 409 | `CONFLICT` | Duplicate application, duplicate payment |
| 422 | `UNPROCESSABLE` | Business rule (e.g. applying to a closed tuition) |
| 500 | `INTERNAL` | Unexpected; log server-side, hide details in prod |

---

## 8. Payments (Stripe)

### 8.1 Products

| Plan | Price | Stripe Price env | `users.plan` after success |
|---|---|---|---|
| Student Pro | **$10** | `STRIPE_PRICE_STUDENT_PRO` | `'pro'` |
| Tutor Pro | **$15** | `STRIPE_PRICE_TUTOR_PRO` | `'pro'` |

Use Stripe **Price IDs**, not hardcoded amounts, in Checkout. Display the amounts from a
frontend constant; the server maps the plan to the Price ID and never trusts a client
amount.

### 8.2 Checkout flow

1. User clicks "Upgrade" on `/pricing` or a dashboard plan banner.
2. If not signed in → `/sign-in?next=/pricing`.
3. `POST /api/v1/payments/checkout` with `{ plan }`.
4. Server checks: authenticated; role matches plan (`student` → `student_pro`,
   `tutor` → `tutor_pro`); user is not already `pro`.
5. Create a Stripe Checkout Session:
   - `mode: 'payment'`
   - `line_items: [{ price: <priceId>, quantity: 1 }]`
   - `success_url: ${CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url: ${CLIENT_URL}/payment/cancel`
   - `client_reference_id: userId`
   - `metadata: { userId, plan }`
6. Upsert a `payments` document with `status: 'pending'` and the session id.
7. Return `{ url }`; the client redirects with `window.location.href = url`.

### 8.3 Webhook

- Route: `POST /api/v1/payments/webhook`.
- Must be registered **before** `express.json()` or use
  `express.raw({ type: 'application/json' })` for this route only.
- Verify `stripe-signature` with `STRIPE_WEBHOOK_SECRET`; reject invalid signatures with 400.
- Handle at least `checkout.session.completed` (and `checkout.session.async_payment_succeeded`
  if async methods are enabled).
- Idempotency: unique `stripeSessionId`; if the payment is already `completed`, return 200
  without re-upgrading.
- On success:
  1. Set payment `completed`, `completedAt`, `stripePaymentIntentId`.
  2. Set `users.plan = 'pro'`, `proSince = now`.
  3. Return 200 quickly; do not do slow work in the webhook.
- Local testing: `stripe listen --forward-to localhost:5000/api/v1/payments/webhook`.

### 8.4 Success page fallback

`/payment/success?session_id=…` must:

1. Read `session_id` (missing → show a friendly error, link to `/pricing`).
2. Call `GET /api/v1/payments/verify?session_id=…` with credentials.
3. Server retrieves the session from Stripe, checks `payment_status === 'paid'` **and**
   `metadata.userId === req.user.id`, then performs the same idempotent upgrade.
4. Show "You're Pro" + plan badge + dashboard link; call `router.refresh()` so the Navbar
   updates.
5. Never upgrade based only on the redirect query string.

`/payment/cancel` makes no changes; offer "Try again" and "Back to pricing".

### 8.5 Admin revenue

Revenue = sum of `amount` for `payments.status === 'completed'`, displayed in USD
(`amount / 100`). Show totals and a recent-transactions table; do not include pending or
failed payments.

---

## 9. Uploads (ImgBB)

- Endpoint: `POST /api/v1/uploads` (authenticated, any role).
- `multer.memoryStorage()`, max **5 MB**, allow `image/jpeg`, `image/png`, `image/webp`;
  reject everything else with 400.
- Convert the buffer to base64 and call
  `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}` with the `image` field.
- Return `{ url }` (prefer the direct image URL; keep the delete URL server-side only if
  you plan cleanup).
- `IMGBB_API_KEY` is **server-only**; never expose it via `NEXT_PUBLIC_*` or call ImgBB
  directly from the browser.
- Client `ImageUpload` component: file input + preview + progress/spinner + error toast;
  the resulting URL is stored in the form and submitted with the tuition/profile payload.
- Validate the returned URL host before saving (`i.ibb.co` / `ibb.co` family) to avoid
  arbitrary URL injection.
- Configure `next.config.ts` `images.remotePatterns` for ImgBB and any seeded image host,
  or use plain `<img>` for user-provided URLs.

---

## 10. Pages, routes & behaviors

### 10.1 Route matrix

| Route | Access | Rendering | Key behavior |
|---|---|---|---|
| `/` | Public | Server, cached | Hero, 6 latest approved tuitions, Free vs Pro, how it works, subjects/stats/testimonials |
| `/tuitions` | Public | Server, per-request | Search + filters + pagination, URL-driven state |
| `/tuitions/[id]` | Public | Server, per-request | Full details; apply button rules |
| `/pricing` | Public | Server + client CTA | Free vs Pro comparison; checkout |
| `/payment/success` | Auth | Client | Verify session, show success, refresh |
| `/payment/cancel` | Public | Static | No changes; retry |
| `/sign-in` | Guest | Client | Email/password; redirect if already signed in |
| `/sign-up` | Guest | Client | Name/email/password/role; redirect if signed in |
| `/dashboard` | Auth | Server | Redirect to `/dashboard/{role}` |
| `/dashboard/student` | Student | Server + client widgets | Stats + recent applications |
| `/dashboard/student/my-applications` | Student | Server + client actions | Status, cancel pending |
| `/dashboard/student/saved` | Student | Optional | Bookmarked tuitions |
| `/dashboard/tutor` | Tutor | Server + client widgets | Stats, post usage, upgrade banner |
| `/dashboard/tutor/post-tuition` | Tutor | Client form | Create pending post; ImgBB banner; free limit |
| `/dashboard/tutor/my-tuitions` | Tutor | Server + client actions | CRUD + Active/Closed toggle |
| `/dashboard/tutor/my-tuitions/[id]/edit` | Tutor | Client form | Owner-only edit |
| `/dashboard/tutor/applicants` | Tutor | Server + client actions | Accept/reject |
| `/dashboard/admin` | Admin | Server | Counts + revenue + recent activity |
| `/dashboard/admin/users` | Admin | Server + client actions | Role management |
| `/dashboard/admin/tuitions` | Admin | Server + client actions | Approve/reject |
| `/dashboard/admin/transactions` | Admin | Server | Payment history/revenue |
| `/dashboard/profile` | Auth | Client form | Profile + ImgBB photo |
| `/about` | Public | Static | Optional; keep the Navbar link honest |

### 10.2 Home page (`/`)

Sections, in order:

1. **Hero** — headline, subcopy, "Browse Tuitions" + "Become a Tutor" CTAs, trust stats.
2. **Latest tuitions** — exactly **6** `approved` posts, newest first, **uniform cards**
   (same image ratio, title lines, badge placement, footer rate).
3. **Free vs Pro** — two cards with feature lists and CTAs; link to `/pricing`.
4. **How it works** — 3–4 steps for students and tutors.
5. **Top subjects** — chips/cards with counts (from the API or a static allowlist).
6. **Stats strip** — total approved tuitions, tutors, students, successful matches.
7. **Testimonials** — 2–3 static quotes with names/roles.

Use `use cache` + `cacheTag('tuitions')` for public data, and `revalidateTag('tuitions')`
after tutor/admin mutations. Because `cacheComponents` is on, do not add
`export const dynamic = 'force-dynamic'`; wrap session/request-time reads in `<Suspense>`.

### 10.3 Browse page (`/tuitions`)

- URL state: `?q=&subject=&classLevel=&mode=&page=`.
- Server-side search on `title` **or** `subject` (escaped, case-insensitive regex).
- Filters: subject, class level, mode; "Clear all".
- Server-side pagination; show `Showing X–Y of Z`; prev/next + numbered pages.
- Only `approved` tuitions.
- Empty state with "Clear filters"; loading skeleton; mobile filter drawer/sheet.
- Next 16: `searchParams` is a Promise; type the page with
  `PageProps<'/tuitions'>` and `await props.searchParams`.

### 10.4 Tuition detail (`/tuitions/[id]`)

- Banner (ImgBB or fallback), title, subject/class/mode badges, salary, schedule, location,
  description, requirements, tutor card (avatar, name, bio, subjects).
- Apply rules:
  - Guest → "Sign in to apply" → `/sign-in?next=/tuitions/{id}`.
  - Tutor/Admin → disabled with "Only students can apply".
  - Student who already applied → show status badge; no duplicate button.
  - Approved only; closed/rejected/pending → 404 or "no longer available".
- Application form: message textarea, submit, toast, optimistic status update.
- `params` is a Promise in Next 16; type with `PageProps<'/tuitions/[id]'>`.
- `generateMetadata` for title/description; `notFound()` for invalid ids.

### 10.5 Dashboards

**Student overview**

- Stat cards: total applications, pending, accepted, saved (if implemented).
- Recent applications table/cards with tuition title, date, status badge.
- CTA: browse tuitions; upgrade to Student Pro if `free`.

**My applications**

- List all applications with tuition snapshot, status, date.
- "Cancel" only for `pending` → confirm dialog → `PATCH .../withdraw` → toast + refresh.
- Empty state → browse tuitions.

**Tutor overview**

- Stat cards: posts used (`n/2` for free, `n` for pro), total applications, accepted,
  active tuitions.
- Plan banner: free → "Upgrade to post unlimited tuitions"; pro → "Pro" badge.
- Quick actions: post tuition, view applicants, manage tuitions.

**Post tuition**

- Fields per §5.3; client + server validation.
- Banner upload via ImgBB; preview; optional remove.
- Free limit: show `2/2 used` and disable submit with an upgrade CTA; still enforce on the
  server (client checks are UX only).
- Submit → `pending`; toast "Submitted for approval"; redirect to my tuitions.

**My tuitions**

- Table/cards: title, subject, status, applications count, created date, actions.
- Actions: edit, delete (confirm), toggle Active/Closed (only for `approved`/`closed`).
- Rejected posts show the reason and allow edit → resubmit (`pending`).
- Delete behavior: cascade-delete applications for that tuition (recommended) or block
  deletion when an application is `accepted`; pick one and document it.

**Applicants**

- Group by tuition or show a flat table with a tuition filter.
- Show student name/email, message, date, status.
- Accept/Reject only for `pending`; confirm; optimistic update + toast.
- On accept, follow the recommended rule in §5.4 (close tuition, reject remaining pending).

**Admin overview**

- Stat cards: total users (by role), tuitions (pending/approved/rejected/closed), completed
  revenue, recent payments/applications.
- Quick links to the three admin tables.

**Admin users**

- Search by name/email; filter by role/plan; paginated.
- Role select (`student`/`tutor`/`admin`) with confirm; server-side validation.
- Show plan badge and join date. Do not allow editing passwords here.

**Admin tuitions**

- Default tab/filter: `pending`.
- Approve or reject with an optional reason; show tutor, subject, salary, date.
- Reject requires a reason (for the tutor's edit screen).

**Admin transactions**

- Table: user email, plan, amount USD, status, Stripe session id (truncated), date.
- Revenue summary at the top; filter by status/plan; paginated.

**Profile (shared)**

- Fields: name, phone, bio, institution, classLevel (student), subjects + hourlyRate
  (tutor), location; photo via ImgBB.
- Email read-only; role and plan read-only with badges.
- Save → `PATCH /api/v1/me` → toast + `router.refresh()` (Navbar name/avatar updates).
- If the tutor's name/image changes, refresh denormalized `tutorName`/`tutorImage` on their
  tuitions (or read the tutor live in detail responses).

### 10.6 Global states

- `src/app/loading.tsx` + route-level `loading.tsx`: skeletons, not spinners everywhere.
- `src/app/not-found.tsx`: branded 404 with links home/browse.
- `src/app/error.tsx`: `"use client"`, `reset()` button, friendly message; log the digest.
- `src/app/global-error.tsx`: optional last-resort boundary.
- Every data page: loading, empty, error, and success states.

---

## 11. UI/UX blueprint

### 11.1 Design system rules

- **One system:** shadcn/ui (`base-nova`) + Tailwind v4 tokens in `globals.css`.
- Remove every DaisyUI class from the Navbar and any new component. Do not install DaisyUI.
- Icons: `lucide-react` only.
- Toasts: `sonner`; add `<Toaster richColors position="top-right" />` in the root layout.
- Use `cn` from `@/lib/utils` (already backed by the `cn` package).
- Add shadcn primitives as needed: `badge`, `dialog`, `select`, `dropdown-menu`, `table`,
  `skeleton`, `tabs`, `textarea`, `avatar`, `sheet`, `alert-dialog`, `pagination`.
- Buttons: one primary action per section; destructive actions use the destructive variant
  + confirmation.
- Cards: consistent radius, border, padding, shadow; tuition cards use a fixed image aspect
  ratio (16:9), 2-line title clamp, badge row, footer rate.
- Spacing: page container `max-w-7xl`, `px-4 sm:px-6 lg:px-8`, section `py-16/20`.
- Typography: one heading scale; no more than 2 font weights per section.
- Colors: semantic tokens (`bg-background`, `text-muted-foreground`, `border-border`), no
  hardcoded hex except brand accents.

### 11.2 Navbar (target behavior)

- Sticky, blurred background, border-bottom, max-width container.
- Logo + wordmark linking home.
- Desktop links: Home, Browse Tuitions, Pricing, About (only if `/about` exists).
- Guest: "Sign In" (ghost) + "Get Started" (primary) → `/sign-up`.
- Loading: skeleton pill; never render a fake user.
- Logged in:
  - Avatar (image or initials), name, role badge (`student`/`tutor`/`admin`).
  - Dropdown: Dashboard (`/dashboard`), Update Profile, Sign Out.
  - Dashboard link may go to `/dashboard/{role}` directly; `/dashboard` also redirects.
  - Optional plan badge (`Pro`) next to the role.
- Mobile: hamburger → sheet/panel with links, user card, dashboard/profile, sign out.
- Close menus on route change; sign out then redirect home.
- Accessibility: `aria-expanded`, `aria-label`, Escape to close, focus-visible rings.

### 11.3 Footer

- Brand + short description.
- Quick links: Browse, Pricing, About, Sign In/Sign Up.
- **X icon** (the brief requires it): use a lucide `Twitter` icon or an inline X SVG,
  linking to the project's X profile placeholder; `aria-label="X (Twitter)"`,
  `target="_blank"`, `rel="noreferrer"`.
- Copyright with the current year.
- Responsive: stack on mobile; do not duplicate the Navbar links excessively.

### 11.4 Forms & feedback

- Label every input; show inline field errors from zod; keep values on error.
- Disable submit while pending; show a spinner/label ("Saving…", "Posting…").
- Toast on success and on server error; do not use `console.log` as the only feedback.
- Destructive actions: `AlertDialog` confirmation.
- Image upload: preview, replace, remove, size/type hints.
- Currency: BDT for tuition salaries (`৳`), USD for Stripe plans (`$`); label clearly.

### 11.5 Responsive & accessibility

- Mobile-first; test 360px, 768px, 1024px, 1440px.
- Tables become cards or horizontally scroll on small screens.
- Filters become a sheet/drawer on mobile.
- Keyboard navigation for dropdowns/dialogs; visible focus; semantic headings.
- Images: `alt` text; `next/image` with width/height or `fill` + sizes.
- Color contrast: use semantic tokens; check both light and dark.

### 11.6 Optional features (choose 2–5)

Recommended, in order:

1. **Pagination** (already required by the brief — count it).
2. **Dark/light theme** with `next-themes` + Navbar toggle.
3. **Bookmarks/saved tuitions** for students.
4. **AI seed script** (generate realistic tuition copy) — keep it deterministic/idempotent.
5. **Ratings for accepted students** (student rates the tutor after acceptance) — only if
   time allows; it needs a `ratings` field/collection and moderation rules.

Do not start optional features until the core flows (phases 1–7) pass QA.

---

## 12. Seed data & test accounts

### 12.1 Test accounts

| Role | Email | Password | Plan |
|---|---|---|---|
| Admin | `admin@mentorlagbe.com` | `Password123!` | `free` (admin doesn't need Pro) |
| Student | `student@mentorlagbe.com` | `Password123!` | `free` |
| Student Pro | `student.pro@mentorlagbe.com` | `Password123!` | `pro` |
| Tutor | `tutor@mentorlagbe.com` | `Password123!` | `free` |
| Tutor Pro | `tutor.pro@mentorlagbe.com` | `Password123!` | `pro` |

Document these in `README.md`; never use them in production.

### 12.2 Tuition seed

- **12+ approved** tuitions across at least 5 subjects (Math, English, Physics, Chemistry,
  Biology, ICT, Bangla), 3+ class levels, and all 3 modes.
- 2–3 **pending** tuitions for the admin moderation demo.
- 1–2 **closed** and 1 **rejected** tuition for status UI coverage.
- At least 2 tuitions owned by the free tutor (to show the 2-post limit) and several by the
  Pro tutor.
- A handful of applications in `pending`/`accepted`/`rejected`/`withdrawn` states.
- 2–3 completed payments so the admin revenue page is non-empty.
- Use stable, idempotent upserts (unique keys: tutor email + title, or fixed `_id`s).
- Create auth users through BetterAuth's server API (`auth.api.signUpEmail`) so passwords
  are hashed correctly; then set role/plan via direct updates.
- Images: local `/public` placeholders or remote Unsplash/ImgBB URLs; configure
  `images.remotePatterns` accordingly.

---

## 13. Environment variables

### 13.1 Server (`server/`, loaded from `.env`)

| Variable | Example | Notes |
|---|---|---|
| `PORT` | `5000` | Express |
| `CLIENT_URL` | `http://localhost:3000` | CORS + BetterAuth trusted origin |
| `MONGODB_URI` | `mongodb+srv://…/mentor-lagbe` | Never commit |
| `BETTER_AUTH_SECRET` | 32+ random chars | Rotate if exposed |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Public origin; auth base path `/api/auth` |
| `STRIPE_SECRET_KEY` | `sk_test_…` | Server only |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | Server only |
| `STRIPE_PRICE_STUDENT_PRO` | `price_…` | $10 |
| `STRIPE_PRICE_TUTOR_PRO` | `price_…` | $15 |
| `IMGBB_API_KEY` | `…` | Server only |

### 13.2 Next (`src/`, loaded from `.env.local`)

| Variable | Example | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Canonical app URL |
| `NEXT_PUBLIC_API_BASE` | `/api/v1` | Same-origin via rewrite |
| `API_ORIGIN` | `http://localhost:5000` | Used by `next.config.ts` rewrites (server-side only) |

Rules:

- `.env*` is git-ignored. Keep it that way.
- Never put a secret in `NEXT_PUBLIC_*`.
- Validate env at server startup with zod; fail fast with a clear message.
- Rotate the current `BETTER_AUTH_SECRET` and MongoDB credentials if they were ever
  shared, screenshotted, or committed. The current `.env` is untracked, but treat it as
  compromised if it left the machine.

---

## 14. Delivery phases (implementation order)

> Do not skip ahead. Each phase ends with lint + type-check + build and a `PROGRESS.md`
> update. The user has asked for **no app code yet**; these phases are the execution plan
> for later sessions.

### Phase 0 — Baseline cleanup

- [ ] Fix `auth-client.ts` to a single client; export `signIn`, `signUp`, `signOut`, `useSession`.
- [ ] Decide the auth host (Express, per §3) and plan the file moves.
- [ ] Add `.env.example` files (no secrets) for server and Next.
- [ ] Add npm scripts: `dev:server`, `seed`, `typecheck`.
- [ ] Remove dead links (`/forgot-password`, `/terms`, `/privacy`) or add real pages.
- [ ] Remove the decorative Google button or configure the provider.
- **Done when:** the existing sign-in/sign-up forms compile against one client and the app
  still starts.

### Phase 1 — Express + BetterAuth foundation

- [ ] Scaffold `server/` (Express, TS, `tsx`, `zod`, `cors`, `helmet`, `cookie-parser`, `jose`).
- [ ] Mongo singleton, typed collections, `ensureIndexes()`.
- [ ] BetterAuth with `usePlural`, additional fields, create hook, JWT plugin, trusted origins.
- [ ] Mount `/api/auth/*`; add `/health`.
- [ ] `verifyToken`, `verifyStudent`, `verifyTutor`, `verifyAdmin`, error handler.
- [ ] Next rewrites `/api/auth/*` and `/api/v1/*` → Express; add `API_ORIGIN`.
- [ ] `src/lib/api.ts` (credentials, error normalization) and `src/proxy.ts`.
- **Done when:** sign-up with a role persists `role`/`plan`, session survives reload,
  `/api/v1/me` returns the user, and unauthorized requests get 401/403.

### Phase 2 — Design system & shell

- [ ] Refactor the Navbar off DaisyUI; add guest/auth/mobile states and role badge.
- [ ] Add Footer with the X icon.
- [ ] Root layout: metadata, fonts, `<Toaster />`, optional theme provider.
- [ ] Add shadcn primitives (badge, dialog, select, table, skeleton, tabs, textarea, avatar).
- [ ] Add `loading.tsx`, `not-found.tsx`, `error.tsx`.
- **Done when:** the shell is responsive, no DaisyUI classes remain, and toasts work.

### Phase 3 — Public tuition catalog

- [ ] `tuitions` model + indexes + validation.
- [ ] Public list/detail/latest endpoints.
- [ ] Seed script with 12+ approved tuitions and test accounts.
- [ ] `/tuitions` search/filters/pagination; `/tuitions/[id]` detail.
- [ ] Home page sections + 6 latest cards.
- **Done when:** a guest can search, filter, paginate, and open a tuition; only approved
  posts appear.

### Phase 4 — Student flows

- [ ] Apply endpoint + unique index + duplicate handling.
- [ ] Apply UI on detail (role-aware).
- [ ] `/dashboard/student` stats; `/my-applications`; withdraw pending.
- **Done when:** a student applies once, sees status, cancels while pending, and cannot
  apply twice.

### Phase 5 — Tutor flows

- [ ] Tutor CRUD endpoints + ownership + free limit.
- [ ] Post tuition form with ImgBB banner.
- [ ] My tuitions (edit/delete/toggle) and applicants (accept/reject).
- **Done when:** free tutor hits the 2-post limit, Pro is unlimited, and accept/reject
  updates the student view.

### Phase 6 — Admin flows

- [ ] Admin stats/revenue aggregation.
- [ ] Users list + role change.
- [ ] Tuition moderation (approve/reject + reason).
- [ ] Transactions table.
- **Done when:** admin can move a pending post to approved and it appears publicly; revenue
  matches completed payments.

### Phase 7 — Payments

- [ ] Stripe Checkout endpoint + price mapping + pending payment record.
- [ ] Raw-body webhook + signature verification + idempotent upgrade.
- [ ] Verify endpoint + success/cancel pages.
- [ ] Plan gating/badges across Navbar/dashboards.
- **Done when:** test checkout upgrades the user, webhook replay does not double-charge,
  and the success page works even if the webhook is delayed.

### Phase 8 — Profile, polish & delivery

- [ ] Profile update + photo upload.
- [ ] Optional features (theme, bookmarks, ratings) — only after core QA.
- [ ] Responsive/a11y pass; empty/error states everywhere.
- [ ] README: setup, env, seed, test accounts, architecture, scripts.
- [ ] Final QA matrix, clean commits, `PROGRESS.md` final entry.
- **Done when:** `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass; the manual
  matrix in §15 passes.

---

## 15. Definition of done & QA matrix

### 15.1 Commands

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run dev          # Next :3000
npm run dev:server   # Express :5000
npm run seed
```

### 15.2 Manual matrix

| Scenario | Expected |
|---|---|
| Guest home | 6 approved cards, pricing, stats; no auth-only actions |
| Guest `/tuitions` | Search/filter/pagination; only approved |
| Guest detail | "Sign in to apply"; no crash on bad id |
| Student apply | One application; duplicate blocked with a clear message |
| Student cancel | Only pending; status becomes withdrawn |
| Free tutor post | 2 allowed; 3rd blocked with upgrade CTA |
| Pro tutor post | Unlimited |
| Tutor applicants | Accept/reject own tuition only; other tutors' applications blocked |
| Admin moderation | Pending → approved appears publicly; reject stores reason |
| Admin users | Role change reflected after refresh; no self-demotion |
| Stripe success | Plan becomes Pro; badge updates; payment recorded |
| Stripe cancel | No plan change; no completed payment |
| Webhook replay | No duplicate payment/upgrade |
| Upload | JPG/PNG/WebP under 5 MB accepted; others rejected |
| Reload on private route | Session persists; no redirect loop |
| Role mismatch | Redirected to the correct dashboard |
| Mobile 360px | Navbar, cards, tables, filters usable |
| 404/error | Branded pages; reset works |

### 15.3 Code quality

- TypeScript strict; no `any` in new code (use `unknown` + narrowing).
- No secrets in client bundles or git.
- Consistent API error envelope and toast messages.
- Meaningful commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`), one logical change
  per commit.
- `README.md` stays accurate; `PROGRESS.md` is current.

---

## 16. Progress log format (`PROGRESS.md`)

Newest entry first:

```md
## 2026-11-20 — Short task title

**Completed**
- What was finished (files, endpoints, pages).
- Verification: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

**Remaining**
- Next concrete task.
- Known gaps.

**Blockers / decisions**
- Anything waiting on a human, or a decision that changed the blueprint.
```

Keep the "Remaining" list as the live backlog. When a phase finishes, mark it in §14 and
add the next phase's first tasks to `PROGRESS.md`.

---

## 17. Risks, gotchas & edge cases

### Next.js 16

- **`middleware.ts` is deprecated → use `src/proxy.ts`.** Export `proxy` (or default) and a
  `config.matcher`. Use `getSessionCookie` for the optimistic check only.
- **`params` and `searchParams` are Promises.** Use `PageProps<'/route'>` and `await` them.
- **`cookies()` / `headers()` are async.** Always `await`.
- **`cacheComponents: true`:** do not use `export const dynamic = 'force-dynamic'`; wrap
  request-time reads in `<Suspense>`; use `use cache` + `cacheTag` for public data; use
  `instant = false` only as a temporary opt-out.
- **`next dev` rewrites the rules block in `AGENTS.md`.** Preserve it.
- **`next/image` remote hosts** must be listed in `next.config.ts` (`images.remotePatterns`).

### MongoDB / BetterAuth

- BetterAuth returns string ids while Mongo stores `ObjectId`; use `toObjectId` helpers.
- `usePlural: true` is required for the `users` collection name.
- Additional fields must be declared or they are silently dropped from the session.
- The JWT plugin adds a `jwks` collection; do not be surprised by extra collections.
- Unique indexes are the only reliable duplicate-application guard under concurrency; catch
  `E11000` and return 409.
- Free-plan count-then-insert can race; use a transaction or accept the small race for the
  demo and document it.
- Search with user input must escape regex metacharacters to avoid ReDoS/injection.

### Auth / security

- Never trust `role`, `plan`, `amount`, `tutorId`, or `studentId` from the client.
- Admin role changes must be server-authorized; prevent self-demotion/last-admin removal.
- JWT claims can be stale; load the user from the DB in `verifyToken`.
- Session cookies must be HttpOnly/Secure/SameSite; no tokens in `localStorage`.
- Rate-limit auth, payments, and uploads; use `helmet`.
- CORS: allow only `CLIENT_URL`; `credentials: true`; do not use `*`.
- Log errors server-side; never return stack traces or secrets to the client.

### Stripe

- Webhook route must receive the **raw body**; register it before `express.json()`.
- Verify the signature; return 400 on failure.
- Idempotency via unique `stripeSessionId`; replay must be a no-op.
- Use Price IDs; never trust a client-sent amount.
- Success redirect is not proof of payment; verify with Stripe.
- Local webhooks need the Stripe CLI.

### ImgBB

- API key stays server-side.
- Enforce MIME type and size; do not trust the filename extension.
- Validate the returned URL host; store only the URL.
- Consider orphaned images when a tuition is deleted (cleanup is optional for the demo).

### Product edge cases

- Tutor edits a rejected post → reset to `pending` and clear the reason.
- Deleting a tuition with applications → cascade or block; document the choice.
- Accepting one application → decide whether to close the tuition and reject the rest
  (recommended).
- Admin changes a tutor to student → their tuitions remain; decide whether to close them.
- User upgrades to Pro, then changes role → plan remains `pro`; product decision.
- Timezone/currency: store UTC dates; format in the UI; BDT vs USD labels.
- Seeded accounts and test Stripe keys must never reach production.

---

## 18. Open decisions (defaults chosen)

These are the defaults this blueprint assumes; confirm before implementing if the product
owner disagrees.

| Question | Default |
|---|---|
| Express vs Next API routes? | Express, per the brief |
| Where does BetterAuth run? | Express; Next proxies `/api/*` |
| UI system? | shadcn/ui only; remove DaisyUI classes |
| Accept behavior? | Accept one → close tuition → reject remaining pending |
| Delete tuition with applications? | Cascade-delete applications (or block if accepted) |
| Student Pro benefit? | Unlimited bookmarks + badge + Pro-first applicant ranking; applying stays free |
| Email verification? | Off for the demo |
| Optional features? | Pagination, dark/light theme, bookmarks (then AI seed/ratings) |

---

## 19. Implementation status (2026-11-23) — Student dashboard pass

### Completed

- **Saved Tuitions**
  - Backend (`mentorLagbe-server/index.js`): `savedTuitions` collection with unique
    `{ studentId, tuitionId }` and recent-by-student indexes; `GET /saved-tuitions`,
    `POST /saved-tuitions`, `DELETE /saved-tuitions/:tuitionId`. All routes are
    student-only and scoped to the signed-in student. Save/remove are idempotent.
  - Frontend: `src/components/tuitions/saved-tuitions-provider.tsx` keeps one saved-id set
    for the student dashboard (no per-card requests), `save-tuition-button.tsx` adds the
    bookmark toggle to `TuitionCard`, and
    `src/app/dashboard/student/saved-tuitions/page.tsx` lists saved tuitions with loading,
    empty, error, detail-dialog, remove-confirmation, and toast states.
- **Student Overview**
  - Backend: `GET /student/overview` returns total/pending/accepted/rejected application
    counts, saved count, plan, and the 5 most recent applications enriched with tutor and
    fee data. Student-only.
  - Frontend: `src/app/dashboard/student/overview/page.tsx` renders four stat cards,
    recent applications, quick links to browse/applications/saved/profile, loading
    skeletons, error retry, and empty states.
- **Student Profile**
  - Backend: `GET /profile` returns the full profile; `PATCH /profile` now accepts partial
    `name`, `phone`, `address`, `bio`, and `image` updates (email/role/plan remain
    read-only). Added the `users.address` field (Mongo needs no migration).
  - Frontend: `src/app/dashboard/student/update-profile/page.tsx` loads the profile,
    validates name/phone/address/bio and image type/size, uploads the photo, shows role/plan
    badges, and refreshes the session/Navbar after a successful save.
- **Route protection**
  - `src/app/dashboard/student/layout.tsx` guards every student page: pending sessions show
    a loader, guests are sent to `/sign-in?next=…`, and non-student roles are redirected to
    their own dashboard. Backend routes independently enforce `auth` + `role === "student"`.
  - `/sign-in` now honors a safe internal `next` path after login.
- **Verification**: `npx tsc --noEmit` passes. `npx eslint` on all changed files passes with
  no errors (only pre-existing warnings in `browse-tuitions`). Backend endpoints were smoke
  tested against MongoDB (profile read/update/restore, save/list/duplicate/remove, overview
  stats with and without an application, 401 when signed out); test documents were removed.
  `npm run build` still fails on the pre-existing `"/"` prerender error described below.

### Remaining

1. Fix the pre-existing `"/"` build failure: `src/components/shared/featured-tutions.tsx`
   calls `getAllTuitions()` (uncached `fetch`) outside `<Suspense>`. Use `"use cache"` +
   `cacheTag`, a `<Suspense>` boundary, or `export const instant = false` on the home page.
2. Fix the pre-existing lint error in `src/app/dashboard/tutor/update-profile/page.tsx`
   (`react-hooks/set-state-in-effect`) if the tutor profile page is touched.
3. Add a public tuition detail route (`/tuitions/[id]`) and link saved/detail views to it;
   saved tuitions currently use an in-page details dialog.
4. Remaining product work from §14: public catalog/home polish, admin operations, and the
   optional Student Pro checkout. Profile fields from §5.2 that do not exist yet
   (`institution`, `classLevel`, `location`) can be added the same way as `address`.

### Blockers / decisions

- Saved tuitions live in a separate `savedTuitions` collection (not an array on the user)
  so joins and unique constraints stay simple.
- The backend stores auth collections as singular `user`/`session` (the current adapter
  behavior); domain code keeps using `String(_id)` ids.
- The dashboard's route protection is client-side (session-aware) because auth is handled
  by BetterAuth in the Next route handler; the Express API remains the authoritative guard.

---

## 20. Implementation status (2026-11-24) — Student Pro subscription

> **Superseded in part by §21:** the assignment also requires a Free 5-bookmark cap,
> unlimited Pro bookmarks, and Pro-first applicant ranking. §20's “display-only”
> bookmark statement is historical.

### Completed

- **Product scope (kept exactly to §1/§8.1):** Free students keep every core action
  (apply, track, save). Student Pro is a **one-time $10** checkout that adds the Pro badge
  and priority application highlighting. No application/save limits were added.
- **Backend (`mentorLagbe-server/index.js`)**
  - Shared `PRO_PLANS` map: Tutor Pro `1500` cents, Student Pro `1000` cents; Tutor
    checkout behaviour is unchanged.
  - `GET /student/plan` returns `{ plan, status, isPro, price, currency, since, expiresAt }`.
    `expiresAt` is `null` because the purchase is one-time.
  - `GET /tutor/applications` / `GET /tutor/overview` join each applicant's current plan
    live and expose `studentPlan` / `studentIsPro` for highlighting.
  - `/payments/checkout`, `/payments/verify`, `/payments/webhook`, and
    `completeCheckoutSession` stay the only upgrade path: Stripe must report a paid,
    signature-verified session whose `metadata.plan` matches the user's role before
    `users.plan` becomes `"pro"`.
  - `payments` documents store `userId`, `userEmail`, `plan`, `amount` (cents), `currency`,
    `stripeSessionId`, `stripePaymentIntentId`, `status`, `createdAt`, `completedAt`.
  - Status/expiry rules: `checkout.session.completed` /
    `checkout.session.async_payment_succeeded` complete the payment and upgrade;
    `checkout.session.expired` / `checkout.session.async_payment_failed` mark a pending
    payment `failed` and never downgrade the user. Replays are idempotent.
- **Frontend**
  - `src/app/dashboard/student/upgrade-pro/page.tsx`: $10 Free vs Pro comparison, Pro
    Active status, member-since date, no-expiry note, Stripe test-mode note, payment
    history, and post-checkout verification.
  - `src/app/dashboard/tutor/applicants/page.tsx` and `overview/page.tsx`: amber highlight
    and crown **Pro** badge for Pro applicants.
  - `src/lib/action.ts`: plan/application types extended.
  - `src/app/(root)/page.tsx`: `export const instant = false` fixes the pre-existing
    featured-tuitions prerender failure.

### Verification

- `npx tsc --noEmit` passes.
- `npm run build` passes (24/24 pages).
- `npx eslint` on all changed files passes.
- A temporary integration test (removed after the run; MongoDB + Stripe test keys,
  temporary `:5001` server, signed webhook secret, test data removed) verified: free→pro
  plan, $10 test-mode Stripe session, pending/completed/failed payment records, invalid
  signature rejection, expiry no-upgrade, paid webhook upgrade, idempotent replay,
  already-Pro rejection, and Pro applicant highlighting for both Pro and Free students.
- A temporary headless-Chrome UI smoke test (removed after the run) verified the free plan
  page, `$10` Student Pro card, test-mode note, redirect to `checkout.stripe.com`, pending
  `payments` row, cancel return with query cleanup, and no upgrade after cancelling.

### Remaining

1. Set `STRIPE_WEBHOOK_SECRET` from `stripe listen` (or the Stripe dashboard) and restart
   the backend for real webhook delivery; `/payments/verify` is the secure fallback.
2. The pre-existing `react-hooks/set-state-in-effect` lint error in
   `src/app/dashboard/tutor/update-profile/page.tsx` is unrelated and still fails
   `npm run lint`.
3. Public catalog/home polish, admin operations, and a public `/tuitions/[id]` route remain
   from §14.

---

## 21. Implementation status (2026-11-24) — Free/Pro restriction review

### Completed

- **Free 5-bookmark cap** (`mentorLagbe-server/index.js`): `POST /saved-tuitions` rejects
  a sixth distinct save for a Free student with `403 PLAN_LIMIT` (`limit: 5`). Duplicate
  saves remain idempotent at the cap, removing one frees a slot, and Pro students are
  unlimited. `GET /student/plan` now returns `savedCount`, `savedLimit`, and
  `canSaveMore`.
- **Priority booking** (`GET /tutor/applications`): Pro applicants are ranked before Free
  applicants, newest-first within each group. Existing amber highlighting and Pro badge
  are retained.
- **Student UI:** the saved-tuitions page shows `X of 5 bookmarks used`, an
  `Unlimited bookmarks` label for Pro, and an upgrade banner at the cap. The upgrade page
  now lists the actual Free/Pro bookmark benefits.
- **Stripe price integrity:** Student Pro Checkout disables Adaptive Pricing so the
  hosted page shows **$10.00 USD**. Tutor Pro checkout is unchanged.
- **Verification:** a temporary integration suite (removed after the run) confirmed the
  5-save cap, duplicate/remove behavior, 8-save Pro path, Pro-first applicant order,
  test-mode $10 Checkout session, invalid/expired/paid webhook handling, idempotent
  replay, database `plan/proSince` update, `payments` amount/currency/status, payment
  history, already-Pro rejection, and unchanged $15 Tutor Pro checkout. Headless Chrome
  confirmed the hosted page displays **$10.00**, the Free saved page shows
  `5 of 5 bookmarks used` plus the upgrade banner, the Pro saved page shows
  `Unlimited bookmarks`, and the upgrade page lists both bookmark benefits.
  `npx tsc --noEmit` and changed-file ESLint pass, and `npm run build` passes.

### Remaining

1. Set `STRIPE_WEBHOOK_SECRET` for real local webhook delivery; `/payments/verify` remains
   the fallback.
2. The pre-existing tutor-profile lint error still fails full `npm run lint`.
3. The hosted Stripe card form was not submitted in headless Chrome; the paid path was
   verified with a real test-mode session plus a signed webhook.

### Decisions

- Free = 5 saved tuitions; Pro = unlimited. This supersedes the earlier display-only
  bookmark interpretation.
- Priority booking = Pro-first ranking in the tutor applicant queue, with highlighting
  retained.
