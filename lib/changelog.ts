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
    title: "Lodgely foundations",
    items: [
      "Sign in with an email magic link or Google.",
      "New app layout with sidebar navigation and ⌘K quick search.",
      "Health check endpoint for uptime monitoring.",
    ],
  },
];
