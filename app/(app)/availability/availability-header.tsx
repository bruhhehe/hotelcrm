import { PageHeader } from "@/components/app-shell/page-header";
import { TabsNav } from "@/components/ui/tabs-nav";

const TABS = [
  { href: "/availability", label: "Rates and availability" },
  { href: "/availability/capacity", label: "Capacity" },
  { href: "/availability/adjustments", label: "Price adjustments" },
  { href: "/availability/rules", label: "Stay rules" },
] as const;

export function AvailabilityHeader({ actions }: { actions?: React.ReactNode }) {
  return (
    <>
      <PageHeader
        title="Availability"
        description="Rooms to sell, prices and stay rules, night by night."
        actions={actions}
      />
      <TabsNav items={TABS} label="Availability sections" />
    </>
  );
}
