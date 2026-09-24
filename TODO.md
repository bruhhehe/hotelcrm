# TODO

Deferred items, grouped by the phase expected to pick them up. Remove an item when it lands.

## Needs a human

- [ ] Create the Vercel project from this repo and set `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (or add the Neon integration, which sets both), `AUTH_SECRET` and `NEXT_PUBLIC_APP_URL`, then deploy. The Neon database is already migrated and seeded. See README → Deploying.
- [ ] Add a Google OAuth client (staff sign-in) and a Resend domain before inviting real users.
- [ ] Add a branch protection rule on `main` that requires the `CI` workflow.
- [ ] Decide whether OTA channel import (Booking.com, Airbnb, Expedia; spec Phase 16) moves earlier. It is the core positioning promise in PRODUCT.md.
- [ ] Confirm the accessibility standard (WCAG 2.2 AA is the working bar, not yet confirmed).

## Design system

- [ ] Type scale as tokens: sizes are applied consistently but as literals (`text-[15px]`, `text-[13px]`, `text-[22px]`, 28–44px headings). Promote them to `--text-*` tokens so DESIGN.md's hierarchy is enforced by the theme.
- [ ] Plain black (`hover:bg-black`, `hover:text-black`) on the dark and link buttons' hover isn't a token; add an `ink-strong` token or drop the shift.
- [ ] Magic-link email hard-codes palette hex (email clients can't read CSS variables). Source it from a shared constants module when templates move to React Email (Phase 10).

## Needs a human (security)

- [ ] If you set `AUTH_LOG_SIGN_IN_LINKS=true` on Vercel to get in, remove it once Resend (or Google sign-in) is configured.

- [ ] **Rotate the Neon database password** (Neon console → Roles → reset). The connection string was pasted into a chat, so treat it as exposed. Then update Vercel's env vars and your local `.env.neon`.

## Phase 4 / 6

- [ ] Reservation create/edit must call `reserveInventory()` inside its transaction before inserting `reservation_rooms` (spec §6.1), and store `priceStay()`'s nightly breakdown.
- [ ] Assigning or moving a booking to a room of another type must lock both room types (`lockRoomTypes`), since the booking then uses the other type's inventory (DECISIONS 3.3).
- [ ] Availability → Guest planning tab (14-day presence bars, guests in house per day). It reads reservations, so it lands with the reservations list or the calendar (Phase 5).
- [ ] Settings → Rooms: room photos (Vercel Blob) and drag-to-reorder room types and rooms (`sortOrder` exists).

- [ ] ⌘K palette: add guest / reservation / room results (it only navigates between sections today).
- [ ] Enable the "+" quick-create items (Reservation, Guest).
- [ ] Notifications bell: read from the `notifications` table.

## Phase 7

- [ ] Settings → Rates: edit cancellation policies and tax rates (rate plans can pick an existing policy today; the seed creates them).

## Phase 10

- [ ] Move the magic-link email to React Email with the other templates, translated.
- [ ] Register cron routes in `vercel.json` (`crons` is empty; `lib/cron/auth.ts` is ready).

## Phase 13

- [ ] Hide sidebar items a role can't open (pages already refuse them).
- [ ] Settings → Information: hotel-wide minimum stay (`settings.defaultMinNights`, already used by the engine), deposit policy and check-in times.
- [ ] i18n scaffold (next-intl or similar) for FR, DE, NL, ES. Keep copy in components easy to extract until then.

## Phase 17

- [ ] Playwright smoke suite in CI. A manual browser run of login → dashboard → ⌘K → sign-out passed in Phase 1.
- [ ] Rate-limit magic-link requests per email and per IP.
- [ ] Content-Security-Policy (needs Stripe, Google Places and Blob origins decided first).
