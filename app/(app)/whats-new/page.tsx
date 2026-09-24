import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { Badge } from "@/components/ui/badge";
import { CHANGELOG } from "@/lib/changelog";
import { formatIsoDate } from "@/lib/format/greeting";

export const metadata: Metadata = { title: "What's new" };

export default function WhatsNewPage() {
  return (
    <>
      <PageHeader title="What's new" description="Recent improvements to Lodgely." />
      <ol className="max-w-2xl divide-y border-y">
        {CHANGELOG.map((entry) => (
          <li key={entry.date + entry.title} className="py-8">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <time dateTime={entry.date}>{formatIsoDate(entry.date)}</time>
              <Badge variant={entry.tag === "New" ? "default" : "neutral"}>{entry.tag}</Badge>
            </div>
            <h2 className="mt-2 text-xl font-semibold">{entry.title}</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
              {entry.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}
