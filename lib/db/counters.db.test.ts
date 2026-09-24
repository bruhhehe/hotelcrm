import { eq } from "drizzle-orm";
import { afterAll, beforeAll, expect, it } from "vitest";
import { connectTestDb, createTestHotel, describeDb } from "@/test/db";
import { nextCounter } from "./counters";
import * as schema from "./schema";
import { forHotel } from "./tenant";

describeDb("nextCounter", () => {
  const { db, pool } = connectTestDb();
  let hotelId: string;

  beforeAll(async () => {
    hotelId = (await createTestHotel(db, "Counter Hotel")).id;
  });

  afterAll(async () => {
    await db.delete(schema.hotels).where(eq(schema.hotels.id, hotelId));
    await pool.end();
  });

  it("counts from 1 per hotel and name", async () => {
    const h = forHotel(db, hotelId);
    expect(await nextCounter(h, "invoice")).toBe(1);
    expect(await nextCounter(h, "invoice")).toBe(2);
    expect(await nextCounter(h, "reservation")).toBe(1);
  });

  it("gives back a number whose transaction rolled back (gap-free)", async () => {
    await expect(
      db.transaction(async (tx) => {
        await nextCounter(forHotel(tx, hotelId), "invoice");
        throw new Error("abort");
      }),
    ).rejects.toThrow("abort");
    expect(await nextCounter(forHotel(db, hotelId), "invoice")).toBe(3);
  });

  it("hands out distinct numbers to concurrent transactions", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        db.transaction((tx) => nextCounter(forHotel(tx, hotelId), "reservation")),
      ),
    );
    expect(new Set(results).size).toBe(5);
    expect(Math.max(...results)).toBe(6);
  });
});
