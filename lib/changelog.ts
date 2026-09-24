export type ChangelogEntry = {
  date: string;
  tag: "New" | "Improved" | "Fixed";
  title: string;
  items: string[];
};

/** Newest first. Rendered on /whats-new. */
export const CHANGELOG: readonly ChangelogEntry[] = [
  {
    date: "2026-09-24",
    tag: "New",
    title: "Rooms, rates and availability",
    items: [
      "Settings → Rooms and Rates: add room types, rooms and rate plans, and take a room out of order.",
      "Availability shows rooms left and prices for every night, two weeks at a time. Select any night to change it.",
      "Edit dates: change rooms to sell, prices and stay rules over a date range for several room types at once, once or every year.",
      "Price adjustments for seasons and weekends, capacity overrides, closed dates, no-arrival and no-departure days, and minimum stays.",
      "Prices are worked out to the penny, with VAT itemised and your deposit split, and the last room can never be sold twice.",
    ],
  },
  {
    date: "2026-09-24",
    tag: "New",
    title: "Your hotel in Lodgely",
    items: [
      "The app now knows which hotel you work in: its name, timezone and trial days left show up where you work.",
      "Rooms, rates, guests, reservations, payments and housekeeping are stored safely per hotel, and a room can never be booked twice for the same night.",
    ],
  },
  {
    date: "2026-09-24",
    tag: "Improved",
    title: "Easier to use with a keyboard, screen reader or phone",
    items: [
      "Clear focus outlines everywhere, plus a “Skip to content” link.",
      "Quick search announces results to screen readers.",
      "Larger tap targets on touch screens, and form fields that are easier to see.",
      "Your email stays filled in if sign-in needs a second try.",
    ],
  },
  {
    date: "2026-09-24",
    tag: "New",
    title: "Lodgely foundations",
    items: [
      "Sign in with an email magic link or Google.",
      "New app layout with sidebar navigation and ⌘K quick search.",
      "Health check endpoint for uptime monitoring.",
    ],
  },
];
