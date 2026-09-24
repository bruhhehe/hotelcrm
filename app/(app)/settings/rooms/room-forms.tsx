"use client";

import { Pencil, Plus } from "lucide-react";
import { FormDialog } from "@/components/forms/form-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { describedBy, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { saveRoom, saveRoomType } from "@/lib/inventory/actions";
import { ROOM_STATUS_LABEL, roomName } from "@/lib/inventory/labels";

export type RoomTypeFormValues = {
  id: string;
  name: string;
  description: string | null;
  baseOccupancy: number;
  maxOccupancy: number;
  bedConfig: string | null;
  amenities: string[];
  isBookableOnline: boolean;
};

export type RoomFormValues = {
  id: string;
  roomTypeId: string;
  name: string;
  floor: string | null;
  status: keyof typeof ROOM_STATUS_LABEL;
  notes: string | null;
};

export function RoomTypeDialog({
  roomType,
  variant = "add",
}: {
  roomType?: RoomTypeFormValues;
  variant?: "add" | "add-first" | "edit";
}) {
  const editing = roomType !== undefined;
  return (
    <FormDialog
      title={editing ? `Edit ${roomType.name}` : "Add a room type"}
      description="Guests book a room type; you pick the exact room later."
      action={saveRoomType}
      submitLabel={editing ? "Save" : "Add room type"}
      trigger={
        variant === "edit" ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${roomType?.name}`} title="Edit">
            <Pencil />
          </Button>
        ) : (
          <Button>
            <Plus />
            {variant === "add-first" ? "Add your first room type" : "Add room type"}
          </Button>
        )
      }
    >
      {(errors) => (
        <>
          {editing ? <input type="hidden" name="id" value={roomType.id} /> : null}
          <Field label="Name" htmlFor="rt-name" error={errors.name}>
            <Input
              id="rt-name"
              name="name"
              defaultValue={roomType?.name}
              placeholder="Classic Double"
              required
              autoComplete="off"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy("rt-name", { error: errors.name })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Standard guests"
              htmlFor="rt-base"
              error={errors.baseOccupancy}
              hint="Priced for"
            >
              <Input
                id="rt-base"
                name="baseOccupancy"
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                defaultValue={roomType?.baseOccupancy ?? 2}
                aria-invalid={Boolean(errors.baseOccupancy)}
                aria-describedby={describedBy("rt-base", {
                  hint: true,
                  error: errors.baseOccupancy,
                })}
              />
            </Field>
            <Field
              label="Most guests"
              htmlFor="rt-max"
              error={errors.maxOccupancy}
              hint="Can sleep"
            >
              <Input
                id="rt-max"
                name="maxOccupancy"
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                defaultValue={roomType?.maxOccupancy ?? 2}
                aria-invalid={Boolean(errors.maxOccupancy)}
                aria-describedby={describedBy("rt-max", { hint: true, error: errors.maxOccupancy })}
              />
            </Field>
          </div>
          <Field label="Beds" htmlFor="rt-beds" error={errors.bedConfig}>
            <Input
              id="rt-beds"
              name="bedConfig"
              defaultValue={roomType?.bedConfig ?? ""}
              placeholder="1 king"
              autoComplete="off"
            />
          </Field>
          <Field label="Description" htmlFor="rt-description" error={errors.description}>
            <Textarea
              id="rt-description"
              name="description"
              rows={3}
              defaultValue={roomType?.description ?? ""}
              placeholder="What makes this room worth booking."
            />
          </Field>
          <Field
            label="Amenities"
            htmlFor="rt-amenities"
            hint="One per line, or separated by commas."
            error={errors.amenities}
          >
            <Textarea
              id="rt-amenities"
              name="amenities"
              rows={3}
              defaultValue={roomType?.amenities.join("\n") ?? ""}
              placeholder={"Wi-Fi\nTea and coffee"}
              aria-describedby={describedBy("rt-amenities", {
                hint: true,
                error: errors.amenities,
              })}
            />
          </Field>
          <Checkbox
            name="isBookableOnline"
            defaultChecked={roomType?.isBookableOnline ?? true}
            label="Guests can book it online"
            description="Shown on your booking widget once it's live."
          />
        </>
      )}
    </FormDialog>
  );
}

export function RoomDialog({
  room,
  roomTypes,
  roomTypeId,
  roomTypeName,
}: {
  room?: RoomFormValues;
  roomTypes: { id: string; name: string }[];
  /** The room type a new room is added to. */
  roomTypeId: string;
  roomTypeName: string;
}) {
  const editing = room !== undefined;
  return (
    <FormDialog
      title={editing ? `Edit ${roomName(room.name)}` : `Add a room to ${roomTypeName}`}
      action={saveRoom}
      submitLabel={editing ? "Save" : "Add room"}
      trigger={
        editing ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${roomName(room.name)}`}
            title="Edit"
          >
            <Pencil />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Plus />
            Add room
          </Button>
        )
      }
    >
      {(errors) => (
        <>
          {editing ? <input type="hidden" name="id" value={room.id} /> : null}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Number or name" htmlFor="room-name" error={errors.name}>
              <Input
                id="room-name"
                name="name"
                defaultValue={room?.name}
                placeholder="12"
                autoComplete="off"
                required
                aria-invalid={Boolean(errors.name)}
                aria-describedby={describedBy("room-name", { error: errors.name })}
              />
            </Field>
            <Field label="Floor" htmlFor="room-floor" error={errors.floor}>
              <Input
                id="room-floor"
                name="floor"
                defaultValue={room?.floor ?? ""}
                placeholder="First"
                autoComplete="off"
              />
            </Field>
          </div>
          <Field label="Room type" htmlFor="room-type" error={errors.roomTypeId}>
            <NativeSelect
              id="room-type"
              name="roomTypeId"
              defaultValue={room?.roomTypeId ?? roomTypeId}
              aria-invalid={Boolean(errors.roomTypeId)}
              aria-describedby={describedBy("room-type", { error: errors.roomTypeId })}
            >
              {roomTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field
            label="Status"
            htmlFor="room-status"
            hint="Out of order takes the room off sale from today until you change it back."
            error={errors.status}
          >
            <NativeSelect
              id="room-status"
              name="status"
              defaultValue={room?.status ?? "clean"}
              aria-describedby={describedBy("room-status", { hint: true, error: errors.status })}
            >
              {Object.entries(ROOM_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Notes for staff" htmlFor="room-notes" error={errors.notes}>
            <Textarea
              id="room-notes"
              name="notes"
              rows={2}
              defaultValue={room?.notes ?? ""}
              placeholder="Connecting door to room 13"
            />
          </Field>
        </>
      )}
    </FormDialog>
  );
}
