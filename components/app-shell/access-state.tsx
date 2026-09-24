import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "./page-header";

/** What a page shows instead of its content when the user has no hotel or not the right role. */
export function AccessState({
  status,
  title,
}: {
  status: "no-hotel" | "forbidden";
  title: string;
}) {
  return (
    <>
      <PageHeader title={title} />
      {status === "no-hotel" ? (
        <EmptyState
          title="You're not part of a hotel yet"
          description="Ask your hotel's owner to invite you to Lodgely. Once you accept, your hotel appears here."
        />
      ) : (
        <EmptyState
          title="You don't have access to this page"
          description="Your role doesn't include it. Ask your hotel's owner or a manager if you need it."
        />
      )}
    </>
  );
}
