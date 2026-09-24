# TODO

Deferred items, grouped by the phase expected to pick them up. Remove an item when it lands.

## Needs a human

- [ ] Create the Vercel project from this repo, add the **Neon** integration (Storage → Neon, region `aws-eu-west-2`), set `AUTH_SECRET`, then deploy. See README → Deploying.
- [ ] Add a Google OAuth client (staff sign-in) and a Resend domain before inviting real users.
- [ ] Add a branch protection rule on `main` that requires the `CI` workflow.
- [ ] Decide whether OTA channel import (Booking.com, Airbnb, Expedia; spec Phase 16) moves earlier. It is the core positioning promise in PRODUCT.md.
- [ ] Confirm the accessibility standard (WCAG 2.2 AA is the working bar, not yet confirmed).

## Design system

- [ ] Type scale as tokens: sizes are applied consistently but as literals (`text-[15px]`, `text-[13px]`, `text-[22px]`, 28–44px headings). Promote them to `--text-*` tokens so DESIGN.md's hierarchy is enforced by the theme.
- [ ] Plain black (`hover:bg-black`, `hover:text-black`) on the dark and link buttons' hover isn't a token; add an `ink-strong` token or drop the shift.
- [ ] Magic-link email hard-codes palette hex (email clients can't read CSS variables). Source it from a shared constants module when templates move to React Email (Phase 10).

## Phase 2 — Schema + seed

- [ ] Full domain schema (§3) and `db.forHotel(hotelId)` guard.
- [ ] Wire the hotel into the shell: pass `trialEndsAt` to `<Topbar>` (the pill is built, `lib/billing/trial.ts`) and read the timezone from the hotel instead of `DEFAULT_TIMEZONE` on the dashboard.
- [ ] Replace the dashboard greeting's "your hotel" with the hotel name.
- [ ] Seed prints Robert's magic link (the dev console transport already exists).

## Phase 4 / 6

- [ ] ⌘K palette: add guest / reservation / room results (it only navigates between sections today).
- [ ] Enable the "+" quick-create items (Reservation, Guest).
- [ ] Notifications bell: read from the `notifications` table.

## Phase 10

- [ ] Move the magic-link email to React Email with the other templates, translated.
- [ ] Register cron routes in `vercel.json` (`crons` is empty; `lib/cron/auth.ts` is ready).

## Phase 13

- [ ] i18n scaffold (next-intl or similar) for FR, DE, NL, ES. Keep copy in components easy to extract until then.

## Phase 17

- [ ] Playwright smoke suite in CI. A manual browser run of login → dashboard → ⌘K → sign-out passed in Phase 1.
- [ ] Rate-limit magic-link requests per email and per IP.
- [ ] Content-Security-Policy (needs Stripe, Google Places and Blob origins decided first).
