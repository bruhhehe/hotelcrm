---
version: 1
slug: "app-app-dashboard-page-tsx"
primary_target: "app/(app)/dashboard/page.tsx"
related_targets: ["app/(app)/layout.tsx", "app/(auth)/login/page.tsx", "app/(marketing)/page.tsx"]
---

# Staff app shell and dashboard

Scope: the staff app shell (sidebar, top bar, mobile tab bar, ⌘K, menus), dashboard, section
placeholders, What's new, sign-in pages, marketing hero placeholder, widget/portal placeholders, 404.
Visitor mode: Operate (marketing hero: Persuade, same world).

Audience and job: see PRODUCT.md (owner-operator, often on a phone). Constraint from the user:
redesign away from the AI-default look (cream ground, serif display, tracked caps labels); must not
read as generic startup SaaS. Benchmark named by the user: the Airbnb host app.

Memorable moment: on a phone, Lodgely feels like a native hosting app (bottom tabs, big bold
"Today"), not a squeezed desktop admin.

Unresolved: brand accent may be revisited once real photography or a logo exists.

## Direction contract

THESIS: Conventional hospitality SaaS at Airbnb-host-app craft: white, bold, friendly, phone-native. Refuses the cream-and-serif AI default and the grey enterprise admin.

OWN-WORLD: Pure white surfaces, #222 ink, #717171 secondary, #DDDDDD hairlines. One accent, Lodgely green, for primary actions and selection only. Figtree throughout, heavy weights for headings, sentence case, no tracked caps. 8px controls, 12px cards, soft floating shadows, pill tabs.

STORY: The owner opens Lodgely, sees a bold "Today" greeting and knows where everything lives; every section is one tap away on any device.

FIRST VIEWPORT: Desktop: slim white sidebar left, search top, huge bold greeting with date beneath, then a quiet bordered panel for today's state. Phone: same greeting, bottom tab bar (Today, Calendar, Reservations, Guests, Menu).

FORM: Canon (standing exit), user-selected over the rolled key-rack direction; not on the grounded list; seed d2e50045.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
