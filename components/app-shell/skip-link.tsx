/** First tab stop: jumps past the sidebar and top bar to the page content (`<main id="main">`). */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="fixed top-3 left-3 z-50 -translate-y-20 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card focus-visible:translate-y-0"
    >
      Skip to content
    </a>
  );
}
