import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CHANGELOG } from "@/lib/changelog";

export const metadata: Metadata = { title: "What's new" };

export default function WhatsNewPage() {
  return (
    <>
      <PageHeader title="What's new" description="Recent improvements to Lodgely." />
      <ol className="flex flex-col gap-4">
        {CHANGELOG.map((entry) => (
          <li key={entry.date + entry.title}>
            <Card>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <time className="micro-label" dateTime={entry.date}>
                    {entry.date}
                  </time>
                  <Badge variant="neutral">{entry.tag}</Badge>
                </div>
                <h2 className="text-xl font-semibold">{entry.title}</h2>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {entry.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </>
  );
}
