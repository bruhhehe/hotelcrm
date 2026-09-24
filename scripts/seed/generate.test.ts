import { describe, expect, it } from "vitest";
import { addDays, rangesOverlap } from "@/lib/dates/calendar";
import { taxFromInclusive } from "@/lib/money/math";
import { OUT_OF_ORDER_ROOM } from "./data";
import { generateSeed } from "./generate";

const cases = [
  { today: "2026-09-24", now: new Date("2026-09-24T18:30:00Z") },
  { today: "2026-01-02", now: new Date("2026-01-02T08:05:00Z") },
  { today: "2026-07-15", now: new Date("2026-07-15T12:00:00Z") },
];

describe.each(cases)("generateSeed on $today", ({ today, now }) => {
  const plan = generateSeed({ today, now });
  const byId = new Map(plan.reservations.map((r) => [r.id, r]));
  const paidBy = (reservationId: string) =>
    plan.payments
      .filter((p) => p.reservationId === reservationId)
      .reduce((s, p) => s + p.amount, 0);

  it("matches spec §7 counts", () => {
    expect(plan.roomTypes).toHaveLength(5);
    expect(plan.rooms).toHaveLength(14);
    expect(plan.ratePlans).toHaveLength(15);
    expect(plan.priceAdjustments).toHaveLength(2);
    expect(plan.priceAdjustments.filter((a) => a.repeatsYearly)).toHaveLength(1);
    expect(plan.extras).toHaveLength(6);
    expect(plan.promoCodes).toHaveLength(2);
    expect(plan.packages).toHaveLength(1);
    expect(plan.guests).toHaveLength(40);
    expect(plan.reservations.length).toBeGreaterThanOrEqual(110);
    expect(plan.reservations.length).toBeLessThanOrEqual(130);
    expect(plan.reservations.filter((r) => r.status === "pending_validation")).toHaveLength(3);
    expect(new Set(plan.memberships.map((m) => m.role))).toEqual(
      new Set(["owner", "manager", "reception", "housekeeping", "readonly"]),
    );
  });

  it("covers every status and spans -60…+90 days", () => {
    const statuses = new Set(plan.reservations.map((r) => r.status));
    for (const s of [
      "pending_validation",
      "confirmed",
      "checked_in",
      "checked_out",
      "cancelled",
      "no_show",
    ]) {
      expect(statuses).toContain(s);
    }
    const checkIns = plan.reservations.map((r) => r.checkIn).sort();
    expect(checkIns[0]! >= addDays(today, -60)).toBe(true);
    expect(checkIns.at(-1)! <= addDays(today, 90)).toBe(true);
  });

  it("gives today a real front desk: arrivals, departures, stays and new bookings", () => {
    const arrivals = plan.reservations.filter(
      (r) => r.checkIn === today && r.status !== "cancelled",
    );
    const departures = plan.reservations.filter(
      (r) => r.checkOut === today && r.status !== "cancelled",
    );
    expect(arrivals).toHaveLength(8);
    expect(arrivals.filter((r) => r.status === "checked_in")).toHaveLength(5);
    expect(departures).toHaveLength(3);
    expect(departures.filter((r) => r.status === "checked_out")).toHaveLength(1);
    const startOfDay = new Date(`${today}T00:00:00Z`).getTime() - 3_600_000;
    expect(
      plan.reservations.filter((r) => (r.createdAt as Date).getTime() >= startOfDay).length,
    ).toBeGreaterThanOrEqual(11);
  });

  it("never double-books a room and keeps the out-of-order room empty today", () => {
    const active = plan.reservationRooms.filter((rr) => rr.isActive && rr.roomId);
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i]!;
        const b = active[j]!;
        if (a.roomId !== b.roomId) continue;
        expect(
          rangesOverlap(a.checkIn, a.checkOut, b.checkIn, b.checkOut),
          `${a.id} vs ${b.id}`,
        ).toBe(false);
      }
    }
    const room7 = plan.rooms.find((r) => r.name === OUT_OF_ORDER_ROOM)!;
    expect(room7.status).toBe("out_of_order");
    expect(
      active.some(
        (rr) =>
          rr.roomId === room7.id &&
          rangesOverlap(rr.checkIn, rr.checkOut, today, addDays(today, 1)),
      ),
    ).toBe(false);
  });

  it("keeps money consistent with each status", () => {
    for (const r of plan.reservations) {
      const paid = paidBy(r.id);
      expect(paid, r.reference).toBeGreaterThanOrEqual(0);
      expect(paid, r.reference).toBeLessThanOrEqual(r.totalAmount!);
      if (r.status === "pending_validation") expect(paid).toBe(0);
      if (r.status === "checked_out") expect(paid).toBe(r.totalAmount);
    }
    for (const p of plan.payments) {
      if (p.kind === "refund") expect(p.amount).toBeLessThan(0);
      else expect(p.amount).toBeGreaterThan(0);
    }
  });

  it("numbers issued invoices 1…N in issue order with correct VAT", () => {
    const numbers = plan.invoices.map((i) => i.number);
    expect(numbers).toEqual(numbers.map((_, i) => i + 1));
    const issued = plan.invoices.map((i) => (i.issuedAt as Date).getTime());
    expect([...issued].sort((a, b) => a - b)).toEqual(issued);
    for (const inv of plan.invoices) {
      const lines = inv.lines!;
      expect(inv.total).toBe(lines.reduce((s, l) => s + l.total, 0));
      for (const l of lines)
        expect(l.taxAmount).toBe(
          Math.sign(l.total) * taxFromInclusive(Math.abs(l.total), l.taxRateBp),
        );
      expect(paidBy(inv.reservationId!)).toBeGreaterThanOrEqual(inv.total!);
    }
    expect(plan.hotelCounters.find((c) => c.name === "invoice")?.value).toBe(plan.invoices.length);
  });

  it("uses unique LDG references in booking order and a matching counter", () => {
    const refs = plan.reservations.map((r) => r.reference);
    expect(new Set(refs).size).toBe(refs.length);
    expect(refs[0]).toBe("LDG-000001");
    expect(plan.hotelCounters.find((c) => c.name === "reservation")?.value).toBe(refs.length);
  });

  it("never dates anything in the future", () => {
    const limit = now.getTime();
    for (const r of plan.reservations)
      expect((r.createdAt as Date).getTime()).toBeLessThanOrEqual(limit);
    for (const p of plan.payments)
      expect((p.receivedAt as Date).getTime()).toBeLessThanOrEqual(limit);
    for (const h of plan.reservationStatusHistory)
      expect((h.at as Date).getTime()).toBeLessThanOrEqual(limit);
  });

  it("flags a habitual no-show and keeps the blacklisted guest out of future stays", () => {
    expect(plan.guests.some((g) => (g.noShowCount ?? 0) >= 3)).toBe(true);
    const banned = plan.guests.find((g) => g.isBlacklisted)!;
    expect(
      plan.reservations.filter((r) => r.guestId === banned.id && r.checkIn >= today),
    ).toHaveLength(0);
  });

  it("uses only reserved example domains and drama-range numbers for guests", () => {
    for (const g of plan.guests) {
      expect(g.email).toMatch(/@example\.(com|org|net)$/);
      if (g.phone) expect(g.phone).toMatch(/^\+447700900\d{3}$/);
    }
  });

  it("links every history entry and extra to a real reservation", () => {
    for (const h of plan.reservationStatusHistory) expect(byId.has(h.reservationId)).toBe(true);
    for (const e of plan.reservationExtras) expect(byId.has(e.reservationId)).toBe(true);
  });
});
