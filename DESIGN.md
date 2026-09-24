---
name: Lodgely
description: Run your hotel in one place — every booking, every guest, every channel.
colors:
  lodgely-green: "#0b7a55"
  lodgely-green-deep: "#086446"
  lodgely-green-wash: "#e7f4ee"
  on-primary: "#ffffff"
  paper: "#ffffff"
  ink: "#222222"
  ink-secondary: "#6a6a6a"
  soft-fill: "#f7f7f7"
  hairline: "#ebebeb"
  control-edge: "#8e8e8e"
  focus-ink: "#222222"
  alert-red: "#c13515"
  alert-red-wash: "#fff0ed"
  notice-cream: "#fef6e0"
  notice-brown: "#5c4200"
  notice-border: "#f3d98b"
  overlay: "rgb(0 0 0 / 0.45)"
typography:
  display:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 4.6vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  hero:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "34px (44px from 640px)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px (32px from 640px)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px to 22px"
    fontWeight: 600
    lineHeight: 1.4
  title-sm:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-lg:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px to 18px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
  label-sm:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.25
  tab-label:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  control-x: "20px"
  menu-x: "16px"
  card: "24px"
  panel: "32px"
  page-x-phone: "16px"
  page-x-tablet: "24px"
  page-x-desktop: "40px"
  sidebar: "264px"
  topbar: "72px"
  tabbar: "64px"
components:
  button-primary:
    backgroundColor: "{colors.lodgely-green}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.lodgely-green-deep}"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
    height: "44px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.soft-fill}"
  button-ghost-hover:
    backgroundColor: "{colors.soft-fill}"
  button-destructive:
    backgroundColor: "{colors.alert-red}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
  button-icon:
    rounded: "{rounded.full}"
    size: "40px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
    height: "48px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
  empty-state:
    backgroundColor: "{colors.soft-fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "40px 32px"
  badge-default:
    backgroundColor: "{colors.lodgely-green-wash}"
    textColor: "{colors.lodgely-green}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-neutral:
    backgroundColor: "{colors.soft-fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
  badge-warning:
    backgroundColor: "{colors.notice-cream}"
    textColor: "{colors.notice-brown}"
    rounded: "{rounded.full}"
  banner-warning:
    backgroundColor: "{colors.notice-cream}"
    textColor: "{colors.notice-brown}"
    rounded: "{rounded.xl}"
    padding: "14px 16px"
  banner-destructive:
    backgroundColor: "{colors.alert-red-wash}"
    textColor: "{colors.alert-red}"
    rounded: "{rounded.xl}"
    padding: "14px 16px"
  search-pill:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "44px"
    width: "448px"
  nav-item-active:
    backgroundColor: "{colors.soft-fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "44px"
  nav-item:
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.lg}"
    height: "44px"
  tab-bar-item-active:
    textColor: "{colors.lodgely-green}"
    typography: "{typography.tab-label}"
  tab-bar-item:
    textColor: "{colors.ink-secondary}"
    typography: "{typography.tab-label}"
  menu:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.xl}"
    padding: "8px 0"
  menu-item:
    typography: "{typography.body}"
    padding: "10px 16px"
    height: "44px"
  dialog:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.xl}"
    padding: "24px"
    width: "512px"
  sheet-bottom:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.2xl}"
---

# Design System: Lodgely

## Overview

**Creative North Star: "The Host's Front Desk"**

Lodgely is conventional hospitality software made at the craft level of the Airbnb host app: white, bold, friendly and phone-native. An owner-operator opens it between guests, often on a phone, and should know where everything lives at a glance. The page is paper white with near-black ink; hierarchy comes from weight and size in one typeface, from a soft grey fill, and from hairlines, not from colour. One green accent marks the thing you can do and the place you are.

This world replaced an earlier cream-ground, serif-display, tracked-caps look that the owner retired as reading "AI-made". It equally refuses the grey enterprise admin: headings are big and bold in sentence case, controls are large and touch-sized, and floating things (search, menus, dialogs, sheets) lift with a soft shadow while resting surfaces stay flat. On phones the app behaves like a native hosting app: a bottom tab bar, a Menu tab that raises a bottom sheet, and the same bold greeting as desktop.

Density is relaxed. Pages breathe (40px top padding on desktop, 32 to 40px under page headers), controls are 44 to 48px tall, and running text is 15px with generous line height.

**Key Characteristics:**

- White paper, #222 ink, grey secondary text, #EBEBEB hairlines.
- One accent, Lodgely green, for primary actions, current location on phones, and selection.
- Figtree for everything; heavy weights and negative tracking for big headings; sentence case throughout.
- 8px controls, 12px cards and menus, 16px sheets, full pills for search, account, trial and badges.
- Flat resting surfaces with hairlines; soft two-layer shadows only on floating layers.
- Phone-first navigation: bottom tabs plus a Menu bottom sheet; 44px touch targets under coarse pointers.

## Colors

A near-monochrome palette of paper, ink and soft grey, with a single deep green carrying action and state.

### Primary

- **Lodgely Green** (`lodgely-green`): the primary button fill, the logo, the active tab on the phone tab bar, the default badge text, success banners, text selection wash partner, form `accent-color` and caret. 5.3:1 with white.
- **Lodgely Green Deep** (`lodgely-green-deep`): hover state of the primary button only.
- **Green Wash** (`lodgely-green-wash`): tinted backgrounds for the default badge, success banner and `::selection`.

### Neutral

- **Paper** (`paper`): page, sidebar, cards, menus, dialogs, sheets, inputs. The whole app sits on white.
- **Ink** (`ink`): all primary text, the dark button, the avatar disc, and the focus ring (`focus-ink`, 15:1).
- **Secondary Grey** (`ink-secondary`): descriptions, dates under headings, inactive nav and tab labels, placeholders. 5.4:1 on white, 5.05:1 on Soft Fill.
- **Soft Fill** (`soft-fill`): hover rows, ghost-button hover, active sidebar item, empty-state panels, skeletons, the ⌘K key chip, marketing footer.
- **Hairline** (`hairline`): card edges, dividers, top bar and tab bar borders, pill outlines. Decorative, no contrast requirement.
- **Control Edge** (`control-edge`): form-control borders only, and the scrollbar thumb. ≥3:1 on white and on Soft Fill.
- **Overlay** (`overlay`): scrim behind dialogs and sheets.

### Status

- **Alert Red** (`alert-red`) on **Alert Red Wash** (`alert-red-wash`): destructive buttons, error banners (`role="alert"`), invalid input borders, destructive badges.
- **Notice Brown** (`notice-brown`) on **Notice Cream** (`notice-cream`), edged with **Notice Border** (`notice-border`): warning banners ("action needed", "not connected"), warning badges, the trial pill at 3 days or fewer.

### Named Rules

**The One Green Rule.** Green means "do this" or "you are here" (on phones). Headings, icons, borders and decoration stay ink or grey. On desktop the active sidebar item is a Soft Fill with semibold ink, not green.

**The Two Greys Rule.** Hairline (`#EBEBEB`) is for surfaces that only need separating; Control Edge (`#8E8E8E`) is for anything a user types into. Never swap them.

## Typography

**Display Font:** Figtree (loaded via `next/font` as `--font-figtree`, with ui-sans-serif, system-ui fallback)
**Body Font:** Figtree
**Label Font:** Figtree

**Character:** One friendly geometric-humanist face in the spirit of Airbnb's Cereal. Personality comes from weight contrast: extrabold, tightly tracked headlines over regular 15px body.

### Hierarchy

- **Display** (800, clamp 36 to 56px, 1.05, -0.035em): marketing hero headline only.
- **Hero** (800, 34px / 44px from 640px, 1.1, -0.03em): the dashboard greeting ("Good evening, Robert."), the app's opening moment. Reserved: `PageHeader size="hero"`.
- **Headline** (700, 28px / 32px, tight): every other page title (`PageHeader` default, 404).
- **Title** (600, 20 to 22px): empty-state headings, auth card headings. **Title Small** (600, 18px): card and dialog titles.
- **Body** (400, 15px, 1.5; 1.625 for multi-line explanatory copy): running UI text, descriptions, menu items, banners. **Body Large** (16 to 18px): page-header descriptions and marketing lede; inputs use 16px so phones don't zoom.
- **Label** (600, 15px): buttons, form labels. **Label Small** (600, 13px): badges, avatar initials. **Tab Label** (600, 11px): phone tab bar captions under 24px icons.

All `h1`–`h3` are bold with tight tracking and `text-wrap: balance`; paragraphs use `text-wrap: pretty`.

### Named Rules

**The Sentence Case Rule.** Every heading, label, button and section label is sentence case at normal tracking. Hierarchy is carried by weight and size, never by uppercase letter-spacing.

**The Weight Ladder Rule.** 800 for hero and display, 700 for page titles, 600 for titles, labels and active states, 500 for inactive nav, 400 for body.

## Layout

- **Desktop (≥1024px):** fixed white sidebar (264px) with the logo in a 72px header row, nav list, and a "What's new" footer link; a sticky 72px top bar with a centred-then-left search pill, trial pill, notification and create icon buttons, and the account pill. Content sits in a centred column (max 72rem) with 40px side padding and 40px top padding.
- **Tablet and phone (<1024px):** no sidebar; a 64px top bar shows the logo mark only. A fixed 64px bottom tab bar (Dashboard, Calendar, Reservations, Guests, Menu) respects `safe-area-inset-bottom`; main content pads its bottom by the tab bar height plus 40px. Page side padding is 16px on phones, 24px from 640px.
- **Page rhythm:** page header, then 32px (40px from 640px) to the first block. Header actions align to the baseline on the right from 640px and stack below on phones.
- **Guest-facing pages** (widget, portal) sit in a single narrow column (max 42rem) inside a frame whose footer carries a quiet "Powered by Lodgely" credit.
- **Auth pages:** a bordered header with the logo, then a 520px card; on phones the card goes full-bleed and borderless.

**The Thumb Rule.** Every interactive target is at least 44px under a coarse pointer (buttons, icon buttons, menu items, nav rows, trial pill, logo link). Small sizes exist only for fine pointers.

## Elevation & Depth

Hybrid: flat at rest, softly lifted when floating. Resting cards, panels and bars carry a 1px hairline and no shadow. Two soft, two-layer shadows exist, both neutral black at low alpha.

### Shadow Vocabulary

- **Float** (`box-shadow: 0 6px 20px rgb(0 0 0 / 0.12), 0 1px 3px rgb(0 0 0 / 0.06)`): dropdown menus, dialogs, the command palette, side and bottom sheets, and the search pill on hover.
- **Pill** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.08), 0 4px 12px rgb(0 0 0 / 0.05)`): the search pill at rest, and the account pill and trial pill on hover or when open.

### Named Rules

**The Hairline At Rest Rule.** A card that sits on the page has a border, not a shadow. Shadow is earned by floating above the page or by being the pill you are about to press.

## Shapes

Gently rounded, never sharp and never blobby. The base radius is 8px for controls (buttons, inputs, nav rows, skeletons), 12px for containers (cards, empty-state panels, banners, menus, dialogs), 16px for the top corners of the phone bottom sheet. Full pills for things that are one tappable object: the search field, the account pill, the trial pill, icon buttons, badges, the avatar and the ⌘K chip. Borders are 1px throughout; no borders thicker than 1px and no coloured edge accents. Icons are Lucide line icons at 18 to 24px, stroke 1.75 at rest and 2.25 when active.

## Components

### Buttons

Confident, touch-sized, no gradients.

- **Shape:** gently rounded (8px); icon buttons are circles (40px, 44px under coarse pointers).
- **Primary:** Lodgely Green fill, white 15px semibold label, 44px min height, 20px horizontal padding; large size is 48px and 16px text. One per view.
- **Hover / Focus / Active:** hover deepens to Lodgely Green Deep (150ms colour transition); press scales to 0.98; focus is the global 2px solid ink outline at 2px offset; disabled drops to 40% opacity.
- **Dark:** ink fill, white label; a strong secondary only, never a second primary.
- **Outline:** 1px ink border on white, Soft Fill on hover; the partner to a primary (e.g. "Sign in" beside "Start your 30-day free trial").
- **Ghost:** transparent, Soft Fill on hover; top-bar icons and low-stakes header actions.
- **Destructive:** Alert Red fill, white label.
- **Link:** ink, underlined at 4px offset.

### Chips and Badges

- **Style:** full pill, 13px semibold, 2px by 10px padding. Default is green text on Green Wash; neutral is ink on Soft Fill; warning is Notice Brown on Notice Cream; destructive is Alert Red on Alert Red Wash; outline is a hairline.
- **Trial pill:** a hairline pill link to Billing ("9 days left"), switching to the warning palette at 3 days or fewer; lifts with the Pill shadow on hover.

### Cards / Containers

- **Corner Style:** 12px.
- **Background:** Paper.
- **Shadow Strategy:** none (see The Hairline At Rest Rule).
- **Border:** 1px Hairline.
- **Internal Padding:** 24px; header gap 4px; titles 18px semibold, descriptions 15px Secondary Grey.
- **Empty state:** a borderless Soft Fill panel (12px, 32px by 24px, 40px by 32px from 640px), a 20–22px semibold heading, 15–16px Secondary Grey copy capped at ~36rem, optional action 24px below. Plain words, no illustration. Error pages reuse it.
- **Banner:** 12px radius, 1px border, 14px by 16px, 15px text with an 18px leading icon. Warning, destructive (`role="alert"`), success and info variants.

### Inputs / Fields

- **Style:** white, 1px Control Edge border, 8px radius, 48px min height, 12px by 16px padding, 16px text, Secondary Grey placeholder.
- **Focus:** border turns ink plus the global 2px ink outline; hover also turns the border ink.
- **Error / Disabled:** `aria-invalid` turns the border Alert Red; disabled is 50% opacity with a not-allowed cursor.
- **Labels:** 15px semibold, sentence case, above the field.

### Navigation

- **Sidebar (desktop):** 44px rows, 12px padding, 8px radius, 20px icon plus 15px label. Inactive: medium weight, Secondary Grey, Soft Fill and ink on hover. Active: Soft Fill background, semibold ink, icon stroke 2.25, `aria-current="page"`.
- **Tab bar (phone):** five equal columns, 24px icon over an 11px semibold caption. Active tab turns Lodgely Green with a heavier stroke; the Menu tab is active whenever the current section is not one of the four tabs.
- **Menu bottom sheet:** rises from the bottom with 16px top corners, Float shadow and overlay; account header (avatar, name, email) above every section in sidebar order as 48px rows, then What's new, Billing and Sign out.
- **Account pill (desktop):** a 44px full pill with a hairline, menu glyph plus 32px ink avatar disc; Pill shadow on hover and while open.
- **Dropdown menus:** white, 12px radius, Float shadow, 8px vertical padding, 44px items with 18px ink icons, Soft Fill highlight, hairline separators.

### Search Pill and Command Palette (signature)

The top bar's search is a full white pill (44px, 48px on desktop, max 448px) with a hairline, the Pill shadow at rest and Float on hover, an 18px search icon, 15px medium placeholder copy and a Soft Fill ⌘K / Ctrl K chip. On crowded phone top bars it collapses to a 44px round search button. It opens a 576px dialog with a 64px borderless input, "Go to" results as 48px rows (Soft Fill for the active option) and a hairline footer note.

### Page Header

Title, optional description and right-aligned actions. Default is the 28/32px bold headline; `size="hero"` (34/44px extrabold) is reserved for the dashboard greeting.

### Logo

A solid house-and-door mark in Lodgely Green, followed by the lowercase "lodgely" wordmark in 22px extrabold. Mark only in the phone top bar, and at 16px in the guest-page credit.

## Do's and Don'ts

### Do:

- **Do** build every screen on Paper (`#ffffff`) with Ink text and Secondary Grey for supporting copy.
- **Do** use Lodgely Green for the single primary action on a view and for phone tab selection; nothing else.
- **Do** separate resting surfaces with 1px Hairline borders and 12px corners; lift only floating layers with the Float or Pill shadow.
- **Do** set headings in Figtree bold or extrabold, sentence case, with tight tracking; keep body at 15px regular.
- **Do** give every control a 44px target under coarse pointers, and rely on the global 2px ink focus outline at 2px offset.
- **Do** use Control Edge (`#8e8e8e`) for input borders so they hold 3:1 on white and on Soft Fill.
- **Do** say "nothing here yet" with the Soft Fill empty-state panel and plain words, never with fake data.
- **Do** use the Notice palette for "action needed" and "not connected" states, and Alert Red only for errors and destructive actions.

### Don't:

- **Don't** bring back the retired world: no cream ground, no serif display face, no uppercase tracked micro-labels or eyebrow kickers above headings.
- **Don't** use a coloured left rule (or any border thicker than 1px) as a card accent; KPI and status states use tinted fills and badges.
- **Don't** put a shadow on a resting card.
- **Don't** give the dark button or a pill a primary role; there is one primary treatment (green, 8px).
- **Don't** use the sparkle glyph for any destination; it reads as the "AI" icon.
- **Don't** use raw hex in components; use the tokens (`bg-primary`, `text-muted-foreground`, `border-input`, `bg-warning`). Third-party brand marks (the Google "G") are the only exception.
- **Don't** let Lodgely headline a guest-facing page; the hotel owns it and Lodgely is a quiet credit.
