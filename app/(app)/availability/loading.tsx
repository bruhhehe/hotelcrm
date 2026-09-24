import { Skeleton } from "@/components/ui/skeleton";

export default function AvailabilityLoading() {
  return (
    <div aria-busy="true" aria-label="Loading availability">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-5 w-80 max-w-full" />
      <div className="mt-8 flex gap-6 border-b pb-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-28" />
        ))}
      </div>
      <div className="mt-8 flex items-center gap-2">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="ml-2 h-6 w-48" />
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border">
        {Array.from({ length: 8 }, (_, row) => (
          <div key={row} className="flex gap-3 border-b px-4 py-4 last:border-b-0">
            <Skeleton className="h-5 w-36 shrink-0" />
            <div className="flex flex-1 gap-3 overflow-hidden">
              {Array.from({ length: 10 }, (_, col) => (
                <Skeleton key={col} className="h-5 w-14 shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
