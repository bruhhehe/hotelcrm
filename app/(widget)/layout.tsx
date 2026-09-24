import { GuestFrame } from "@/components/app-shell/powered-by";

/**
 * Public booking widget (/stay/[slug]). Embeddable in an iframe on the hotel's own site;
 * hotel branding (logo, colour) is applied per hotel once hotels exist (Phase 8).
 */
export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return <GuestFrame>{children}</GuestFrame>;
}
