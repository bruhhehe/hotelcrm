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
pnpm db:seed        # The Fell View Hotel demo; prints a sign-in link for robert@fellview.demo
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
| `pnpm db:seed`     | Recreate the demo hotel (only touches `fell-view` and `@fellview.demo` users)     |
| `pnpm db:studio`   | Drizzle Studio                                                                    |

### Database tests

Tests named `*.db.test.ts` run against `TEST_DATABASE_URL` only (a migrated Postgres you don't
mind writing to), never `DATABASE_URL`. They are skipped when it isn't set.

### Reaching Neon without port 5432

`pnpm db:migrate --https` and `pnpm db:seed --https` use Neon's HTTPS endpoint instead of a
Postgres connection. Behind an HTTP proxy, also set `NODE_USE_ENV_PROXY=1`.

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
2. **Storage → your Neon database → Connect Project**, with Production and Preview ticked. This
   sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED` (`POSTGRES_URL` also works). Functions run in
   `iad1`, next to a Neon database in `us-east-1`; change `vercel.json` if your database lives
   elsewhere.
3. Set `AUTH_SECRET` (`npx auth secret`) and `NEXT_PUBLIC_APP_URL`.
4. Set how sign-in links are delivered: `RESEND_API_KEY` + `EMAIL_FROM`, or Google sign-in. To get
   in before email is ready, set `AUTH_LOG_SIGN_IN_LINKS=true` and copy the link from the
   deployment's logs (Vercel → Logs, search "Magic link for"). Remove it once email works.
5. **Redeploy.** Variables only reach deployments made after they're added. `vercel-build`
   applies migrations and then builds; `/api/health` should return `{ ok: true }`, and `/login`
   lists anything still missing.

For local development against the same database: `vercel env pull .env.development.local`.
