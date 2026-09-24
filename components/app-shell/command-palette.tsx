"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav";

/** Apple platforms show ⌘K; everything else Ctrl K. Server render assumes ⌘ and corrects on mount. */
function useShortcutLabel(): string {
  return useSyncExternalStore(
    () => () => {},
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"),
    () => "⌘K",
  );
}

/**
 * ⌘K palette, built as an ARIA combobox: focus stays in the input, arrow keys move
 * `aria-activedescendant`, so screen readers announce the highlighted result.
 * Today it jumps between sections; guest / reservation / room results are added as those
 * modules land (Phases 4 and 6).
 */
export function CommandPalette() {
  const router = useRouter();
  const shortcut = useShortcutLabel();
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
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

  const optionId = (index: number) => `${listId}-option-${index}`;

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[id="${listId}-option-${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor, listId]);

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
        aria-keyshortcuts="Meta+K Control+K"
        className="flex min-h-10 w-full max-w-md items-center gap-2 rounded-xl border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-input pointer-coarse:min-h-11"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate text-left sm:hidden">Search</span>
        <span className="hidden flex-1 truncate text-left sm:inline">
          Search guests, reservations, rooms…
        </span>
        <kbd className="hidden rounded-md bg-muted px-1.5 py-0.5 font-sans text-[11px] font-medium sm:inline">
          {shortcut}
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent hideClose className="max-w-xl p-0" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Search Lodgely</DialogTitle>
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={results.length > 0 ? optionId(cursor) : undefined}
              aria-label="Search guests, reservations and rooms"
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
                } else if (e.key === "Home") {
                  e.preventDefault();
                  setCursor(0);
                } else if (e.key === "End") {
                  e.preventDefault();
                  setCursor(Math.max(results.length - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  go(cursor);
                }
              }}
              placeholder="Search guests, reservations, rooms…"
              className="h-14 flex-1 bg-transparent text-base outline-none"
            />
          </div>
          <div className="p-2">
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nothing matches “{query}”. Try a section name, like “reservations”.
              </p>
            ) : (
              <>
                <p id={`${listId}-label`} className="px-3 pt-2 pb-1 text-sm font-semibold">
                  Go to
                </p>
                {/* Scrolls via arrow keys (scrollIntoView); tabIndex keeps the region keyboard-reachable. */}
                <ul
                  ref={listRef}
                  id={listId}
                  role="listbox"
                  tabIndex={-1}
                  aria-labelledby={`${listId}-label`}
                  className="max-h-[min(22rem,55vh)] overflow-y-auto"
                >
                  {results.map((item, i) => {
                    const Icon = item.icon;
                    const active = i === cursor;
                    return (
                      <li
                        key={item.href}
                        id={optionId(i)}
                        role="option"
                        aria-selected={active}
                        onMouseMove={() => setCursor(i)}
                        onClick={() => go(i)}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm",
                          active && "bg-accent",
                        )}
                      >
                        <Icon className="size-4 text-muted-foreground" aria-hidden />
                        <span className="flex-1">{item.label}</span>
                        {active ? (
                          <CornerDownLeft className="size-3.5 text-muted-foreground" aria-hidden />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
          <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
            Guest, reservation and room search arrive with those modules.
          </p>
          <p className="sr-only" role="status" aria-live="polite">
            {results.length === 0
              ? "No results"
              : `${results.length} ${results.length === 1 ? "result" : "results"}`}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
