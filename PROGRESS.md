# MentorLagbe — Progress Log

> Newest entries first. Every task updates this file with **Completed**, **Remaining**, and
> **Blockers / decisions**. See `AGENT.md` for the full blueprint.

## 2026-11-26 — Tutor Dashboard assignment audit and repairs

**Completed**

- Audited every Tutor Dashboard route, its data clients, the related Express endpoints,
  sidebar navigation, plan/payment flow, and public-tuition eligibility against the Tutor
  requirements in `AGENTS.md` §5, §6, §7, §8, §10.5, and §15.
- Added `src/app/dashboard/tutor/layout.tsx`, providing the missing Tutor-only client
  route guard. Guests are sent to sign-in with a safe return URL; student/admin sessions
  are sent to their own dashboard. Express remains the authoritative guard.
- Fixed the shared BetterAuth client in `src/lib/auth-client.ts`; session hooks, sign-in,
  and sign-up now use one configured client, restoring role-aware sidebar navigation.
- Fixed Tutor profile hydration in `src/app/dashboard/tutor/update-profile/page.tsx`.
  It now reads `/profile`, preserves existing phone/bio/image data, has loading/error/retry
  UI, and no longer overwrites saved fields with empty session values.
- Aligned posting/edit validation with the assignment's 30-character description minimum;
  added Tutor post-banner JPG/PNG/WebP + 5 MB validation, preview, remove action, and a
  redirect to My Tuitions after successful submission.
- Completed Tutor management behavior in `src/app/dashboard/tutor/my-tuitions/page.tsx`
  and `mentorLagbe-server/index.js`: application counts and posted dates are displayed;
  only approved posts can be toggled active/closed; editing a rejected post resubmits it
  as pending; deleting cascades non-accepted applications and blocks an accepted tuition.
- Completed applicant workflow: applications now require an approved, active tuition and
  a 20–1000 character note; accepting closes the tuition and rejects its other pending
  applications, and the applicants table refreshes to show the final state.
- Expanded Tutor overview metrics to posts used (`n/2` Free or `n` Pro), total applicants,
  accepted applicants, active tuitions, and a Free-to-Pro CTA. The existing Stripe Checkout,
  webhook, verify fallback, idempotent payment record, and database plan sync were reviewed
  and retained.
- Verification: `npx.cmd tsc --noEmit` passes; `npm.cmd run lint` passes with 11 existing
  warnings and no errors; `node --check ../mentorLagbe-server/index.js` passes.

**Remaining**

1. Replace client-side ImgBB uploads (`NEXT_PUBLIC_IMGBB_API_KEY`) with the assignment's
   authenticated server-side upload proxy; the present Tutor banner/profile upload works,
   but exposes the key in the browser bundle.
2. Add the admin-facing rejection-reason input/display so a rejected Tutor post can show
   its reason before the Tutor edits and resubmits it.
3. The legacy Tutor tuition contract still uses `Online|Offline`, `monthlyFee`, and
   `daysPerWeek`; it does not yet implement the blueprint's `hybrid`, required offline
   location, BDT salary, schedule, and requirements fields. This needs a coordinated
   API/form/public-card migration rather than a partial dashboard-only change.
4. `npm.cmd run build` is blocked by this environment's inability to fetch the existing
   Google Geist fonts from `fonts.googleapis.com`; no application compilation failure was
   reported before that external fetch failure.

**Blockers / decisions**

- Accepted tuitions cannot be deleted; all other deletions cascade their applications.
  Accepting an applicant closes the post and rejects all other pending applications, as
  required by the recommended assignment workflow.
- No Stripe payment was submitted in this audit because doing so would create an external
  payment/session; the existing checkout/webhook/verify implementation was code-reviewed.

## 2026-11-25 — Admin overview and user role management

**Completed**

- **Backend (`mentorLagbe-server/index.js`)**
  - Added `GET /admin/overview` (auth + `verifyAdmin`) with live MongoDB counts:
    total users, students, tutors, admins, total tuitions, pending/approved/rejected
    tuitions, completed payments, and completed Stripe revenue (cents). Pending also
    counts legacy tuition documents without an `approvalStatus`.
  - Added `GET /admin/users` (auth + `verifyAdmin`) returning every registered user
    newest-first with `id`, `name`, `email`, `role`, `plan`, `createdAt`, and
    `updatedAt`.
  - Added `PATCH /admin/users/:id/role` (auth + `verifyAdmin`) validating
    `student | tutor | admin`, persisting the role and `updatedAt`, and returning the
    updated user. Self-role changes and demoting the final admin are blocked; invalid
    ids return `404` and invalid roles return `400`.
  - Added a shared `usersCollection` reference and `toAdminUser` mapper; no new
    collections or duplicate APIs.
- **Frontend**
  - `src/app/dashboard/admin/page.tsx` is now the Admin Overview at `/dashboard/admin`:
    five stat cards (users, tutors, pending tuitions, approved tuitions, Stripe revenue),
    a pending/approved/rejected moderation breakdown, quick links, refresh, skeleton
    loading, and error/retry states.
  - `src/app/dashboard/admin/overview/page.tsx` now redirects to `/dashboard/admin`, and
    the admin sidebar Overview link points to `/dashboard/admin`.
  - `src/app/dashboard/admin/users/page.tsx`: user table with name, email, role,
    registration date, search, role-change select, self-role lock, per-row loading,
    toast feedback, skeleton loading, empty/search-empty, and error/retry states.
  - `src/lib/action.ts`: added `AdminRole`, `AdminUser`, `AdminOverview`,
    `getAdminOverview()`, and `getAdminUsers()`.
  - `src/lib/mutation.ts`: added `updateUserRole(id, role)`.
- **Verification**
  - `npx tsc --noEmit` passes.
  - `npx eslint` on all changed frontend files passes.
  - `node --check mentorLagbe-server/index.js` passes.
  - `npm run build` passes (25/25 pages), including `/dashboard/admin` and
    `/dashboard/admin/users`.
  - Temporary integration smoke test (temporary `:5012` server, temporary sessions and
    test user; all removed afterward): admin endpoints return `401` unauthenticated and
    `403` for a student; overview counts match the users/tuitions/transactions lists;
    revenue equals the sum of completed payments; invalid roles and self-role changes
    return `400`; missing users return `404`; and a role update persists in MongoDB and
    is visible in `GET /admin/users`.

**Remaining**

1. The pre-existing `react-hooks/set-state-in-effect` lint error in
   `src/app/dashboard/tutor/update-profile/page.tsx` still fails full `npm run lint`.
2. Admin user listing is intentionally unpaginated to satisfy “display all registered
   users”; add search pagination only if the user base grows.

**Blockers / decisions**

- Admins cannot change their own role, and the last admin cannot be demoted, to prevent
  locking the platform out of admin access.
- Revenue uses `payments.amount` for `status: "completed"` only, matching the existing
  transactions page and Stripe cent values.

## 2026-11-25 — Admin tuition moderation and transaction management

**Completed**

- **Backend (`mentorLagbe-server/index.js`)**
  - Added `verifyAdmin`, an admin-only guard that runs after `auth` so the role is
    loaded from MongoDB, never trusted from the client.
  - `GET /admin/tuitions` returns every tutor-submitted tuition (newest first) with its
    existing `tutorName`, `tutorEmail`, `mode`, `monthlyFee`, and `approvalStatus`.
  - `PATCH /admin/tuitions/:id/approval` accepts only `approved` or `rejected`, updates
    `approvalStatus`/`updatedAt`, and returns the updated public tuition shape. The
    existing public `GET /add-tuitions` query already returns only
    `approvalStatus: "approved"` + `isActive !== false`, so rejected/pending posts stay
    out of Browse Tuitions.
  - `GET /admin/transactions` returns only `payments.status === "completed"` records,
    joins the buyer's current name/email/role from the `user` collection by string
    `userId`, and exposes `planName`, `amount` (cents), `transactionId`
    (`stripePaymentIntentId` → `stripeSessionId`), and `paymentDate`
    (`completedAt` → `updatedAt` → `createdAt`). No new collections or Stripe changes.
  - All three routes use the existing `auth` middleware plus `verifyAdmin`; a student
    session receives `403` and an anonymous request receives `401`.
- **Frontend**
  - `src/lib/action.ts`: added `AdminTransaction`, `getAdminTuitions()`, and
    `getAdminTransactions()` using the existing `API_URL`/`credentials: "include"`
    pattern.
  - `src/lib/mutation.ts`: added `updateTuitionApproval(id, "approved" | "rejected")`.
  - `src/app/dashboard/admin/tuitions/page.tsx`: moderation table with title, subject,
    tutor name/email, monthly fee, mode, approval status, submitted date, status filter
    tabs with counts, Approve/Reject actions with per-row loading, toasts, refresh,
    skeleton loading, empty, and error states.
  - `src/app/dashboard/admin/transactions/page.tsx`: responsive paid-only table with
    user name, email, role, plan name, amount (cents → currency), transaction ID, and
    payment date, plus successful-transaction/revenue summaries, loading skeletons,
    empty, and error states.
  - `src/app/dashboard/admin/layout.tsx`: client-side admin route guard mirroring the
    student layout (guests → sign-in, other roles → their dashboard, pending session →
    loader). API authorization remains authoritative.
- **Verification**
  - `npx tsc --noEmit` passes.
  - `npx eslint` on all changed frontend files passes.
  - `node --check mentorLagbe-server/index.js` passes.
  - `npm run build` passes (24/24 pages), including the new admin routes.
  - Temporary integration smoke test (temporary `:5011` server, temporary admin/student
    sessions, temporary pending tuition; all removed afterward) verified: 401 for
    anonymous admin reads, 403 for a student, all tuitions returned for admin, invalid
    approval status → 400, approve → visible publicly, reject → hidden publicly, and
    transactions contain only completed payments (3 seeded rows) with joined
    name/role/plan/amount/intent-id/date.

**Remaining**

1. The same existing `react-hooks/set-state-in-effect` lint error in
   `src/app/dashboard/tutor/update-profile/page.tsx` still fails full `npm run lint`.
2. Admin users and admin overview pages remain "Coming soon" (not part of this task).

**Blockers / decisions**

- Tuition moderation reuses the existing `approvalStatus` field; no new moderation
  collection or duplicate API was added.
- Transaction "plan name" is derived from the stored plan key (`student_pro` →
  Student Pro, `tutor_pro` → Tutor Pro); amounts remain stored in cents as Stripe wrote
  them.

## 2026-11-24 — Student Free/Pro review: bookmark limits, priority booking, Stripe audit

**Completed**

- Reviewed the Student Free/Pro implementation against the assignment's restriction set
  and the earlier blueprint. Two missing conditions were found and fixed without
  changing Tutor Pro checkout behavior.
- **Free bookmark limit (5):**
  - `mentorLagbe-server/index.js`: `POST /saved-tuitions` now allows a Free student to
    keep at most **5** saved tuitions. A sixth distinct save returns `403` with
    `code: "PLAN_LIMIT"`, `limit: 5`, and the current count.
  - Duplicate saves stay idempotent at the limit (no false limit error), and removing a
    bookmark frees a slot for a new one.
  - Student Pro (`users.plan: "pro"`) is unlimited; no limit check runs for Pro students.
  - `GET /student/plan` now also returns `savedCount`, `savedLimit` (`5` for Free,
    `null` for Pro), and `canSaveMore`.
- **Priority booking:**
  - `GET /tutor/applications` now ranks Pro applicants before Free applicants while
    preserving newest-first order inside each group. The existing amber row and crown
    **Pro** badge remain unchanged.
- **Student UI:**
  - `src/app/dashboard/student/saved-tuitions/page.tsx` shows `X of 5 bookmarks used`
    for Free students, `Unlimited bookmarks` for Pro, and an amber limit-reached banner
    linking to the Student Pro upgrade page.
  - `src/app/dashboard/student/upgrade-pro/page.tsx` now states “Save up to 5 tuitions”
    on Free and “Unlimited saved tuitions” on Pro.
  - `src/lib/action.ts` types include `savedCount`, `savedLimit`, and `canSaveMore`.
- **Stripe price integrity:**
  - Student Pro Checkout now disables Stripe Adaptive Pricing, so the hosted page shows
    **$10.00 USD** instead of a localized conversion (the hosted page previously showed
    `BDT 1,298.15` while the API session still reported 1000 USD). Tutor Pro checkout is
    untouched.
- Verification:
  - Temporary integration suite (MongoDB + Stripe test keys + temporary `:5001` server
    with signed webhook secret; removed after the run):
    - Free save #1–5 succeed. The 6th distinct save returns `403 PLAN_LIMIT`; duplicate
      save at the limit succeeds without increasing the count; removing one allows a new
      save; `savedCount` stays at 5.
    - Pro account saves 8 tuitions, `savedLimit: null`, `canSaveMore: true`.
    - Pro applicant applied **first** (older), Free applicant applied later; the tutor
      applicant queue returns the Pro applicant first with `studentIsPro: true`.
    - Real Stripe test-mode session: `livemode: false`, `amount_total: 1000`,
      `currency: "usd"`, `adaptive_pricing.enabled: false`, correct `metadata.userId` /
      `metadata.plan`; pending payment row at 1000 cents.
    - Invalid webhook signature → `400`; signed `checkout.session.expired` → payment
      `failed` and no upgrade.
    - Signed paid webhook → user `plan: "pro"`, `proSince` set, payment `completed` with
      1000/USD/`student_pro`/`completedAt`; replay leaves one payment and an unchanged
      `completedAt`; already-Pro checkout → `400`.
    - Tutor Pro checkout still returns a $15 session; a student is still blocked from
      buying Tutor Pro (`403`).
    - `/payments/mine` contains the completed Student Pro record.
  - Headless Chrome confirmed the Stripe hosted page now displays **$10.00**, the Free
    saved page shows `5 of 5 bookmarks used` with the upgrade banner, the Pro saved page
    shows `Unlimited bookmarks`, and the upgrade page lists both bookmark benefits.
  - `npx tsc --noEmit` passes; changed-file ESLint passes; `npm run build` passes
    (24/24 pages).

**Remaining**

- Set `STRIPE_WEBHOOK_SECRET` from `stripe listen --forward-to
  localhost:5000/payments/webhook` for live local webhook delivery; `/payments/verify`
  remains the secure fallback.
- The pre-existing unrelated lint error in
  `src/app/dashboard/tutor/update-profile/page.tsx` still makes full `npm run lint`
  exit non-zero.
- The hosted Stripe card form was not submitted in this headless environment; the paid
  path was verified with a real test-mode Checkout Session plus a signed webhook. The
  hosted page's **$10.00** display and redirect were verified in Chrome.

**Blockers / decisions**

- Free students may save **5** tuitions; Student Pro is unlimited. This supersedes the
  earlier “display-only” interpretation for bookmarks.
- “Priority booking” is implemented as Pro-first ranking in the tutor applicant queue,
  with the existing Pro highlight retained.

## 2026-11-24 — Student Pro subscription: checkout, webhooks, plan features

**Completed**

- Student Free vs Pro (per blueprint §1/§8/§10.5): Free students keep every core action
  (apply, track, save). Student Pro adds only the specified benefits — a **Pro badge** and
  **priority application highlighting** — at a **$10 one-time** price. No application,
  save, or posting limits were added.
- Backend (`mentorLagbe-server/index.js`):
  - Confirmed the shared `PRO_PLANS` map keeps Tutor Pro at **$15** and Student Pro at
    **$10** (`amount: 1000`), so Tutor checkout behaviour is unchanged.
  - `GET /student/plan` now returns the explicit subscription state:
    `{ plan, status: "active"|"free", isPro, price, currency, since, expiresAt }`.
    Student Pro is a one-time purchase, so `expiresAt` is `null` (no invented expiry).
  - `getAuthUser`/`GET /profile` expose `proSince` so the paid date follows the user
    session and profile.
  - `GET /tutor/applications` and `GET /tutor/overview` join the student's current plan
    live and return `studentPlan` / `studentIsPro`, so existing applications immediately
    show Pro priority after an upgrade.
  - `POST /payments/checkout`, `/payments/verify`, `/payments/webhook`, and
    `completeCheckoutSession` remain the only upgrade path: a paid, signature-verified
    Stripe session must match `metadata.plan` and the user's role before `users.plan`
    becomes `"pro"`. Payment documents store `userId`, `userEmail`, `plan`, `amount`
    (1000), `currency`, `stripeSessionId`, `stripePaymentIntentId`, status, and
    `completedAt`.
  - Payment status/expiry handling: `checkout.session.completed` and
    `checkout.session.async_payment_succeeded` complete the payment and upgrade;
    `checkout.session.expired` and `checkout.session.async_payment_failed` mark the
    pending payment `failed` without ever downgrading the user. Replays are idempotent.
- Frontend:
  - `src/app/dashboard/student/upgrade-pro/page.tsx` shows the $10 Free vs Pro comparison,
    the Pro **Active** status, `Member since` (`proSince`), `No expiry (one-time
    purchase)`, Stripe test-mode note, and payment history. Success/cancel returns are
    verified through the backend before the plan UI changes.
  - `src/app/dashboard/tutor/applicants/page.tsx` and
    `src/app/dashboard/tutor/overview/page.tsx` highlight Pro applicants with an amber row
    and a crown **Pro** badge; Free applicants remain unhighlighted.
  - `src/lib/action.ts` types now carry `studentPlan`/`studentIsPro` and the plan
    status/since/expiresAt fields.
  - `src/app/(root)/page.tsx` uses the blueprint-approved `export const instant = false`
    opt-out so the pre-existing uncached featured-tuitions fetch no longer fails the build.
- Verification:
  - `npx tsc --noEmit` passes.
  - `npm run build` now completes (24/24 static pages; the previous `"/"` prerender error
    is fixed).
  - `npx eslint` on every changed frontend file passes with no errors.
  - A temporary integration test (removed after the run) against MongoDB + Stripe test
    keys, using a temporary server on `:5001` with a locally signed webhook secret; all
    test data removed:
    - Student plan starts `free`; Tutor Pro checkout is rejected for a student (`403`);
      unknown plans (`400`) and unpaid verify (`400`) are rejected.
    - Real Stripe **test-mode** Checkout session: `livemode: false`, `amount_total: 1000`,
      `currency: usd`, `metadata.plan: student_pro`, hosted on `checkout.stripe.com`;
      pending `payments` row stored at 1000 cents.
    - Invalid webhook signature → `400`. Signed `checkout.session.expired` → payment
      `failed`, plan unchanged.
    - Signed `checkout.session.completed` (`payment_status: paid`) → `users.plan: "pro"`,
      `proSince` set, payment `completed` at 1000 cents; replay is a no-op (one payment).
    - `/student/plan` returns `pro`, `status: "active"`, `price: 1000`, `expiresAt: null`;
      a second checkout is rejected (`400`).
    - Pro and Free students both apply successfully (no application restriction);
      `/tutor/applications` and `/tutor/overview` flag the Pro applicant and leave the
      Free applicant unflagged.
  - A temporary API smoke test (removed after the run) passed against `:5000` for plan,
    checkout, price, pending payment, and role checks.
  - A temporary headless-Chrome UI smoke test (removed after the run) verified the free
    plan page, `$10` Student Pro card, test-mode note, real redirect to
    `checkout.stripe.com`, pending `payments` row, cancel return with query cleanup, and
    no upgrade after cancelling.

**Remaining**

- Set `STRIPE_WEBHOOK_SECRET` in `mentorLagbe-server/.env` from
  `stripe listen --forward-to localhost:5000/payments/webhook` (or the Stripe dashboard)
  and restart the server for real webhook delivery. Until then `/payments/verify` remains
  the secure fallback after a paid redirect. The code and signed-event tests already
  verify the hook path.
- Pre-existing, unrelated lint error in
  `src/app/dashboard/tutor/update-profile/page.tsx` (`react-hooks/set-state-in-effect`)
  still makes the full `npm run lint` command exit non-zero.
- Optional: automate the hosted Stripe card form in a browser for a full click-through
  test; the API/integration suite already exercises real test-mode sessions and webhooks.

**Blockers / decisions**

- Student Pro is a **one-time** $10 purchase per blueprint §8.1, not a recurring
  subscription, so there is no plan expiry date. “Expiry” handling covers Stripe Checkout
  session expiry and failed/abandoned payment rows; a failed/cancelled/expired checkout
  never changes `users.plan`.
- Pro benefits are display-only (badge + priority highlighting); applying, saving, and
  tracking stay available to Free students exactly as specified.

## 2026-11-23 — Student Dashboard: saved tuitions, overview, profile


**Completed**

- Saved Tuitions
  - Backend (`mentorLagbe-server/index.js`): added the `savedTuitions` collection with a
    unique `{ studentId, tuitionId }` index and `{ studentId, createdAt }` index;
    `GET /saved-tuitions` (joined with tuition data, `savedAt` included),
    `POST /saved-tuitions` (idempotent save), and `DELETE /saved-tuitions/:tuitionId`
    (idempotent remove). Every route is student-only and scoped to the current session.
  - Frontend: `src/lib/action.ts` (`getSavedTuitions`, `SavedTuition`),
    `src/lib/mutation.ts` (`saveTuition`, `removeSavedTuition`),
    `src/components/tuitions/saved-tuitions-provider.tsx` (single saved-id set for the
    dashboard), `src/components/tuitions/save-tuition-button.tsx` (bookmark toggle), and
    `src/app/dashboard/student/saved-tuitions/page.tsx` (loading/empty/error states,
    details dialog, remove confirmation, sonner toasts). The bookmark toggle is wired into
    `src/components/tuitions/tuition-card.tsx`, so students can save from Browse Tuitions.
- Student Overview
  - Backend: `GET /student/overview` returns total/pending/accepted/rejected applications,
    saved count, plan, and the five most recent applications with tutor/fee data.
  - Frontend: `src/app/dashboard/student/overview/page.tsx` now shows four stat cards,
    recent applications, quick links, skeleton/error/empty states, and a refresh action.
- Student Profile
  - Backend: `GET /profile` plus an extended `PATCH /profile` that accepts partial
    `name`, `phone`, `address`, `bio`, and `image` updates. Email, role, and plan stay
    read-only. Added the `users.address` field.
  - Frontend: `src/app/dashboard/student/update-profile/page.tsx` loads the saved profile,
    supports the image upload/preview/remove flow, validates field lengths and image
    type/size, shows role/plan badges, and calls `router.refresh()` after saving.
- Route protection
  - `src/app/dashboard/student/layout.tsx` guards the student dashboard (guest → sign-in
    with `next`, wrong role → own dashboard, pending session → loader) and provides the
    saved-tuitions context. `/sign-in` now redirects to a safe internal `next` path.
- Docs: `AGENTS.md` §19 records this pass; `PROGRESS.md` updated here.
- Verification: `npx tsc --noEmit` passes; `npx eslint` on all changed files reports no
  errors. Backend smoke tests against MongoDB passed: profile read/update/restore, save →
  list → duplicate save → remove, overview stats with and without an application, and a
  `401` for an unauthenticated saved-tuitions request. All smoke-test documents were
  removed. `npm run build` still stops at the pre-existing `"/"` prerender error
  (`getAllTuitions()` fetch outside Suspense/cache in `featured-tutions.tsx`).

**Remaining**

- Fix the pre-existing home-page build error (cache/Suspense or `instant = false`).
- Fix the pre-existing `react-hooks/set-state-in-effect` lint error in the tutor profile
  page when that page is next touched.
- Add the public `/tuitions/[id]` detail route if saved/detail views should link outside
  the dashboard.
- Public catalog/home polish, admin operations, and optional Student Pro checkout.

**Blockers / decisions**

- Saved tuitions use a dedicated collection rather than an array on the user document.
- Student route protection is client-side because BetterAuth runs in the Next route
  handler; Express still enforces auth and roles on every data request.

## 2026-11-22 — Repair Stripe Hosted Checkout end to end

**Completed**

- Frontend/backend contract fixes:
  - `src/lib/action.ts` — added `verifyProPayment(sessionId)`, which calls
    `GET /payments/verify?session_id=…` with credentials and normalizes errors. The
    post-tuition page already imported this function but it did not exist.
  - `src/lib/mutation.ts` — corrected `ProCheckout` to the real backend response
    `{ url, sessionId, publishableKey? }`; removed the dead `confirmProPayment` helper
    that called the non-existent `/payments/confirm` endpoint.
- Backend hardening (`mentorLagbe-server/index.js`):
  - `completeCheckoutSession()` is still the only upgrade path. It now requires a paid
    session, `metadata.plan === "tutor_pro"`, and a user whose role is `tutor` before
    setting `plan: "pro"`.
  - `GET /payments/verify` now also requires `status === "complete"`,
    `payment_status === "paid"`, the Tutor Pro metadata, and session ownership. It
    returns `400` instead of silently succeeding when the upgrade cannot be applied.
  - Webhook handles `checkout.session.async_payment_failed` in addition to
    `checkout.session.expired`; both mark a pending payment `failed` without touching
    the plan.
  - `POST /add-tuitions` now rejects non-tutors with `403`; the existing free-plan
    limit remains: 2 posts for `free`, unlimited for `pro`.
  - Removed the unused Stripe Elements `completePaymentIntent()` path so hosted Checkout
    is the only supported flow.
- Verification (all test data cleaned up afterwards):
  - `npx tsc --noEmit`, `npm run lint` (0 errors, 2 pre-existing Navbar `<img>`
    warnings), `npm run build` pass.
  - Backend integration suite against MongoDB + Stripe test keys:
    - free tutor at 2/2 → third post `403 PLAN_LIMIT`; student post `403`.
    - checkout returns a real `checkout.stripe.com` URL and stores a pending payment.
    - verify without auth `401`; another user `403`; unpaid session `400`.
    - invalid webhook signature `400`; signed paid webhook upgrades to `pro` and
      completes the payment; replay is idempotent; Pro tutor can post beyond 2.
    - already-Pro checkout `400`; expired and `async_payment_failed` webhooks leave the
      plan `free`; wrong-plan and unpaid sessions do not upgrade.
  - Real Stripe **test mode** hosted checkout (headless Chrome, card
    `4242 4242 4242 4242`): redirect to the success URL, `/payments/verify` returned
    `200`, MongoDB plan became `pro`, payment recorded as completed at 1500 cents,
    re-verify did not duplicate, and posting succeeded.
  - Cancel path: clicked Stripe's Back link → cancel URL; verify `400`, plan stayed
    `free`, payment stayed `pending`.
  - Full Next.js frontend E2E on the production build: 2/2 limit UI → Upgrade button →
    Stripe → test card → success URL → frontend verify → Pro banner + tuition form,
    with no uncaught page errors.

**Remaining**

- Set `STRIPE_WEBHOOK_SECRET` from `stripe listen` (or the Stripe dashboard) and restart
  the server to enable webhook signature verification. Until then the success-page
  `/payments/verify` fallback still performs the secure upgrade.
- Student Pro checkout is still out of scope (tutor-only product today).

**Blockers / decisions**

- `.env` still has an empty `STRIPE_WEBHOOK_SECRET=`; this is intentional because the
  local signing secret is generated by `stripe listen`. The verify endpoint remains the
  active upgrade path for local testing.
- Hosted Checkout uses inline `price_data` at $15; no Stripe Price ID is required. Test
  mode is detected from the `sk_test_…` key and logged at startup.

## 2026-11-21 — Tutor Free/Pro subscriptions with Stripe Checkout

**Completed**

- Backend (`mentorLagbe-server/index.js`):
  - Installed `stripe` and read `STRIPE_PUBLISH_KEY` / `STRIPE_SECRED_KEY` (plus the
    correctly-spelled fallbacks) from `.env`.
  - Added the `payments` collection with a unique `stripeSessionId` index and a
    `{ userId, createdAt }` index.
  - `GET /tutor/plan` — returns `{ plan, tuitionCount, limit, canPost, isPro }`; free
    tutors have a limit of 2, Pro tutors have no limit.
  - `POST /payments/checkout` — tutor-only Stripe Checkout Session ($15 one-time Tutor
    Pro), stores a pending payment, returns the hosted Checkout URL.
  - `POST /payments/webhook` — registered before `express.json()` with
    `express.raw({ type: "application/json" })`; verifies the Stripe signature, handles
    `checkout.session.completed` / `checkout.session.async_payment_succeeded` /
    `checkout.session.expired`, and upgrades the user idempotently.
  - `GET /payments/verify` — fallback for delayed webhooks; retrieves the session from
    Stripe, checks ownership and `payment_status === "paid"`, then performs the same
    idempotent upgrade.
  - `POST /add-tuitions` now rejects free tutors at 2 posts with `403 PLAN_LIMIT`; Pro
    tutors are unlimited.
  - `completeCheckoutSession()` is the only code path that sets `plan: "pro"`, so an
    upgrade always requires a Stripe-verified paid session.
- Frontend data layer:
  - `src/lib/action.ts` — `TutorPlan` type, `getTutorPlan()`, `verifyProPayment()`.
  - `src/lib/mutation.ts` — `createProCheckout()` (POST, credentials included).
- Frontend UI (`src/app/dashboard/tutor/post-tuition/page.tsx`):
  - Shows a Free/Pro usage banner; at the free limit the form is replaced by Free and Pro
    plan cards. The Free button reads **Current Plan**; Pro reads **Upgrade to Pro**.
  - Upgrade redirects to the Stripe-hosted Checkout page; button shows a spinner.
  - `?payment=success&session_id=…` verifies the payment, refreshes the plan, shows a
    success toast, and reveals the form again. `?payment=cancelled` shows a cancellation
    toast and clears the query string. Errors surface as toasts.
  - Plan loading skeleton, retry state, and `Suspense` around `useSearchParams`.
- Verification:
  - `npx tsc --noEmit`, `npm run lint` (0 errors, 2 pre-existing Navbar `<img>` warnings),
    `npm run build` all pass.
  - Backend smoke tests against a test server (port 5001) with real Stripe test keys:
    - free tutor with 0 posts → posts #1 and #2 return `201`; post #3 returns
      `403 PLAN_LIMIT`; `/tutor/plan` reports `2/2`, `canPost: false`.
    - `POST /payments/checkout` returns a real Stripe Checkout URL and session id.
    - unpaid session verify → `400`; another user verifying the session → `403`;
      student checkout → `403`.
    - signed `checkout.session.completed` webhook → `200`; user plan becomes `pro`,
      payment stored as `completed`; Pro tutor can post beyond 2; replayed webhook is
      idempotent; invalid signature → `400`; checkout while Pro → `400`.
    - cleanup restored tutor3/tutor2 to their original roles/plans and removed all test
      tuitions and payments. The 3 pre-existing tutor3 tuitions were left untouched.
- `.env` now includes an empty `STRIPE_WEBHOOK_SECRET=` with a comment explaining where
  to obtain the signing secret.

**Remaining**

- Set `STRIPE_WEBHOOK_SECRET` from `stripe listen` or the Stripe dashboard webhook
  settings and restart the server so webhook verification is active. Until then the
  `/payments/verify` fallback still upgrades the plan after a paid redirect.
- Build the student apply flow on the public tuition detail page.
- Admin moderation flow and admin overview/users/tuitions/transactions pages.
- Move the ImgBB upload server-side so the key is not shipped to the browser.

**Blockers / decisions**

- The existing `.env` names are `STRIPE_PUBLISH_KEY` / `STRIPE_SECRED_KEY`; the backend
  reads those and also accepts the correctly-spelled variants.
- Redirect Checkout is used, so the publishable key is not required by the browser; it is
  still read from the environment and returned by the checkout endpoint for future
  client-side Stripe use.
- Webhook signature verification requires a configured secret. The `/payments/verify`
  endpoint is an intentional fallback that still checks `payment_status === "paid"` with
  Stripe before upgrading, so users cannot self-upgrade without a real payment.

## 2026-11-21 — Tutor Overview + Applicants pages with application APIs

**Completed**

- Backend (`mentorLagbe-server/index.js`):
  - Added `applications` collection with unique `{ tuitionId, studentId }` and
    `{ tuitionId, createdAt }` indexes.
  - `POST /applications` — student-only create endpoint; rejects duplicates with `409` and
    snapshots the student/tuition details.
  - `GET /tutor/applications` — applications for the signed-in tutor's tuitions, newest
    first, with tuition title/status attached.
  - `GET /tutor/overview` — aggregate stats (total tuitions, approved + active tuitions,
    total applicants, plan) plus the 5 most recent tuitions and applicants.
  - `PATCH /applications/:id/status` — accept/reject; owner-only (resolved through
    `tuitionId` → tuition, with a `tutorId` fallback), pending-only, validates the status.
  - `toPublicApplication` / `withTuitionDetails` helpers normalize legacy field names
    (`message`, `phone`, `schedule`, `appliedAt`, etc.).
  - `getAuthUser` now returns `plan` and `phone`.
- Frontend data layer:
  - `src/lib/action.ts` — `Application`, `ApplicationStatus`, `TutorOverview` types plus
    `getTutorApplications()` and `getTutorOverview()` (GET, credentials included).
  - `src/lib/mutation.ts` — `updateApplicationStatus()` for accept/reject.
- Frontend UI:
  - `src/app/dashboard/tutor/overview/page.tsx` — four stat cards (Total Posted Tuitions,
    Approved/Active Tuitions, Total Applicants, Current Plan), recent tuitions, recent
    applicants, and Post Tuition / My Tuitions quick actions; loading skeletons, error
    retry, and empty states.
  - `src/app/dashboard/tutor/applicants/page.tsx` — responsive table with applicant
    name/email, tuition title, phone, preferred schedule, student note, applied date, and
    status badge; Accept/Reject actions with per-row spinners and sonner toasts; loading,
    error, and empty states; refresh button.
- Verification: `npx tsc --noEmit`, `npm run lint` (0 errors, 2 pre-existing Navbar
  `<img>` warnings), `npm run build` all pass.
- API smoke test against MongoDB (tutor3 + two student sessions): created a tuition, applied
  as two students, duplicate apply → `409`, overview/applications returned the expected
  data, accept/reject updated statuses, re-reviewing → `400`, non-owner status update →
  `403`, invalid status → `400`. All smoke-test documents were deleted afterwards.

**Remaining**

- Build the student apply flow on the public tuition detail page.
- Admin moderation flow and admin overview/users/tuitions/transactions pages.
- Enforce the free-plan 2-post limit on the server.
- Move the ImgBB upload server-side so the key is not shipped to the browser.

**Blockers / decisions**

- Accept/reject currently updates only the application status. The blueprint's recommended
  "accept one → close tuition → reject remaining pending" rule is deferred to keep this
  task scoped; it can be added in the student/admin flow pass.
- The dynamic `my-tuitions/[id]` routes keep `export const instant = false` in their server
  page wrappers (existing workaround).

## 2026-11-21 — Tutor "My Tuitions" page + owner-scoped APIs

**Completed**

- Backend (`mentorLagbe-server/index.js`): added BetterAuth session-cookie authentication
  (reads the `session`/`user` collections directly), CORS with credentials, and owner-scoped
  endpoints:
  - `GET /tuitions/mine` — all tuitions owned by the signed-in user.
  - `GET /tuitions/:id` — single owned tuition.
  - `PATCH /tuitions/:id` — update editable fields only; `approvalStatus`/`isActive` are
    never accepted, so approval state is preserved.
  - `PATCH /tuitions/:id/active` — toggle `isActive` without touching approval state.
  - `DELETE /tuitions/:id` — delete an owned tuition.
  - `POST /add-tuitions` now derives `tutorId`, `tutorName`, and `tutorEmail` from the
    session and forces `approvalStatus: "pending"` / `isActive: true`.
  - Ownership is enforced on every read/write; legacy documents without `tutorId` fall back
    to matching `tutorEmail`.
- Frontend data layer: `src/lib/action.ts` now exposes `getMyTuitions` / `getTuitionById`
  (GET, credentials included) plus the existing `getAllTuitions`;
  `src/lib/mutation.ts` adds `updateTuition`, `deleteTuition`, `toggleTuitionActive`, and
  sends credentials on `postTuition`.
- Frontend UI:
  - `src/app/dashboard/tutor/my-tuitions/page.tsx` — responsive table with title,
    subject/class, monthly fee, approval badge, active toggle, and view/edit/delete actions;
    Post New Tuition button; loading, empty, and error states; delete confirmation dialog;
    sonner toasts.
  - `src/components/shared/confirm-dialog.tsx` — reusable accessible confirmation dialog.
  - `src/app/dashboard/tutor/my-tuitions/[id]/page.tsx` — owner-only details view.
  - `src/app/dashboard/tutor/my-tuitions/[id]/edit/page.tsx` — owner-only edit form that
    preserves approval status.
- Verification: `npm run lint` (0 errors, 2 pre-existing Navbar `<img>` warnings),
  `npx tsc --noEmit`, `npm run build`. API smoke-tested against MongoDB: create → list →
  detail → update → toggle → delete, 401 when signed out, and 403 when another user tries
  to read/update/toggle/delete the owner's tuition. Confirmed `PATCH` ignores
  `approvalStatus` and `isActive` sent by the client.

**Remaining**

- Add the tutor overview/applicants data and admin moderation flow.
- Enforce the free-plan 2-post limit on the server.
- Move the ImgBB upload server-side so the key is not shipped to the browser.

**Blockers / decisions**

- The dynamic `my-tuitions/[id]` routes use `export const instant = false` in their server
  page wrappers. With `cacheComponents` enabled, the shared sidebar's `usePathname()` blocks
  static prerendering of dynamic routes, so the route must be allowed to block. The sidebar
  and dashboard layout were left unchanged as requested.

## 2026-11-20 — Fix tutor post-tuition flow end to end

**Completed**

- Fixed `src/app/dashboard/tutor/post-tuition/page.tsx` (moved from the typo'd
  `(dashboard)/tutor/post-tution`): the submit handler referenced a commented-out
  `session`, which threw a `ReferenceError`; it now uses `useSession`, validates input,
  shows success/error toasts, resets the form, and disables the button while submitting.
- Rewrote `src/lib/mutation.ts`: typed `TuitionInput` (no `any`), extracted the ImgBB
  upload helper, normalizes API/upload errors, and posts to `NEXT_PUBLIC_API_URL`
  (default `http://localhost:5000`). Removed the unused `credentials: "include"`.
- Fixed `mentorLagbe-server/index.js`: parses `PORT` safely (`.env` had `PORT=5000;`),
  configures CORS for the Next origin, validates required fields, forces
  `approvalStatus: "pending"` / `isActive: true`, normalizes numbers, and adds
  `createdAt`/`updatedAt`. Added `/health` and a `start`/`dev` npm script.
- Renamed the dashboard route group to `src/app/dashboard/**` and normalized folder names
  so the sidebar links (including `/dashboard/tutor/post-tuition`) resolve.
- Added `<Toaster />` to the root layout so form feedback appears; fixed the root group
  layout to render `children`; added minimal exports to empty scaffold pages.
- Verification: `npx tsc --noEmit`, `npm run lint` (0 errors), `npm run build` (route
  `/dashboard/tutor/post-tuition` present). End-to-end: POST `/add-tuitions` returned 201,
  the document (with timestamps and forced `pending`) was read back from MongoDB
  `mentor-lagbe.tuitions`, then deleted; missing fields return 400.

**Remaining**

- Protect the tutor routes and `/add-tuitions` with the real session/role checks from the
  blueprint (the API currently trusts the request body for tutor identity).
- Implement the tutor dashboard data (overview, my tuitions, applicants) and the ImgBB
  server proxy so the key is not shipped to the browser.
- Add the free-plan 2-post limit on the server.

**Blockers / decisions**

- None.

## 2026-11-20 — Project audit & blueprint

**Completed**

- Audited the repository: Next.js 16.4.6 App Router, React 19.3, TypeScript strict,
  Tailwind v4, shadcn `base-nova`, BetterAuth 1.7.26 + MongoDB adapter.
- Identified current gaps: auth client duplication, sign-up role never sent, no
  `role`/`plan` additional fields, DaisyUI classes without DaisyUI, no Express API, no
  domain pages, no seed data, no route protection, no progress log.
- Wrote the full project blueprint in `AGENT.md`: product scope, locked architecture,
  target directory tree, data model (users/tuitions/applications/payments + auth
  collections), auth/JWT/role middleware design, API contract, Stripe and ImgBB flows,
  page-by-page behavior, UI/UX rules, seed/test accounts, env vars, phased delivery plan,
  QA matrix, and risks.
- Added a pointer to `AGENT.md` in `AGENTS.md` while preserving the Next.js-generated rules
  block.
- No application code or source files were changed.

**Remaining**

- Phase 0: fix `src/lib/auth-client.ts` (single client), decide/execute the BetterAuth move
  to Express, add `.env.example` files, add `dev:server`/`seed`/`typecheck` scripts, remove
  or implement dead links (`/forgot-password`, `/terms`, `/privacy`).
- Phase 1: scaffold `server/` (Express + TS + zod + Mongo), BetterAuth (`usePlural`,
  additional fields, JWT plugin), `verifyToken`/role middlewares, Next rewrites,
  `src/lib/api.ts`, `src/proxy.ts`.
- Phase 2: refactor Navbar off DaisyUI, add Footer (X icon), root layout metadata,
  `sonner`, loading/404/error pages.
- Phase 3: tuition model/indexes, public list/detail/latest APIs, seed script, `/tuitions`,
  `/tuitions/[id]`, home page sections.
- Phases 4–8: student, tutor, admin, Stripe payments, profile/polish as listed in
  `AGENT.md` §14.

**Blockers / decisions**

- Confirm the blueprint defaults in `AGENT.md` §18 before implementation: Express + auth
  hosted in Express (recommended), shadcn-only UI, accept-closes-tuition rule, cascade
  delete for tuition applications, Student Pro as a badge/priority benefit, email
  verification off for the demo.
- Rotate the current `BETTER_AUTH_SECRET` and MongoDB credentials if they have been shared
  or committed; `.env` is untracked but should be treated as sensitive.
