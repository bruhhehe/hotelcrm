/**
 * Guest self-service portal (/stay/[slug]/account). Uses its own passwordless auth and cookie,
 * separate from staff sessions (Phase 9).
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-dvh bg-background">{children}</main>;
}
