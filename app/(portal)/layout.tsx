/**
 * Guest self-service portal (/stay/[slug]/account). Uses its own passwordless auth and cookie,
 * separate from staff sessions (Phase 9).
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
