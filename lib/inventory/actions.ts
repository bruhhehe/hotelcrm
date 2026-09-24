"use server";

import { and, asc, count, eq, gt, inArray, isNull, max, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { type ActionResult, formObject, invalid } from "@/lib/actions/result";
import { audit } from "@/lib/audit";
import { type HotelDb, withHotelTransaction } from "@/lib/db";
import {
  availabilityRules,
  cancellationPolicies,
  capacityOverrides,
  priceAdjustments,
  ratePlans,
  reservationRooms,
  rooms,
  roomTypes,
} from "@/lib/db/schema";
import { hotelAccess } from "@/lib/hotels/access";
import { roomName } from "./labels";
import { loadHotelBasics } from "./queries";
import {
  bulkEditFormSchema,
  capacityOverrideFormSchema,
  priceAdjustmentFormSchema,
  ratePlanFormSchema,
  roomFormSchema,
  roomTypeFormSchema,
  stayRuleFormSchema,
} from "./schemas";

/*
 * Server actions for Settings → Rooms and Rates and the Availability tabs. Each one re-checks
 * the user's role (owners and managers only), validates with Zod, writes inside one hotel-scoped
 * transaction and records an audit entry.
 */

/** A refusal the user can act on, returned to the form instead of thrown. */
class ActionError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

type Ctx = { tx: HotelDb; userId: string };

function pgCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e.cause?.code ?? e.code;
}

async function managerAction(
  run: (ctx: Ctx) => Promise<ActionResult>,
  { uniqueViolation }: { uniqueViolation?: ActionResult } = {},
): Promise<ActionResult> {
  const access = await hotelAccess("inventory.manage");
  if (access.status === "no-hotel") return { ok: false, error: "You're not part of a hotel yet." };
  if (access.status === "forbidden") {
    return {
      ok: false,
      error: "Only owners and managers can change rooms, rates and availability.",
    };
  }
  try {
    const result = await withHotelTransaction(access.hotel.id, (tx) =>
      run({ tx, userId: access.user.id }),
    );
    if (result.ok) {
      revalidatePath("/availability", "layout");
      revalidatePath("/settings", "layout");
    }
    return result;
  } catch (error) {
    if (error instanceof ActionError) {
      return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    }
    if (uniqueViolation && pgCode(error) === "23505") return uniqueViolation;
    console.error("[inventory] action failed", error);
    return { ok: false, error: "That couldn't be saved. Try again in a moment." };
  }
}

function parse<S extends z.ZodType>(schema: S, formData: FormData) {
  return schema.safeParse(formObject(formData));
}

function idFrom(formData: FormData): string {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) throw new ActionError("That item no longer exists.");
  return id;
}

async function requireRoomType(tx: HotelDb, id: string) {
  const [row] = await tx.select(roomTypes, eq(roomTypes.id, id));
  if (!row)
    throw new ActionError("That room type no longer exists.", {
      roomTypeId: "Choose a room type.",
    });
  return row;
}

async function requireRatePlan(tx: HotelDb, id: string) {
  const [row] = await tx.select(ratePlans, eq(ratePlans.id, id));
  if (!row) throw new ActionError("That rate plan no longer exists.");
  return row;
}

/** Room type and rate plan ids for a rule's scope, checked against this hotel. */
async function resolveScope(
  tx: HotelDb,
  scope: { roomTypeId: string | null; ratePlanId: string | null },
): Promise<{ roomTypeId: string | null; ratePlanId: string | null }> {
  if (scope.ratePlanId) {
    const plan = await requireRatePlan(tx, scope.ratePlanId);
    return { roomTypeId: plan.roomTypeId, ratePlanId: plan.id };
  }
  if (scope.roomTypeId) {
    await requireRoomType(tx, scope.roomTypeId);
    return { roomTypeId: scope.roomTypeId, ratePlanId: null };
  }
  return { roomTypeId: null, ratePlanId: null };
}

/** Active bookings still to come (or in house) holding this room type, room or rate plan. */
async function upcomingBookings(tx: HotelDb, where: ReturnType<typeof eq>): Promise<number> {
  const { today } = await loadHotelBasics(tx);
  const [row] = await tx.db
    .select({ n: count() })
    .from(reservationRooms)
    .where(
      tx.scope(
        reservationRooms,
        and(where, eq(reservationRooms.isActive, true), gt(reservationRooms.checkOut, today)),
      ),
    );
  return row?.n ?? 0;
}

const bookingsWord = (n: number) => (n === 1 ? "1 upcoming booking" : `${n} upcoming bookings`);

// ── Room types ───────────────────────────────────────────────────────────────

export async function saveRoomType(_prev: ActionResult | null, formData: FormData) {
  const parsed = parse(roomTypeFormSchema, formData);
  if (!parsed.success) return invalid(parsed.error);
  const id = formData.get("id");
  return managerAction(async ({ tx, userId }) => {
    if (typeof id === "string" && id) {
      const before = await requireRoomType(tx, id);
      await tx.update(roomTypes, parsed.data, eq(roomTypes.id, id));
      await audit(tx, {
        actorUserId: userId,
        action: "update",
        entityType: "room_type",
        entityId: id,
        before,
        after: parsed.data,
      });
      return { ok: true, message: `${parsed.data.name} saved.` };
    }
    const [last] = await tx.db
      .select({ n: max(roomTypes.sortOrder) })
      .from(roomTypes)
      .where(tx.scope(roomTypes));
    const [created] = await tx
      .insert(roomTypes, { ...parsed.data, sortOrder: (last?.n ?? -1) + 1 })
      .returning({ id: roomTypes.id });
    await audit(tx, {
      actorUserId: userId,
      action: "create",
      entityType: "room_type",
      entityId: created!.id,
      after: parsed.data,
    });
    return { ok: true, message: `${parsed.data.name} added.` };
  });
}

export async function deleteRoomType(_prev: ActionResult | null, formData: FormData) {
  return managerAction(async ({ tx, userId }) => {
    const id = idFrom(formData);
    const type = await requireRoomType(tx, id);
    const booked = await upcomingBookings(tx, eq(reservationRooms.roomTypeId, id));
    if (booked > 0) {
      throw new ActionError(
        `${type.name} has ${bookingsWord(booked)}. Move or cancel them before deleting it.`,
      );
    }
    const plans = await tx.select(ratePlans, eq(ratePlans.roomTypeId, id));
    const planIds = plans.map((p) => p.id);
    const inScope = <T extends typeof priceAdjustments | typeof availabilityRules>(t: T) =>
      planIds.length > 0
        ? or(eq(t.roomTypeId, id), inArray(t.ratePlanId, planIds))
        : eq(t.roomTypeId, id);
    await tx.softDelete(priceAdjustments, inScope(priceAdjustments));
    await tx.softDelete(availabilityRules, inScope(availabilityRules));
    await tx.softDelete(capacityOverrides, eq(capacityOverrides.roomTypeId, id));
    await tx.softDelete(ratePlans, eq(ratePlans.roomTypeId, id));
    await tx.softDelete(rooms, eq(rooms.roomTypeId, id));
    await tx.softDelete(roomTypes, eq(roomTypes.id, id));
    await audit(tx, {
      actorUserId: userId,
      action: "delete",
      entityType: "room_type",
      entityId: id,
      before: type,
    });
    return { ok: true, message: `${type.name} deleted.` };
  });
}

// ── Rooms ────────────────────────────────────────────────────────────────────

export async function saveRoom(_prev: ActionResult | null, formData: FormData) {
  const parsed = parse(roomFormSchema, formData);
  if (!parsed.success) return invalid(parsed.error);
  const id = formData.get("id");
  const name = parsed.data.name;
  return managerAction(
    async ({ tx, userId }) => {
      await requireRoomType(tx, parsed.data.roomTypeId);
      if (typeof id === "string" && id) {
        const [before] = await tx.select(rooms, eq(rooms.id, id));
        if (!before) throw new ActionError("That room no longer exists.");
        if (before.roomTypeId !== parsed.data.roomTypeId) {
          const booked = await upcomingBookings(tx, eq(reservationRooms.roomId, id));
          if (booked > 0) {
            throw new ActionError(
              `${roomName(before.name)} has ${bookingsWord(booked)}. Move them to another room before changing its type.`,
              { roomTypeId: "Can't change while the room has upcoming bookings." },
            );
          }
        }
        await tx.update(rooms, parsed.data, eq(rooms.id, id));
        await audit(tx, {
          actorUserId: userId,
          action: "update",
          entityType: "room",
          entityId: id,
          before,
          after: parsed.data,
        });
        return { ok: true, message: `${roomName(name)} saved.` };
      }
      const [last] = await tx.db
        .select({ n: max(rooms.sortOrder) })
        .from(rooms)
        .where(tx.scope(rooms));
      const [created] = await tx
        .insert(rooms, { ...parsed.data, sortOrder: (last?.n ?? -1) + 1 })
        .returning({ id: rooms.id });
      await audit(tx, {
        actorUserId: userId,
        action: "create",
        entityType: "room",
        entityId: created!.id,
        after: parsed.data,
      });
      return { ok: true, message: `${roomName(name)} added.` };
    },
    {
      uniqueViolation: {
        ok: false,
        error: `There's already a room called ${name}.`,
        fieldErrors: { name: `There's already a room called ${name}.` },
      },
    },
  );
}

export async function deleteRoom(_prev: ActionResult | null, formData: FormData) {
  return managerAction(async ({ tx, userId }) => {
    const id = idFrom(formData);
    const [room] = await tx.select(rooms, eq(rooms.id, id));
    if (!room) throw new ActionError("That room no longer exists.");
    const booked = await upcomingBookings(tx, eq(reservationRooms.roomId, id));
    if (booked > 0) {
      throw new ActionError(
        `${roomName(room.name)} has ${bookingsWord(booked)}. Move them to another room before deleting it.`,
      );
    }
    await tx.softDelete(rooms, eq(rooms.id, id));
    await audit(tx, {
      actorUserId: userId,
      action: "delete",
      entityType: "room",
      entityId: id,
      before: room,
    });
    return { ok: true, message: `${roomName(room.name)} deleted.` };
  });
}

// ── Rate plans ───────────────────────────────────────────────────────────────

/** Exactly one default plan per room type while it has any plans. */
async function settleDefaultPlan(tx: HotelDb, roomTypeId: string, preferredId?: string) {
  const plans = await tx.select(ratePlans, eq(ratePlans.roomTypeId, roomTypeId), {
    orderBy: [asc(ratePlans.createdAt)],
  });
  if (plans.length === 0) return;
  const target =
    plans.find((p) => p.id === preferredId) ?? plans.find((p) => p.isDefault) ?? plans[0]!;
  await tx.update(
    ratePlans,
    { isDefault: false },
    and(
      eq(ratePlans.roomTypeId, roomTypeId),
      ne(ratePlans.id, target.id),
      isNull(ratePlans.deletedAt),
    ),
  );
  if (!target.isDefault)
    await tx.update(ratePlans, { isDefault: true }, eq(ratePlans.id, target.id));
}

export async function saveRatePlan(_prev: ActionResult | null, formData: FormData) {
  const parsed = parse(ratePlanFormSchema, formData);
  if (!parsed.success) return invalid(parsed.error);
  const id = formData.get("id");
  return managerAction(async ({ tx, userId }) => {
    const data = parsed.data;
    await requireRoomType(tx, data.roomTypeId);
    if (data.cancellationPolicyId) {
      const [policy] = await tx.select(
        cancellationPolicies,
        eq(cancellationPolicies.id, data.cancellationPolicyId),
      );
      if (!policy) {
        throw new ActionError("That cancellation policy no longer exists.", {
          cancellationPolicyId: "Choose a cancellation policy.",
        });
      }
    }
    let planId: string;
    if (typeof id === "string" && id) {
      const before = await requireRatePlan(tx, id);
      if (before.roomTypeId !== data.roomTypeId) {
        throw new ActionError(
          "A rate plan can't move to another room type. Create a new one there.",
        );
      }
      await tx.update(ratePlans, data, eq(ratePlans.id, id));
      await audit(tx, {
        actorUserId: userId,
        action: "update",
        entityType: "rate_plan",
        entityId: id,
        before,
        after: data,
      });
      planId = id;
    } else {
      const [created] = await tx.insert(ratePlans, data).returning({ id: ratePlans.id });
      planId = created!.id;
      await audit(tx, {
        actorUserId: userId,
        action: "create",
        entityType: "rate_plan",
        entityId: planId,
        after: data,
      });
    }
    await settleDefaultPlan(tx, data.roomTypeId, data.isDefault ? planId : undefined);
    return { ok: true, message: `${data.name} saved.` };
  });
}

export async function deleteRatePlan(_prev: ActionResult | null, formData: FormData) {
  return managerAction(async ({ tx, userId }) => {
    const id = idFrom(formData);
    const plan = await requireRatePlan(tx, id);
    // Booked stays keep their stored prices; the plan just can't be sold any more.
    await tx.softDelete(priceAdjustments, eq(priceAdjustments.ratePlanId, id));
    await tx.softDelete(availabilityRules, eq(availabilityRules.ratePlanId, id));
    await tx.softDelete(ratePlans, eq(ratePlans.id, id));
    await settleDefaultPlan(tx, plan.roomTypeId);
    await audit(tx, {
      actorUserId: userId,
      action: "delete",
      entityType: "rate_plan",
      entityId: id,
      before: plan,
    });
    return { ok: true, message: `${plan.name} deleted.` };
  });
}

// ── Price adjustments, capacity overrides, stay rules ────────────────────────

export async function savePriceAdjustment(_prev: ActionResult | null, formData: FormData) {
  const parsed = parse(priceAdjustmentFormSchema, formData);
  if (!parsed.success) return invalid(parsed.error);
  const id = formData.get("id");
  return managerAction(async ({ tx, userId }) => {
    const data = { ...parsed.data, ...(await resolveScope(tx, parsed.data)) };
    if (typeof id === "string" && id) {
      const [before] = await tx.select(priceAdjustments, eq(priceAdjustments.id, id));
      if (!before) throw new ActionError("That price adjustment no longer exists.");
      await tx.update(priceAdjustments, data, eq(priceAdjustments.id, id));
      await audit(tx, {
        actorUserId: userId,
        action: "update",
        entityType: "price_adjustment",
        entityId: id,
        before,
        after: data,
      });
    } else {
      const [created] = await tx
        .insert(priceAdjustments, data)
        .returning({ id: priceAdjustments.id });
      await audit(tx, {
        actorUserId: userId,
        action: "create",
        entityType: "price_adjustment",
        entityId: created!.id,
        after: data,
      });
    }
    return { ok: true, message: `${data.label} saved.` };
  });
}

export async function saveCapacityOverride(_prev: ActionResult | null, formData: FormData) {
  const parsed = parse(capacityOverrideFormSchema, formData);
  if (!parsed.success) return invalid(parsed.error);
  const id = formData.get("id");
  return managerAction(async ({ tx, userId }) => {
    const data = parsed.data;
    await requireRoomType(tx, data.roomTypeId);
    if (typeof id === "string" && id) {
      const [before] = await tx.select(capacityOverrides, eq(capacityOverrides.id, id));
      if (!before) throw new ActionError("That capacity override no longer exists.");
      await tx.update(capacityOverrides, data, eq(capacityOverrides.id, id));
      await audit(tx, {
        actorUserId: userId,
        action: "update",
        entityType: "capacity_override",
        entityId: id,
        before,
        after: data,
      });
    } else {
      const [created] = await tx
        .insert(capacityOverrides, data)
        .returning({ id: capacityOverrides.id });
      await audit(tx, {
        actorUserId: userId,
        action: "create",
        entityType: "capacity_override",
        entityId: created!.id,
        after: data,
      });
    }
    return { ok: true, message: `${data.label} saved.` };
  });
}

export async function saveStayRule(_prev: ActionResult | null, formData: FormData) {
  const parsed = parse(stayRuleFormSchema, formData);
  if (!parsed.success) return invalid(parsed.error);
  const id = formData.get("id");
  return managerAction(async ({ tx, userId }) => {
    const data = { ...parsed.data, ...(await resolveScope(tx, parsed.data)) };
    if (typeof id === "string" && id) {
      const [before] = await tx.select(availabilityRules, eq(availabilityRules.id, id));
      if (!before) throw new ActionError("That rule no longer exists.");
      await tx.update(availabilityRules, data, eq(availabilityRules.id, id));
      await audit(tx, {
        actorUserId: userId,
        action: "update",
        entityType: "availability_rule",
        entityId: id,
        before,
        after: data,
      });
    } else {
      const [created] = await tx
        .insert(availabilityRules, data)
        .returning({ id: availabilityRules.id });
      await audit(tx, {
        actorUserId: userId,
        action: "create",
        entityType: "availability_rule",
        entityId: created!.id,
        after: data,
      });
    }
    return { ok: true, message: "Rule saved." };
  });
}

const DELETABLE = {
  price_adjustment: priceAdjustments,
  capacity_override: capacityOverrides,
  availability_rule: availabilityRules,
} as const;

/** Delete a price adjustment, capacity override or stay rule (form field `kind`). */
export async function deleteDatedRule(_prev: ActionResult | null, formData: FormData) {
  return managerAction(async ({ tx, userId }) => {
    const id = idFrom(formData);
    const kind = formData.get("kind");
    if (
      kind !== "price_adjustment" &&
      kind !== "capacity_override" &&
      kind !== "availability_rule"
    ) {
      throw new ActionError("That item can't be deleted here.");
    }
    const table = DELETABLE[kind];
    const [before] = await tx.select(table, eq(table.id, id));
    if (!before) throw new ActionError("That item no longer exists.");
    await tx.softDelete(table, eq(table.id, id));
    await audit(tx, {
      actorUserId: userId,
      action: "delete",
      entityType: kind,
      entityId: id,
      before,
    });
    return { ok: true, message: "Deleted." };
  });
}

// ── Bulk edit from the grid ──────────────────────────────────────────────────

/**
 * One "Edit dates" submission: each requested change becomes ordinary rows (a capacity
 * override per room type, a price adjustment per room type or the chosen plan, a stay rule per
 * room type and kind), all in one transaction.
 */
export async function applyBulkEdit(_prev: ActionResult | null, formData: FormData) {
  const parsed = parse(bulkEditFormSchema, formData);
  if (!parsed.success) return invalid(parsed.error);
  const edit = parsed.data;
  return managerAction(async ({ tx, userId }) => {
    const types = await tx.select(roomTypes, inArray(roomTypes.id, edit.roomTypeIds));
    if (types.length !== new Set(edit.roomTypeIds).size) {
      throw new ActionError("One of those room types no longer exists.", {
        roomTypeIds: "Pick the room types again.",
      });
    }
    if (edit.ratePlanId) {
      const plan = await requireRatePlan(tx, edit.ratePlanId);
      if (plan.roomTypeId !== edit.roomTypeIds[0]) {
        throw new ActionError("That rate plan belongs to another room type.", {
          ratePlanId: "Choose a plan of this room type.",
        });
      }
    }
    const range = {
      dateFrom: edit.dateFrom,
      dateTo: edit.dateTo,
      label: edit.label,
      repeatsYearly: edit.repeatsYearly,
    };
    const created: { entityType: string; id: string }[] = [];

    for (const type of types) {
      if (edit.rooms !== null) {
        const [row] = await tx
          .insert(capacityOverrides, { ...range, roomTypeId: type.id, roomsAvailable: edit.rooms })
          .returning({ id: capacityOverrides.id });
        created.push({ entityType: "capacity_override", id: row!.id });
      }
      if (edit.price) {
        const [row] = await tx
          .insert(priceAdjustments, {
            ...range,
            roomTypeId: type.id,
            ratePlanId: edit.ratePlanId,
            type: edit.price.type,
            value: edit.price.value,
            weekdayMask: edit.weekdayMask,
          })
          .returning({ id: priceAdjustments.id });
        created.push({ entityType: "price_adjustment", id: row!.id });
      }
      const kinds = [
        edit.close ? ("closed" as const) : null,
        edit.closedToArrival ? ("closed_to_arrival" as const) : null,
        edit.closedToDeparture ? ("closed_to_departure" as const) : null,
        edit.minNights !== null ? ("min_stay" as const) : null,
      ].filter((k) => k !== null);
      for (const kind of kinds) {
        const [row] = await tx
          .insert(availabilityRules, {
            ...range,
            kind,
            roomTypeId: type.id,
            ratePlanId: null,
            minNights: kind === "min_stay" ? edit.minNights : null,
          })
          .returning({ id: availabilityRules.id });
        created.push({ entityType: "availability_rule", id: row!.id });
      }
    }
    for (const c of created) {
      await audit(tx, {
        actorUserId: userId,
        action: "create",
        entityType: c.entityType,
        entityId: c.id,
        after: edit,
      });
    }
    return {
      ok: true,
      message: `${edit.label}: ${created.length} ${created.length === 1 ? "change" : "changes"} saved.`,
    };
  });
}
