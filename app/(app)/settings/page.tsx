import { BedDouble, ChevronRight, CreditCard, Tags } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { AccessState } from "@/components/app-shell/access-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { hotelAccess } from "@/lib/hotels/access";

export const metadata: Metadata = { title: "Settings" };

const SECTIONS: { href: Route; title: string; description: string; icon: typeof BedDouble }[] = [
  {
    href: "/settings/rooms",
    title: "Rooms",
    description: "Room types, the rooms in each, occupancy and amenities.",
    icon: BedDouble,
  },
  {
    href: "/settings/rates",
    title: "Rates",
    description: "Rate plans for each room type: base prices, breakfast and minimum stays.",
    icon: Tags,
  },
  {
    href: "/settings/billing",
    title: "Billing",
    description: "Your Lodgely plan and trial.",
    icon: CreditCard,
  },
];

export default async function SettingsPage() {
  const access = await hotelAccess("settings.view");
  if (access.status !== "ok") return <AccessState status={access.status} title="Settings" />;

  return (
    <>
      <PageHeader title="Settings" description={`How ${access.hotel.name} runs in Lodgely.`} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map(({ href, title, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex h-full items-start gap-4 rounded-xl border bg-card p-5 transition-colors hover:bg-muted"
            >
              <Icon className="mt-0.5 size-6 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold">{title}</span>
                <span className="mt-0.5 block text-[15px] text-muted-foreground">
                  {description}
                </span>
              </span>
              <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-[15px] text-muted-foreground">
        Hotel details, payments, emails, the booking widget and your team arrive in later updates.
      </p>
    </>
  );
}
