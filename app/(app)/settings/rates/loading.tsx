import { Skeleton } from "@/components/ui/skeleton";

export default function RoomsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="mt-4 h-9 w-40" />
      <Skeleton className="mt-3 h-5 w-64 max-w-full" />
      {Array.from({ length: 2 }, (_, s) => (
        <div key={s} className="mt-10">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
          <div className="mt-4 divide-y rounded-xl border">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-6 px-5 py-4">
                <Skeleton className="h-5 w-24 flex-1" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
