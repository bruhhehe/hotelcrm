import { GuestFrame } from "@/components/app-shell/powered-by";

/**
 * Guest self-service portal (/stay/[slug]/account). Uses its own passwordless auth and cookie,
 * separate from staff sessions (Phase 9).
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <GuestFrame>{children}</GuestFrame>;
}
