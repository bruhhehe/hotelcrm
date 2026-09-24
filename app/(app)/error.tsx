"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      title="This page couldn't load"
      description={
        <>
          Your data is safe. Try again, and if it keeps happening contact support
          {error.digest ? ` with reference ${error.digest}` : ""}.
        </>
      }
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
