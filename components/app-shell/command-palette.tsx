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
export function CommandPalette({
  collapseOnPhone = false,
}: {
  /** Phone top bar is crowded (e.g. by the trial pill): show a round search button instead of the pill. */
  collapseOnPhone?: boolean;
}) {
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
      {collapseOnPhone ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Search"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-background shadow-pill sm:hidden"
        >
          <Search className="size-[18px]" strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-keyshortcuts="Meta+K Control+K"
        className={cn(
          "h-11 w-full max-w-md items-center gap-3 rounded-full border bg-background pr-2 pl-4 text-left text-[15px] font-medium text-foreground shadow-pill transition-shadow hover:shadow-float lg:h-12",
          collapseOnPhone ? "hidden sm:flex" : "flex",
        )}
      >
        <Search className="size-[18px] shrink-0" strokeWidth={2.25} aria-hidden />
        <span className="flex-1 truncate sm:hidden">Search</span>
        <span className="hidden flex-1 truncate sm:inline">
          Search guests, reservations, rooms…
        </span>
        <kbd className="hidden rounded-full bg-muted px-2.5 py-1 font-sans text-xs font-semibold text-muted-foreground sm:inline">
          {shortcut}
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          hideClose
          className="max-w-xl overflow-hidden p-0"
          aria-describedby={undefined}
        >
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
              className="h-16 flex-1 bg-transparent text-base outline-none"
            />
          </div>
          <div className="p-2">
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nothing matches “{query}”. Try a section name, like “reservations”.
              </p>
            ) : (
              <>
                <p
                  id={`${listId}-label`}
                  className="px-3 pt-2 pb-2 text-sm font-semibold text-muted-foreground"
                >
                  Go to
                </p>
                {/* Scrolls via arrow keys (scrollIntoView); tabIndex keeps the region keyboard-reachable. */}
                <ul
                  ref={listRef}
                  id={listId}
                  role="listbox"
                  tabIndex={-1}
                  aria-labelledby={`${listId}-label`}
                  className="max-h-[min(28rem,60vh)] overflow-y-auto"
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
                          "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-3 text-[15px]",
                          active && "bg-accent",
                        )}
                      >
                        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
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
          <p className="border-t px-5 py-3 text-sm text-muted-foreground">
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
