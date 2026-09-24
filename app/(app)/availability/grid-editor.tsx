"use client";

import { SlidersHorizontal } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { BulkEditDialog, type BulkEditRoomType, type BulkEditTarget } from "./bulk-edit-dialog";

type Editor = { edit: (target: BulkEditTarget) => void; defaultTarget: BulkEditTarget };

const EditorContext = React.createContext<Editor | null>(null);

/** Null for staff who can view but not change availability. */
export function useGridEditor(): Editor | null {
  return React.useContext(EditorContext);
}

/**
 * Owns the "Edit dates" dialog so the header button and every grid cell can open it,
 * prefilled with what was clicked.
 */
export function GridEditor({
  enabled,
  roomTypes,
  defaultTarget,
  currencySymbol,
  children,
}: {
  enabled: boolean;
  roomTypes: BulkEditRoomType[];
  defaultTarget: BulkEditTarget;
  currencySymbol: string;
  children: React.ReactNode;
}) {
  const [target, setTarget] = React.useState<BulkEditTarget | null>(null);
  const [open, setOpen] = React.useState(false);
  const editor = React.useMemo<Editor>(
    () => ({
      edit: (t) => {
        setTarget(t);
        setOpen(true);
      },
      defaultTarget,
    }),
    [defaultTarget],
  );
  if (!enabled) return <>{children}</>;
  return (
    <EditorContext.Provider value={editor}>
      {children}
      {target ? (
        <BulkEditDialog
          key={JSON.stringify(target)}
          open={open}
          onOpenChange={setOpen}
          target={target}
          roomTypes={roomTypes}
          currencySymbol={currencySymbol}
        />
      ) : null}
    </EditorContext.Provider>
  );
}

export function EditDatesButton() {
  const editor = useGridEditor();
  if (!editor) return null;
  return (
    <Button onClick={() => editor.edit(editor.defaultTarget)}>
      <SlidersHorizontal />
      Edit dates
    </Button>
  );
}
