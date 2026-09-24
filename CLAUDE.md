# CLAUDE.md — Lodgely

## Repo conventions (read first)

- **Package manager:** pnpm. Node 22 (`.nvmrc`).
- **Before every commit:** `pnpm check` (typecheck, lint, Prettier, Vitest, drizzle check). Run `pnpm build` too when routes or config change.
- **Schema changes:** edit `lib/db/schema/*`, then `pnpm db:generate --name <what>` and commit the SQL. CI fails on drift.
- **DB access:** `getDb()` from `@/lib/db`, never at module top level. Tenant queries go through `db.forHotel(hotelId)` (Phase 2+).
- **Env:** add new keys to `lib/env/schema.ts` **and** `.env.example`. A test checks they stay in sync. Integration keys are optional; gate features with `isConfigured()` from `@/lib/integrations`.
- **Auth:** `requireUser()` in `(app)` server code. Staff and guest auth never share tables or cookies.
- **UI:** primitives in `components/ui`, shell in `components/app-shell`. Use tokens (`bg-primary`, `bg-muted`, `text-muted-foreground`, `border-input`, `shadow-float`), never raw hex in components. Figtree only; sentence case; no tracked-caps labels.
- **Dates:** format in the hotel's timezone (`lib/format/greeting.ts` pattern). The server runs in UTC.
- **Money / availability / pricing:** pure functions with Vitest tests, integer minor units.
- **Design work:** the `/impeccable` skill is installed (`.claude/skills/impeccable`). Use `/impeccable audit|critique|polish <target>` on UI surfaces before calling a phase done. `DESIGN.md` records the visual system (spec §9 is its brief); extend it rather than reinventing it.
- **Docs:** record choices in `DECISIONS.md` and deferrals in `TODO.md` in the same commit.
- **Commits:** conventional commits, one per phase (or smaller). Stop for review after each phase.

---

# Lodgely product spec

You are building **Lodgely** — an all-in-one hotel management SaaS for independent hotels, B&Bs, guesthouses, boutique hotels and small hotel groups (1–60 rooms). It is a direct structural clone of the pet-boarding SaaS Animalo (animalo.com), re-targeted at hotels. Where Animalo has pets, kennels, owners and stays, Lodgely has guests, rooms, bookers and reservations. Everything a hotel needs — reservations from every channel, room availability, rates, guests, invoicing, deposits/payments, housekeeping, staff, guest communication, analytics and a guest self-service portal — lives in **one place**.

This repo is connected to **GitHub** and deploys to **Vercel**. Work in small, committed increments. After every phase: run typecheck + lint + tests, commit with a conventional-commit message, and stop for review.

---

## 0. Working rules for you (Claude Code)

- **Ask before assuming** on anything with a hard-to-undo consequence (schema shape, auth provider, billing model). Otherwise pick sensible defaults and note them in `DECISIONS.md`.
- **Keep a running `DECISIONS.md`** (what you chose and why) and `TODO.md` (deferred items).
- **Never fake a feature.** If a screen needs data, seed it. If an integration needs keys, stub it behind an interface with a clear "not configured" state in the UI.
- Write tests for pricing, availability and money math. These are the parts that lose a hotel money if wrong.
- Every list view needs: loading skeleton, empty state, error state, mobile layout.
- No `any`. Strict TypeScript. Zod at every boundary (forms, API, webhooks, env).
- Commit after each phase. Do not squash phases together.

---

## 1. Product identity

- **Name:** Lodgely
- **Tagline:** "Run your hotel in one place — every booking, every guest, every channel."
- **Positioning line (landing page hero):** "Reservations, guests, rooms, payments and housekeeping for independent hotels. Built by hoteliers who'd rather greet guests than fight spreadsheets."
- **Demo tenant:** "The Fell View Hotel" — 14 rooms, owner "Robert", based in the Lake District, GBP, VAT 20%.
- **Trial:** 30 days, no card. Show a `9 days left` pill in the top bar like the reference app.
- **Plans:** Core (£69/mo), Pro (£149/mo), Scale (£249/mo). Annual = 2 months free.
- **Currency:** multi-currency per tenant. Default GBP. Support EUR, USD, CAD.
- **Locales:** EN default; scaffold i18n for FR, DE, NL, ES. All customer-facing emails, the contract template and the booking widget must be translatable.

---

## 2. Tech stack (use exactly this unless blocked)

| Layer                       | Choice                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework                   | Next.js 15 (App Router, Server Actions, RSC), TypeScript strict                                                                             |
| Styling                     | Tailwind CSS v4 + shadcn/ui (customised, see §9 Design)                                                                                     |
| DB                          | Postgres on **Neon** (Vercel integration) via **Drizzle ORM** + drizzle-kit migrations                                                      |
| Auth                        | **Auth.js v5** — email magic link + Google OAuth. Separate, passwordless magic-link auth for the guest portal (own table, own cookie).      |
| Payments (guests)           | **Stripe** — Checkout for deposits/balances, Payment Links, webhooks, Stripe Terminal-ready interface                                       |
| Billing (SaaS subscription) | **Stripe Billing** (customer portal for plan changes). Abstract behind `lib/billing/` so Paddle could be swapped in.                        |
| Email                       | **Resend** + React Email templates                                                                                                          |
| SMS                         | **Twilio** behind `lib/sms/` with prepaid-credit ledger                                                                                     |
| File storage                | **Vercel Blob** (guest documents, room photos, ID scans)                                                                                    |
| Jobs / cron                 | Vercel Cron routes (`/api/cron/*`) protected by `CRON_SECRET`; idempotent, logged                                                           |
| Calendar sync               | Google Calendar API (one-way push per staff member)                                                                                         |
| Address autocomplete        | Google Places (client-side, key restricted)                                                                                                 |
| Validation                  | Zod everywhere                                                                                                                              |
| Testing                     | Vitest (unit), Playwright (e2e smoke)                                                                                                       |
| Lint/format                 | ESLint + Prettier, `pnpm`                                                                                                                   |
| Monorepo?                   | No. Single Next.js app. Public marketing site lives at `/(marketing)`, app at `/(app)`, guest portal at `/(portal)`, widget at `/(widget)`. |

Multi-tenancy: **row-level `hotelId` on every tenant table**, enforced in a `db.forHotel(hotelId)` helper so no query can forget it. Multi-location (Scale plan) = a `hotelGroupId` on `hotels` with a group dashboard.

---

## 3. Domain model (Drizzle schema)

Implement these tables. Add `id` (cuid2), `hotelId`, `createdAt`, `updatedAt`, soft-delete `deletedAt` where noted.

### Tenancy & users

- `hotel_groups` — name, ownerUserId
- `hotels` — groupId?, name, slug (unique, used in `/stay/{slug}`), timezone, currency, locale, address (structured), phone, email, logoUrl, brandColor, checkInTime (15:00), checkOutTime (11:00), plan, trialEndsAt, stripeCustomerId, settings JSON (see §6)
- `users` — Auth.js users; `memberships` (userId, hotelId, role: owner | manager | reception | housekeeping | readonly), invite flow
- `staff_calendars` — userId, hotelId, googleRefreshToken (encrypted), lastSyncAt

### Inventory (≈ Animalo "Spots")

- `room_types` — name (Standard Double, Family Suite…), description, baseOccupancy, maxOccupancy, bedConfig, amenities[], photos[], sortOrder, isBookableOnline
- `rooms` — roomTypeId, number/name, floor, status (clean | dirty | inspected | out_of_order), notes
- `rate_plans` — roomTypeId, name (Room Only, B&B, Non-refundable…), baseNightlyPrice, includesBreakfast bool, cancellationPolicyId, minNights, isDefault
- `price_adjustments` — rateplanId?, roomTypeId?, dateFrom, dateTo, type (percentage | fixed | override), value, label, repeatsYearly bool, weekdayMask
- `capacity_overrides` — roomTypeId, dateFrom, dateTo, roomsAvailable, label, repeatsYearly (e.g. block 3 rooms for renovation every January)
- `availability_rules` — closed dates, closed-to-arrival, closed-to-departure, min stay (optionally seasonal, per rate plan)
- `extras` — name, price, pricingMode (per_booking | per_night | per_guest | per_guest_per_night), category (breakfast | parking | spa | pet | late_checkout | transfer | other), taxRateId, isBookableOnline
- `packages` (Pro) — prepaid "5 nights any time", gift cards, monthly-stay passes: name, price, nightsIncluded (or unlimited), validityDays, applicableRoomTypes[]
- `promo_codes` — code, type, value, roomTypes[], minNights, maxNights, validFrom/To, maxUses, usedCount

### Guests (≈ Animalo customers + pets)

- `guests` — the **booker/account holder**: firstName, lastName, email, phone (E.164), address, language, marketingOptIn, notes, tags[], portalStatus (none | invited | active), noShowCount, isVip, isBlacklisted, source (walk_in | website | phone | ota_booking_com | ota_expedia | ota_airbnb | agency | other)
- `guest_companions` (≈ pets) — belongs to a guest: name, dateOfBirth?, relationship (partner | child | colleague | other), dietary/accessibility notes. Reservations list who is staying.
- `guest_documents` — PDF/JPG/DOCX up to 15 MB, type (id_scan | contract | special_agreement | invoice | other), blobUrl, displayName
- `guest_preferences` — pillow type, floor pref, allergies, "always room 7" — shown on every booking detail

### Reservations (≈ Animalo bookings)

- `reservations` — reference (LDG-000123), guestId, status (pending_validation | confirmed | checked_in | checked_out | cancelled | no_show), source (same enum as guests + `channel_manager`), externalRef (OTA booking id), checkIn date, checkOut date, arrivalTime?, nights (computed), adults, children, specialRequests, internalNotes, contractSignedAt, contractUrl, cancellationPolicyId, createdVia (admin | widget | portal | import)
- `reservation_rooms` — reservationId, roomTypeId, roomId? (assigned later), ratePlanId, nightlyPrices JSON [{date, price}], guests staying (companion ids)
- `reservation_extras` — reservationId, extraId, qty, unitPrice, total
- `reservation_status_history` — actor, from, to, at, note (feeds the activity timeline)

### Money

- `tax_rates` — name, percentage, mode (included | added_on_top) — supports UK VAT-inclusive AND North-America add-on-top; itemised on invoices
- `invoices` — reservationId, number (sequential per hotel, gap-free), status (draft | issued | paid | partially_paid | void | refunded), lines JSON, subtotal, taxTotal, discountTotal, total, dueAt, pdfUrl
- `payments` — invoiceId, amount, method (stripe | cash | card_terminal | bank_transfer | package | voucher), stripePaymentIntentId?, kind (deposit | balance | full | refund), receivedAt, recordedByUserId
- `deposit_policy` in hotel settings: percentage or fixed, due at booking; balance due on arrival / X days before
- `cancellation_policies` — name, rules JSON (free until X days, then Y%), noShowCharge percentage

### Operations

- `housekeeping_tasks` — roomId, date, type (departure_clean | stayover | inspection | maintenance), status, assignedToUserId, notes, completedAt — auto-generated nightly from tomorrow's departures/stayovers
- `maintenance_issues` — roomId, title, severity, status, photos
- `guest_messages` — reservationId?, guestId, channel (email | sms | portal), direction, subject, body, sentAt, deliveredAt, templateKey?
- `automations` — see §6.4
- `sms_credits` — ledger (purchase, debit per message, balance view)
- `notifications` — in-app bell: userId, type, payload, readAt
- `audit_log` — every mutation on money and status

### Reporting

- Materialised daily rollup `daily_stats` (hotelId, date, occupancy%, roomsSold, roomNightsAvailable, revenue, ADR, RevPAR, arrivals, departures, newBookings, cancellations) refreshed by cron + on write.

---

## 4. App navigation & screens

Sidebar (exactly this order, mirroring the reference product): **Dashboard · Calendar · Availability · Reservations · Housekeeping · Guests · Data · Settings**. Top bar: global search (⌘K — searches guests, reservations, rooms), trial pill, notification bell, `+` quick-create, avatar menu (Whats-new, Billing, Sign out).

### 4.1 Dashboard (`/dashboard`)

- Greeting "Good morning, Robert." + date + "Here's what's happening at The Fell View Hotel today." + big green **Create reservation** button.
- **Action needed** banner (amber): "N reservations require your validation" → links to filtered list. Also surfaces: rooms out of order, unpaid balances due today, guests arriving with no room assigned.
- **Today at a glance** (auto-refresh every 15 s via polling; 4 cards styled per §9, no coloured left rules):
  - Arrivals today `6 / 8` — 6 of 8 checked in
  - Departures today `1 / 3` — 1 of 3 checked out
  - Guests in house `12`
  - New reservations today `11`
- Second row: **Occupancy tonight** (%, rooms sold / available), **Revenue today**, **ADR**, **RevPAR**.
- **Arrivals list** & **Departures list** (name, room, time, balance status, one-click check-in/out).
- Analytics block: Year / Month / Week / Day segmented control with prev/next chevrons; revenue line, occupancy bars, bookings by source donut.
- First-run: guided tour + setup checklist (add rooms → set rates → connect Stripe → place widget → invite staff).

### 4.2 Calendar (`/calendar`)

- **Tape chart** (rooms on Y, dates on X, reservation bars with guest name, colour by status; drag to move room, resize to change dates with price recalculation and a confirm sheet).
- Views: Month, Week, Day list, Tape. Every event shows check-in **and** check-out ("15:00 → 11:00").
- Mini-timeline strip showing each day's load; compact mode auto-enabled above 15 events.
- Click any bar → side panel with reservation detail and actions.
- Google Calendar one-way sync per staff member (create/update/cancel mirrors event; back-fill on connect).

### 4.3 Availability (`/availability`)

Tabs:

- **Room types & rates** — grid of dates × room types showing rooms available, rate, restrictions. Inline edit, bulk edit over a date range, "repeat every year".
- **Capacity overrides** — list with inline Edit (dates, label, rooms), repeatsYearly toggle.
- **Price adjustments** — list with "Every year" column.
- **Rules** — closed dates, min stay (optionally seasonal, per room type), CTA/CTD.
- **Guest planning** (≈ Animalo "Animal planning") — 14-day movable window, one presence bar per stay; focus a day to list every guest in house with room, booker and departure time. Useful for breakfast counts and housekeeping.

### 4.4 Reservations (`/reservations`)

- List: quick-filter chips **Pending validation · Arriving · In house · Departing · Unpaid · No-show · Cancelled**; default sort most recent; mobile = stacked cards with check-in/out indicators.
- Bulk actions: confirm, send payment invite, export CSV.
- **Create reservation** (admin): guest picker with inline "new guest" (Google Places address), dates, room type → rate plan → optional room, occupancy, extras (with per-night/per-guest maths), promo code, manual discount or fixed price, deposit request, contract generation, send confirmation toggle. Live price recap.
- **Detail page** `/reservations/[id]`:
  - Header: reference, status pill, source badge (OTA logos), Check-in / Check-out / Cancel / Mark no-show buttons.
  - Stay card, rooms card (assign / change room), guests staying, extras, special requests.
  - **Payment panel**: total / deposit due online / balance due on arrival / paid / outstanding; buttons: Send payment invite, Register payment (cash/terminal/bank, accepts pence e.g. 12.50), Refund, Remove discount, Apply promo code, Set fixed price.
  - Invoices (PDF), contract (PDF, downloadable, e-sign timestamp), documents.
  - Messages: send email or SMS from here; template picker; shows credit cost before sending.
  - Activity timeline: every status change, email/SMS sent, payment, reminder, edit.
- **No-show flow**: charge per policy or mark without charge; increments guest `noShowCount`; "HABITUAL" flag at 3+.
- **Validation flow**: widget/portal bookings arrive as `pending_validation`; payment locked until confirmed; "Awaiting confirmation" pill on the guest side.

### 4.5 Housekeeping (`/housekeeping`)

- Today's board grouped by room status; tasks auto-generated from departures/stayovers; assign to staff; mark clean/inspected from a phone; room status flips reservation-side (can't check a guest into a dirty room without override).
- Maintenance issues with photos; room `out_of_order` removes it from availability.

### 4.6 Guests (`/guests`)

- List: search, tags, source, portal status column (Signed in / Invited / No account) + filter, VIP/blacklist, no-show count, lifetime value. "Send portal link" action.
- Profile: details (Google Places address), companions, preferences, **Documents card** (upload PDF/JPG/PNG/DOCX/XLSX ≤15 MB, typed, filterable, inline preview), recent reservations, invoices, messages, packages/gift cards owned, GDPR export & delete.

### 4.7 Data (`/data`)

- **Analytics** `/data/analytics`: year selector + Total; KPI cards — reservations, confirmed, cancelled, no-shows, unique guests, gross revenue (inc. tax), cash collected, ADR, RevPAR, occupancy, room-nights sold, avg length of stay, total discounts, promo bookings, new vs returning; breakdowns by room type, source/channel, rate plan, nationality; top 5 guests by stays and by revenue. Day/Week/Month/Year with prev/next.
- **Exports**: reservations, guests, invoices, payments → CSV/XLSX.
- **Imports**: CSV import of guests and historical reservations with column mapping.

### 4.8 Settings (`/settings`)

- **Information**: hotel details, logo/brand colour, check-in/out times, timezone, currency, locale, opening/closed periods, min stay.
- **Rooms**: room types, rooms, photos, amenities.
- **Rates**: rate plans, cancellation policies, tax rates (included vs added-on-top, itemised).
- **Extras**, **Packages & gift cards**, **Promo codes**.
- **Online payments**: connect Stripe (Connect Standard), deposit %, balance timing, terminal.
- **Booking widget**: embed code, direct link, theme colour, which room types/extras are online-bookable.
- **Guest portal**: enable, custom welcome text, magic-link validity.
- **Emails**: template editor with variables (`@GUESTNAME @HOTELNAME @CHECKIN @CHECKOUT @DATEONLY @REFERENCE @BALANCE @PAYLINK @ROOM`), per-locale overrides, preview/test send. **Automatic emails tab**: two master switches (to team / to guests) + per-event toggles: new reservation, reservation paid, refund, confirmation, pre-arrival, payment invite, receipt, post-stay thank-you/review request. Turning off a team email never removes the in-app notification.
- **SMS**: buy credits, balance, sender ID, which reminders go by SMS.
- **Automations**: reminders J-X days before arrival (email and/or SMS, custom template, logged to timeline); pre-arrival "tell us your ETA"; post-stay review; **guest inactivity** (threshold days → win-back emails at chosen offsets → flag as lapsed).
- **Contracts / registration form**: default template per locale, required fields, e-signature on widget & portal.
- **Team**: members, roles, invite, each member's Google Calendar connection.
- **Channels**: Booking.com / Expedia / Airbnb — Phase 2 via iCal import/export first (two-way iCal per room), with an adapter interface ready for a channel-manager API. Show clear "not connected" state.
- **Billing**: plan, trial, invoices, Stripe customer portal, failed-payment state ("Payment failed" + grace period before limiting).
- **What's new**: changelog page.

---

## 5. Public surfaces

### 5.1 Booking widget (`/stay/[slug]` and embeddable `<iframe>` + `<script>` snippet)

Multi-step, mobile-first, brand-themed:

1. Dates + guests → enforces min stay / closed dates at this step with a clear message; price hidden until dates valid.
2. Room types with photos, rate plans, live nightly breakdown, "only 2 left".
3. Extras (per-night / per-guest maths shown), promo code validated against room type + nights before applying.
4. Guest details (phone country selector with full ISO list, phone required, Google Places address), companions, special requests, contract/T&C acceptance with e-sign.
5. Pay deposit (Stripe Checkout, configurable % or full) or "request to book" if hotel requires validation.
6. Confirmation page + email; reservation lands as `pending_validation` or `confirmed` per settings.
   Tax shown included or added-on-top per hotel setting.

### 5.2 Guest portal (`/stay/[slug]/account`)

Passwordless magic link (7-day validity), rendered in the hotel's language:

- Dashboard "Welcome back, Achille." — **Coming up / In house / Past stays** sections, status chips, List / Calendar toggle.
- Reservation detail: total / paid / due, contract download, **Pay securely** (charges deposit or balance), invoices, "Awaiting confirmation" pill.
- Book again with identity + companions pre-filled.
- Profile editor, companions tab, optional password.
- Packages & gift cards: buy via Stripe, see remaining nights, redeem at check-in (auto-decrement).
- Onboarding callout with progress (add phone, add companions, set password).

### 5.3 Marketing site (`/`)

Clone the reference layout: hero with animated product mock (dashboard card + reservation card with deposit/balance), logo strip, "Why Lodgely?" comparison table (Spreadsheets vs Other software vs Lodgely), pricing (Core/Pro/Scale, monthly/annual toggle, segment tabs: Hotels & B&Bs / Hostels / Serviced apartments / Multi-property), feature trio ("Never miss a booking", "Get paid before the stay", "Let guests book while you sleep"), "One platform. Every feature." screenshot tabs (Dashboard / Calendar / Reservation detail / Settings), Before/After, FAQ, CTA, footer with solution pages (`/for-hotels`, `/for-bnb`, `/for-hostels`, `/for-apartments`, `/for-groups`), blog scaffold, legal pages.

---

## 6. Business logic that must be correct (write tests)

### 6.1 Availability

`getAvailability(hotelId, roomTypeId, from, to)` = physical rooms of that type − out_of_order − capacity overrides − overlapping non-cancelled reservation_rooms, per night. A reservation checking out on day D does not occupy night D. Respect CTA/CTD/min-stay/closed dates. Concurrency: wrap create in a transaction with `SELECT … FOR UPDATE` on the room type's date range (or an advisory lock) — **no double bookings**.

### 6.2 Pricing

Per night: base rate plan price → apply price adjustments (override > fixed > percentage; later-created wins on tie; weekday mask) → sum nights → extras by pricing mode → promo code (scoped, capped) or manual discount or fixed price → tax (included: back-calculate; added: add on top, itemised per rate) → deposit split. Store the nightly breakdown on the reservation so later rate changes don't mutate history. "Remove discount" recomputes from stored breakdown.

### 6.3 Money

Invoice numbers gap-free per hotel. Payments never exceed outstanding. Refunds create negative payments. Package redemption creates a `package` payment. Stripe webhooks idempotent (store event ids). Balance-due email clearly splits "Deposit due online" vs "Balance due on arrival".

### 6.4 Automations (cron, daily 06:00 hotel-local + hourly for reminders)

- Reminders J-X (email/SMS), logged; deleted rules stay deleted.
- Housekeeping task generation.
- Guest inactivity flagging + win-back sequence.
- Package expiry / renewal.
- Daily stats rollup.
- Trial expiry & failed-payment grace handling.

### 6.5 Roles

owner/manager: everything. reception: reservations, guests, payments, no settings. housekeeping: housekeeping board only (mobile). readonly: dashboards/data.

---

## 7. Seed data

`pnpm db:seed` creates The Fell View Hotel with: 5 room types, 14 rooms, 3 rate plans, 2 seasonal price adjustments (one repeating yearly), 6 extras, 2 promo codes, 1 package, 40 guests with companions, ~120 reservations spanning −60 to +90 days across all statuses and sources, invoices/payments consistent with statuses, housekeeping tasks for today, 3 pending validations so the dashboard banner shows, staff users for every role (owner login: `robert@fellview.demo`, magic link printed to console in dev).

---

## 8. Integrations & env

`.env.example` with every key, and `lib/env.ts` Zod-validated:
`DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID/SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_CONNECT_CLIENT_ID, RESEND_API_KEY, EMAIL_FROM, TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM, BLOB_READ_WRITE_TOKEN, GOOGLE_PLACES_KEY, GOOGLE_CALENDAR_CLIENT_ID/SECRET, CRON_SECRET, NEXT_PUBLIC_APP_URL`.
Each integration has a `isConfigured()` and the UI shows a friendly "Connect X in Settings" state instead of crashing.

> Implementation note: env lives in `lib/env/{schema,server,client}.ts`, and the Places key is `NEXT_PUBLIC_GOOGLE_PLACES_KEY`. See DECISIONS.md 1.3–1.5.

---

## 9. Design system

> **Revised 2026-09-24 by the owner** (`/impeccable make it not look ai`). The original §9 (warm cream `#FAF8F3`, Fraunces/Playfair serif headings, Inter, rounded-2xl cards, tracked-caps micro-labels, KPI cards with a 4px coloured left rule, 300px sidebar with a "NAVIGATE" label) read as AI-generated and is **retired**. The recorded system lives in `DESIGN.md`; this section is the brief it answers to.

Conventional hospitality SaaS at the craft level of the **Airbnb host app**: white surfaces, near-black ink (`#222`), soft grey hierarchy (`#6A6A6A` secondary, `#F7F7F7` fills, `#EBEBEB` hairlines), one green accent (`#0B7A55`) reserved for primary actions and selection, **Figtree** throughout with bold sentence-case headings and no tracked caps. 8px controls, 12px cards and menus, soft shadows only on floating layers (menus, dialogs, the search pill). Must not read as generic startup SaaS; must not drift back to cream-and-serif. Dark mode not required v1.

Navigation: a slim white sidebar on desktop (order per §4); on phones a bottom tab bar (Dashboard, Calendar, Reservations, Guests, Menu) with the rest under Menu, the host-app pattern. Everything responsive; reservations list and housekeeping board must be excellent on a phone. Status and "action needed" states use soft tinted banners (amber for warnings), never a coloured left rule.

Use `shadcn/ui`-style primitives re-themed in `globals.css`; do not ship the default shadcn grey look.

---

## 10. Build order (one commit + review per phase)

1. **Scaffold** — Next.js, Tailwind, shadcn, Drizzle+Neon, Auth.js, env validation, layouts for the 4 route groups, design tokens, sidebar/topbar shell, Vercel config, GitHub Actions CI (typecheck, lint, test, drizzle check). Deploy a "hello" to Vercel.
2. **Schema + seed** — full Drizzle schema from §3, migrations, seed script, `db.forHotel` guard.
3. **Inventory & pricing engine** — room types, rooms, rate plans, adjustments, overrides, rules; `getAvailability` + `quote()` with Vitest tests.
4. **Reservations core** — create/edit/cancel/check-in/out/no-show, list + filters, detail page, status history, notifications, audit.
5. **Dashboard + Calendar (tape chart)**.
6. **Guests** — profiles, companions, documents, preferences, import/export.
7. **Money** — tax rates, invoices (PDF via `@react-pdf/renderer`), payments, Stripe Connect, deposits, payment invites, refunds, promo/discount removal, packages.
8. **Booking widget** + contract e-sign.
9. **Guest portal** (magic link).
10. **Communication** — email templates + automatic-emails toggles, SMS credits, reminders, automations, activity logging.
11. **Housekeeping & maintenance**.
12. **Analytics + daily rollups + exports**.
13. **Settings completeness, team & roles, Google Calendar sync, Places autocomplete, i18n scaffold**.
14. **SaaS billing** (Stripe Billing, trial, grace period), onboarding tour + checklist, what's-new page.
15. **Marketing site** + solution pages + SEO (metadata, OG image, sitemap).
16. **Channels v1** — iCal in/out per room, adapter interface for OTA APIs; multi-property group dashboard (Scale).
17. **Hardening** — rate limiting on outbound messages & sign-up, abusive-domain blocklist, Playwright smoke (book via widget → validate → pay deposit → check in → invoice), a11y pass, Lighthouse ≥ 90 on marketing pages.
