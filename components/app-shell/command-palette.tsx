"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav";

/**
 * ⌘K palette. Today it jumps between sections; guest / reservation / room results are
 * added as those modules land (Phases 4 and 6).
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_ITEMS;
    return NAV_ITEMS.filter(
      (item) => item.label.toLowerCase().includes(q) || item.keywords.some((k) => k.includes(q)),
    );
  }, [query]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setCursor(0);
    }
  }

  function go(index: number) {
    const item = results[index];
    if (!item) return;
    onOpenChange(false);
    router.push(item.href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-full max-w-md items-center gap-2 rounded-xl border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-input"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 truncate text-left">Search guests, reservations, rooms…</span>
        <kbd className="hidden rounded-md bg-muted px-1.5 py-0.5 font-sans text-[11px] font-medium sm:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent hideClose className="max-w-xl p-0" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCursor(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setCursor((c) => Math.min(c + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setCursor((c) => Math.max(c - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  go(cursor);
                }
              }}
              placeholder="Search guests, reservations, rooms…"
              className="h-14 flex-1 bg-transparent text-base outline-none"
              aria-label="Search"
            />
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            <p className="px-3 pt-2 pb-1 micro-label">Go to</p>
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No matches for “{query}”.
              </p>
            ) : (
              <ul role="listbox" aria-label="Results">
                {results.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href} role="option" aria-selected={i === cursor}>
                      <button
                        type="button"
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => go(i)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                          i === cursor && "bg-accent",
                        )}
                      >
                        <Icon className="size-4 text-muted-foreground" aria-hidden />
                        <span className="flex-1 text-left">{item.label}</span>
                        {i === cursor ? (
                          <CornerDownLeft className="size-3.5 text-muted-foreground" aria-hidden />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
            Guest, reservation and room search arrive with those modules.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
