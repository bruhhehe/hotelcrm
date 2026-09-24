import { Skeleton } from "@/components/ui/skeleton";

export default function ListLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-5 w-80 max-w-full" />
      <div className="mt-8 flex gap-6 border-b pb-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-28" />
        ))}
      </div>
      <div className="mt-8 divide-y rounded-xl border">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
          >
            <div className="flex-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="mt-2 h-4 w-72 max-w-full" />
            </div>
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
