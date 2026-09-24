import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { AccessState } from "@/components/app-shell/access-state";
import { BackLink } from "@/components/app-shell/back-link";
import { PageHeader } from "@/components/app-shell/page-header";
import { ConfirmDelete } from "@/components/forms/confirm-delete";
import { Badge } from "@/components/ui/badge";
import { DataList, DataListActions, DataListItem, DataListMain } from "@/components/ui/data-list";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { rooms, roomTypes } from "@/lib/db/schema";
import { hotelAccess } from "@/lib/hotels/access";
import { deleteRoom, deleteRoomType } from "@/lib/inventory/actions";
import { occupancyLabel, ROOM_STATUS_LABEL, roomName } from "@/lib/inventory/labels";
import { RoomDialog, RoomTypeDialog } from "./room-forms";

export const metadata: Metadata = { title: "Rooms" };

const STATUS_VARIANT = {
  clean: "default",
  inspected: "default",
  dirty: "warning",
  out_of_order: "destructive",
} as const;

export default async function RoomsSettingsPage() {
  const access = await hotelAccess("settings.view");
  if (access.status !== "ok") return <AccessState status={access.status} title="Rooms" />;

  const hdb = db.forHotel(access.hotel.id);
  const types = await hdb.select(roomTypes, undefined, {
    orderBy: [asc(roomTypes.sortOrder), asc(roomTypes.name)],
  });
  const allRooms = await hdb.select(rooms, undefined, {
    orderBy: [asc(rooms.sortOrder), asc(rooms.name)],
  });
  const typeOptions = types.map((t) => ({ id: t.id, name: t.name }));
  const roomCount = allRooms.length;

  return (
    <>
      <BackLink href="/settings" label="Settings" />
      <PageHeader
        title="Rooms"
        description={
          types.length > 0
            ? `${roomCount} ${roomCount === 1 ? "room" : "rooms"} in ${types.length} ${types.length === 1 ? "room type" : "room types"}.`
            : "Room types and the rooms in each."
        }
        actions={types.length > 0 ? <RoomTypeDialog /> : null}
      />

      {types.length === 0 ? (
        <EmptyState
          title="No room types yet"
          description="Start with the kinds of room you sell, like “Classic Double” or “Family Suite”, then add the rooms of each type. Rates and availability build on these."
          action={<RoomTypeDialog variant="add-first" />}
        />
      ) : (
        <div className="flex flex-col gap-10">
          {types.map((type) => {
            const typeRooms = allRooms.filter((r) => r.roomTypeId === type.id);
            const facts = [
              occupancyLabel(type.baseOccupancy, type.maxOccupancy),
              type.bedConfig,
              type.isBookableOnline ? null : "Not bookable online",
            ].filter(Boolean);
            return (
              <section key={type.id} aria-labelledby={`type-${type.id}`}>
                <div className="mb-3 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 id={`type-${type.id}`} className="text-xl font-semibold sm:text-[22px]">
                      {type.name}
                    </h2>
                    <p className="mt-0.5 text-[15px] text-muted-foreground">{facts.join(" · ")}</p>
                    {type.amenities.length > 0 ? (
                      <p className="mt-1 text-[15px] text-muted-foreground">
                        {type.amenities.join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <DataListActions className="max-sm:mr-0">
                    <RoomTypeDialog
                      variant="edit"
                      roomType={{
                        id: type.id,
                        name: type.name,
                        description: type.description,
                        baseOccupancy: type.baseOccupancy,
                        maxOccupancy: type.maxOccupancy,
                        bedConfig: type.bedConfig,
                        amenities: type.amenities,
                        isBookableOnline: type.isBookableOnline,
                      }}
                    />
                    <ConfirmDelete
                      action={deleteRoomType}
                      id={type.id}
                      label={`Delete ${type.name}`}
                      title={`Delete ${type.name}?`}
                      description={`Its ${typeRooms.length === 1 ? "room" : `${typeRooms.length} rooms`}, rate plans and seasonal rules go too. Past bookings keep their details. You can't delete a room type with upcoming bookings.`}
                    />
                  </DataListActions>
                </div>

                {typeRooms.length > 0 ? (
                  <DataList>
                    {typeRooms.map((room) => (
                      <DataListItem key={room.id} className="max-sm:flex-row max-sm:items-center">
                        <DataListMain
                          title={roomName(room.name)}
                          detail={
                            [room.floor ? `${room.floor} floor` : null, room.notes]
                              .filter(Boolean)
                              .join(" · ") || undefined
                          }
                        />
                        <Badge variant={STATUS_VARIANT[room.status]}>
                          {ROOM_STATUS_LABEL[room.status]}
                        </Badge>
                        <DataListActions>
                          <RoomDialog
                            room={{
                              id: room.id,
                              roomTypeId: room.roomTypeId,
                              name: room.name,
                              floor: room.floor,
                              status: room.status,
                              notes: room.notes,
                            }}
                            roomTypes={typeOptions}
                            roomTypeId={type.id}
                            roomTypeName={type.name}
                          />
                          <ConfirmDelete
                            action={deleteRoom}
                            id={room.id}
                            label={`Delete ${roomName(room.name)}`}
                            title={`Delete ${roomName(room.name)}?`}
                            description="Past bookings keep their details. You can't delete a room with upcoming bookings; move them first."
                          />
                        </DataListActions>
                      </DataListItem>
                    ))}
                  </DataList>
                ) : (
                  <p className="rounded-xl bg-muted px-5 py-4 text-[15px] text-muted-foreground">
                    No rooms of this type yet. Add one so it can be booked.
                  </p>
                )}
                <div className="mt-3">
                  <RoomDialog
                    roomTypes={typeOptions}
                    roomTypeId={type.id}
                    roomTypeName={type.name}
                  />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
