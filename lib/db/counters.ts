import { sql } from "drizzle-orm";
import { hotelCounters } from "./schema";
import type { HotelDb } from "./tenant";

export type CounterName = "reservation" | "invoice";

/**
 * Next value of a per-hotel sequence. Call it inside the transaction that writes the row using
 * the number: the upsert locks the counter row until commit, and a rollback undoes the
 * increment, so invoice numbers stay gap-free and concurrent writers queue instead of colliding.
 */
export async function nextCounter(tx: HotelDb, name: CounterName): Promise<number> {
  const [row] = await tx.db
    .insert(hotelCounters)
    .values({ hotelId: tx.hotelId, name, value: 1 })
    .onConflictDoUpdate({
      target: [hotelCounters.hotelId, hotelCounters.name],
      set: { value: sql`${hotelCounters.value} + 1` },
    })
    .returning({ value: hotelCounters.value });
  if (!row) throw new Error(`Counter ${name} did not return a value`);
  return row.value;
}
