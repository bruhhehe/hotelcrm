/**
 * Public booking widget (/stay/[slug]). Kept chrome-free so it embeds cleanly in an iframe;
 * hotel branding (logo, colour) is applied per hotel once hotels exist (Phase 8).
 */
export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
