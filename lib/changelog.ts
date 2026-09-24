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
