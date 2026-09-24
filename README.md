# Lodgely

> Run your hotel in one place — every booking, every guest, every channel.

All-in-one hotel management SaaS for independent hotels, B&Bs, guesthouses and small groups
(1–60 rooms). The full product spec lives in [`CLAUDE.md`](./CLAUDE.md), architectural choices
in [`DECISIONS.md`](./DECISIONS.md), and deferred work in [`TODO.md`](./TODO.md).

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind v4 + shadcn-style UI · Postgres (Neon)
via Drizzle · Auth.js v5 · Stripe · Resend · Twilio · Vercel Blob · Vitest.

## Getting started

```bash
pnpm install
cp .env.example .env.local          # fill in DATABASE_URL and AUTH_SECRET at minimum
pnpm db:migrate
pnpm dev
```

Open http://localhost:3000/login and enter any email. If `RESEND_API_KEY` isn't set, the
**magic link is printed in the terminal** running `pnpm dev`.

A local Postgres works fine (`postgresql://postgres@localhost:5432/lodgely`), and so does a
Neon branch.

## Scripts

| Command            | What it does                                                                      |
| ------------------ | --------------------------------------------------------------------------------- |
| `pnpm dev`         | Dev server                                                                        |
| `pnpm check`       | typecheck + lint + format check + tests + drizzle check (run before every commit) |
| `pnpm test`        | Vitest unit tests                                                                 |
| `pnpm db:generate` | Generate a migration from schema changes (`lib/db/schema`)                        |
| `pnpm db:migrate`  | Apply migrations (skips if `DATABASE_URL` is unset)                               |
| `pnpm db:studio`   | Drizzle Studio                                                                    |

## Route groups

| Group         | Paths                                                                                                         | Who                                |
| ------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `(marketing)` | `/` and solution pages                                                                                        | Public                             |
| `(auth)`      | `/login`                                                                                                      | Staff sign-in                      |
| `(app)`       | `/dashboard`, `/calendar`, `/availability`, `/reservations`, `/housekeeping`, `/guests`, `/data`, `/settings` | Signed-in staff                    |
| `(widget)`    | `/stay/[slug]`                                                                                                | Public booking widget (embeddable) |
| `(portal)`    | `/stay/[slug]/account`                                                                                        | Guests (separate magic-link auth)  |

## Deploying (Vercel)

1. Import the GitHub repo in Vercel. Framework, install and build commands come from `vercel.json`.
2. **Storage → Neon**: add the integration. It sets `DATABASE_URL` for production and for each
   preview branch.
3. Set `AUTH_SECRET` (`npx auth secret`) and `NEXT_PUBLIC_APP_URL`.
4. Deploy. `vercel-build` applies migrations and then builds. `/api/health` should return `{ ok: true }`.

Everything else (Google, Resend, Stripe, Twilio, Blob, Places, Calendar, Cron) is optional.
Until a key is set, its feature shows a "Connect X" state instead of failing.
