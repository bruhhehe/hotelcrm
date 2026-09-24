# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: the owner-operator** of an independent small hotel, B&B or guesthouse in the UK or
Europe (1–60 rooms), like the demo's Robert at The Fell View Hotel. They personally take bookings
from several channels, run the front desk, set prices, chase payments and do the admin, usually
between other jobs and often from a phone. When a decision trades one user against another, make
this person's day easier first.

Secondary users, from the spec's roles (§6.5):

- **Managers:** everything the owner can do.
- **Reception staff:** reservations, guests and payments; no settings.
- **Housekeeping staff:** the housekeeping board only, on a phone.
- **Read-only viewers:** dashboards and reports.
- **Guests,** on the public surfaces: the booking widget embedded on the hotel's own website, and the
  guest portal (passwordless magic link). Both are shown in the hotel's language.

## Product Purpose

Run a hotel in one place: every booking, every guest, every channel. Lodgely covers reservations
from every channel, room availability, rates, guests, invoicing, deposits and payments,
housekeeping, staff, guest email and SMS, analytics and a guest self-service portal. It replaces the
spreadsheets and separate OTA extranets an independent hotel juggles today.

Success means the owner:

- sees every guest, whatever channel they booked through, in one list and one calendar;
- never double-books a room;
- collects deposits before the stay and balances on arrival without chasing;
- knows today's arrivals, departures and occupancy at a glance.

## Positioning

- **Every booking in one place.** Guests from Booking.com, Airbnb, Expedia, the phone, walk-ins and
  the hotel's own booking widget all land in the same reservations list, calendar and guest record,
  so managing many guests from many sources stops being confusing. Importing OTA bookings is the
  core promise, not an add-on.
- **UK and European independents first.** VAT-inclusive pricing by default (UK VAT 20%), with
  add-on-top tax supported for North America. GBP is the default currency, with EUR, USD and CAD
  supported. English first, with French, German, Dutch and Spanish.
- **Made by a hotel owner.** The founder runs a small hotel, and the product comes from that
  experience.

## Operating Context

- **Front desk:** checking guests in and out, taking phone and walk-in bookings, assigning rooms,
  recording cash, card-terminal and bank-transfer payments to the penny, marking no-shows.
- **The owner on the move:** the reservations list and the housekeeping board must be fully usable
  on a phone (spec §9).
- **Housekeeping:** staff on phones change room status (clean, dirty, inspected, out of order).
  Tasks are generated each night from the next day's departures and stayovers, and a guest can't be
  checked into a dirty room without an override.
- **Channels:** OTA bookings arrive through iCal first, then a channel-manager adapter. The booking
  widget is embedded on the hotel's own site as an iframe or script.
- **Money:**
  - Deposits are taken online through the hotel's own Stripe account (Connect Standard); the balance
    is due on arrival or X days before.
  - Invoice numbers run without gaps, per hotel.
  - Refunds are recorded as negative payments.
- **Guest communication:** email templates in each language, SMS on prepaid credits, reminders X
  days before arrival, and post-stay review and win-back automations.
- **Rhythm:** the dashboard refreshes every 15 seconds; scheduled jobs run at 06:00 in the hotel's
  local time. Every date follows the hotel's timezone.

## Capabilities and Constraints

**Confirmed by the spec (`CLAUDE.md`):**

- Modules: Dashboard, Calendar (tape chart), Availability, Reservations, Housekeeping, Guests, Data,
  Settings, plus the booking widget, the guest portal and the marketing site.
- Plans: Core £69/mo, Pro £149/mo, Scale £249/mo; annual billing gives 2 months free. 30-day trial,
  no card. Multi-property hotel groups are on Scale.
- Multi-tenant: every hotel's data is isolated.
- Terminology to keep consistent:
  - **reservation** (staff-facing) / **booking** (guest-facing);
  - **guest** (the person who booked) and **companions** (the people staying with them);
  - room type, rate plan, extras, packages & gift cards, promo codes;
  - **pending validation**, shown to guests as "Awaiting confirmation";
  - **no-show**, with a "HABITUAL" flag at 3 or more;
  - reservation references look like `LDG-000123`.
- Never fake a feature: an integration without keys shows a "Connect X" state, and demo data is
  seeded rather than hard-coded.

**Open decisions:**

- **When channel import ships.** Positioning centres on bringing OTA bookings into one place, but the
  spec's build order puts channels at Phase 16 (iCal first). Undecided whether to move it earlier.
- **Lodgely's fee on guest payments.** Assumed to be none in v1 (DECISIONS.md); not confirmed.
- **Accessibility standard.** See below.

## Brand Commitments

- **Name:** Lodgely.
- **Tagline:** "Run your hotel in one place — every booking, every guest, every channel."
- **Hero positioning line:** "Reservations, guests, rooms, payments and housekeeping for independent
  hotels. Built by hoteliers who'd rather greet guests than fight spreadsheets." The "built by
  hoteliers" claim rests on the founder being a small hotel owner.
- **Spelling:** British English (the spec's own copy uses "colour" and "cancelled").
- **Visual direction (standing preference, set by the owner on 2026-09-24):** conventional
  hospitality SaaS at the craft level of the Airbnb host app. It must not look AI-generated (the
  earlier cream background, serif display and tracked-caps look was retired for that reason) and
  must not read as generic startup SaaS. The details belong in DESIGN.md, not here.
- **Structural reference:** Lodgely deliberately follows the structure of Animalo (animalo.com), a
  pet-boarding SaaS, re-targeted at hotels.
- **Voice:** not formally defined. The existing copy is plain, practical and warm.

## Evidence on Hand

- **True:** the founder is a small hotel owner.
- **Absent, and must not be fabricated:**
  - customers, testimonials or quotes;
  - customer logos (the spec's marketing "logo strip" has nothing real to show yet);
  - usage numbers, ratings, press or awards.
- **Demo tenant:** The Fell View Hotel (14 rooms, owner Robert, Lake District, GBP, VAT 20%) is
  fictional. It may appear in product demos and screenshots as an example, never as a customer.
- **Assets:** the Lodgely wordmark and house mark (`components/app-shell/logo.tsx`) were drawn during
  the Phase 1 scaffold; they are not a supplied brand asset. There is no photography.

## Product Principles

1. **One place for every booking.** Whatever channel a guest came through, they appear in the same
   list, calendar and guest record. The owner should never need to cross-check another system.
2. **Built for the owner doing five jobs at once.** Daily tasks (today's arrivals, a check-in, taking
   a payment, marking a room clean) finish quickly, including on a phone.
3. **Money and availability are never wrong.** No double bookings, invoice numbers without gaps,
   payments that never exceed what's owed. Correctness comes before cleverness.
4. **Honest by default.** No faked features, data, customers or claims. Anything not connected says
   so plainly.
5. **UK and European independents first.** VAT-inclusive prices, local currencies and languages, and
   the hotel's own timezone.

## Accessibility & Inclusion

- **Languages (spec):** every guest-facing surface (booking widget, guest portal, emails, the
  contract template) must be translatable. English first, then French, German, Dutch and Spanish.
- **Phones:** staff and housekeepers work on phones, so touch-first layouts and targets matter.
- **Standard (inferred, not confirmed):** no required level has been set. WCAG 2.2 AA is the working
  bar, applied in the 2026-09-24 design audit.
