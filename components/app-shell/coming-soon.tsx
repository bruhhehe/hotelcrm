import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "./page-header";

/**
 * Honest placeholder for a section whose module hasn't been built yet. Replaced page by
 * page as each build phase lands — never with fake data.
 */
export function ComingSoon({
  title,
  description,
  icon,
  what,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  what: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState icon={icon} title="Not available yet" description={what} />
    </>
  );
}
