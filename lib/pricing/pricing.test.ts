import { describe, expect, it } from "vitest";
import { eachNight } from "@/lib/dates/calendar";
import {
  applyAdjustment,
  nightlyRates,
  type PriceAdjustmentRow,
  type RatePlanPricing,
  winningAdjustment,
} from "./nightly";
import {
  checkPromo,
  describePromoRejection,
  type DepositPolicy,
  extraQuantity,
  NO_TAX,
  type PromoCode,
  quote,
  type QuoteInput,
  splitDeposit,
  type TaxRate,
} from "./quote";

const VAT: TaxRate = { name: "VAT 20%", rateBp: 2000, mode: "included" };
const SALES_TAX: TaxRate = { name: "Sales tax 13%", rateBp: 1300, mode: "added_on_top" };
const DEPOSIT_30: DepositPolicy = {
  type: "percentage",
  value: 3000,
  balanceDue: "on_arrival",
  daysBefore: 7,
};

const plan: RatePlanPricing = { id: "rp_bnb", roomTypeId: "rt_classic", baseNightlyPrice: 14900 };

let seq = 0;
const adj = (over: Partial<PriceAdjustmentRow>): PriceAdjustmentRow => ({
  id: `adj_${String(++seq).padStart(3, "0")}`,
  ratePlanId: null,
  roomTypeId: null,
  dateFrom: "2026-10-01",
  dateTo: "2026-10-31",
  repeatsYearly: false,
  weekdayMask: 127,
  type: "percentage",
  value: 1000,
  label: "Adjustment",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  ...over,
});

const flat = (checkIn: string, checkOut: string, amount: number) =>
  eachNight(checkIn, checkOut).map((date) => ({ date, amount }));

describe("nightly rates", () => {
  it("uses the base price when nothing applies", () => {
    const rates = nightlyRates(plan, [], "2026-10-01", "2026-10-03");
    expect(rates).toEqual([
      { date: "2026-10-01", base: 14900, amount: 14900, adjustment: null },
      { date: "2026-10-02", base: 14900, amount: 14900, adjustment: null },
    ]);
  });

  it("applies percentage, fixed and override adjustments", () => {
    expect(applyAdjustment(14900, adj({ type: "percentage", value: 2000 }))).toBe(17880);
    expect(applyAdjustment(14900, adj({ type: "percentage", value: -1000 }))).toBe(13410);
    expect(applyAdjustment(12345, adj({ type: "percentage", value: 1250 }))).toBe(13888); // 1543.125 → 1543
    expect(applyAdjustment(14900, adj({ type: "fixed", value: 2500 }))).toBe(17400);
    expect(applyAdjustment(14900, adj({ type: "fixed", value: -20000 }))).toBe(0);
    expect(applyAdjustment(14900, adj({ type: "override", value: 9900 }))).toBe(9900);
  });

  it("ranks override over fixed over percentage, whatever the creation order", () => {
    const pct = adj({ type: "percentage", createdAt: new Date("2026-06-01") });
    const fixed = adj({ type: "fixed", value: 1000, createdAt: new Date("2026-03-01") });
    const override = adj({ type: "override", value: 9900, createdAt: new Date("2026-01-01") });
    expect(winningAdjustment([pct, fixed, override])).toBe(override);
    expect(winningAdjustment([pct, fixed])).toBe(fixed);
    expect(winningAdjustment([pct])).toBe(pct);
    expect(winningAdjustment([])).toBeNull();
  });

  it("lets the later-created adjustment win a tie, then the higher id", () => {
    const older = adj({ value: 1000, createdAt: new Date("2026-01-01") });
    const newer = adj({ value: 2000, createdAt: new Date("2026-02-01") });
    expect(winningAdjustment([newer, older])).toBe(newer);
    expect(winningAdjustment([older, newer])).toBe(newer);
    const a = adj({ id: "adj_a", createdAt: new Date("2026-02-01") });
    const b = adj({ id: "adj_b", createdAt: new Date("2026-02-01") });
    expect(winningAdjustment([b, a])).toBe(b);
    expect(winningAdjustment([a, b])).toBe(b);
  });

  it("honours the weekday mask: a weekend supplement on Friday and Saturday nights", () => {
    const weekend = adj({ type: "fixed", value: 3000, weekdayMask: 0b0110000, label: "Weekend" });
    // Thu 1 Oct 2026 → Mon 5 Oct: Thu, Fri, Sat, Sun nights.
    const rates = nightlyRates(plan, [weekend], "2026-10-01", "2026-10-05");
    expect(rates.map((r) => r.amount)).toEqual([14900, 17900, 17900, 14900]);
    expect(rates[1]!.adjustment?.label).toBe("Weekend");
  });

  it("scopes adjustments to the rate plan or room type", () => {
    const rates = (adjustments: PriceAdjustmentRow[]) =>
      nightlyRates(plan, adjustments, "2026-10-01", "2026-10-02")[0]!.amount;
    expect(rates([adj({ roomTypeId: "rt_classic", type: "fixed", value: 100 })])).toBe(15000);
    expect(rates([adj({ roomTypeId: "rt_king", type: "fixed", value: 100 })])).toBe(14900);
    expect(rates([adj({ ratePlanId: "rp_bnb", type: "fixed", value: 100 })])).toBe(15000);
    expect(rates([adj({ ratePlanId: "rp_room_only", type: "fixed", value: 100 })])).toBe(14900);
  });

  it("prices each night on its own across a season boundary", () => {
    const summer = adj({
      dateFrom: "2025-07-01",
      dateTo: "2025-08-31",
      repeatsYearly: true,
      value: 2000,
      label: "Summer",
    });
    const rates = nightlyRates(plan, [summer], "2026-08-30", "2026-09-02");
    expect(rates.map((r) => r.amount)).toEqual([17880, 17880, 14900]);
  });
});

describe("extras", () => {
  it("multiplies by nights and guests per pricing mode", () => {
    const ctx = { nights: 3, guests: 2 };
    expect(extraQuantity("per_booking", ctx)).toBe(1);
    expect(extraQuantity("per_night", ctx)).toBe(3);
    expect(extraQuantity("per_guest", ctx)).toBe(2);
    expect(extraQuantity("per_guest_per_night", ctx)).toBe(6);
  });

  it("takes units as a count, or as how many guests for per-guest extras", () => {
    expect(extraQuantity("per_booking", { nights: 3, guests: 2, units: 2 })).toBe(2);
    expect(extraQuantity("per_night", { nights: 3, guests: 2, units: 2 })).toBe(6);
    expect(extraQuantity("per_guest", { nights: 3, guests: 4, units: 1 })).toBe(1);
    expect(extraQuantity("per_guest_per_night", { nights: 3, guests: 4, units: 1 })).toBe(3);
  });
});

const promo = (over: Partial<PromoCode> = {}): PromoCode => ({
  id: "promo_1",
  code: "LAKES10",
  type: "percentage",
  value: 1000,
  roomTypeIds: [],
  minNights: null,
  maxNights: null,
  validFrom: null,
  validTo: null,
  maxUses: null,
  usedCount: 0,
  isActive: true,
  ...over,
});

describe("promo codes", () => {
  const stay = { checkIn: "2026-10-01", nights: 2, roomTypeIds: ["rt_classic"] };

  it("accepts a valid code", () => {
    expect(checkPromo(promo(), stay)).toBeNull();
  });

  it("rejects inactive, used up, out of window, wrong room and wrong length", () => {
    expect(checkPromo(promo({ isActive: false }), stay)).toBe("inactive");
    expect(checkPromo(promo({ maxUses: 5, usedCount: 5 }), stay)).toBe("used_up");
    expect(checkPromo(promo({ maxUses: 5, usedCount: 4 }), stay)).toBeNull();
    expect(checkPromo(promo({ validFrom: "2026-10-02" }), stay)).toBe("not_yet_valid");
    expect(checkPromo(promo({ validTo: "2026-09-30" }), stay)).toBe("expired");
    expect(checkPromo(promo({ validFrom: "2026-10-01", validTo: "2026-10-01" }), stay)).toBeNull();
    expect(checkPromo(promo({ roomTypeIds: ["rt_king"] }), stay)).toBe("room_type");
    expect(checkPromo(promo({ minNights: 3 }), stay)).toBe("min_nights");
    expect(checkPromo(promo({ maxNights: 1 }), stay)).toBe("max_nights");
  });

  it("explains a rejection", () => {
    expect(describePromoRejection("min_nights", promo({ minNights: 3 }))).toBe(
      "LAKES10 needs a stay of at least 3 nights.",
    );
  });
});

describe("deposit split", () => {
  it("takes a percentage deposit, rounded to the penny, balance due on arrival", () => {
    expect(splitDeposit(12345, DEPOSIT_30, { checkIn: "2026-10-01", today: "2026-09-24" })).toEqual(
      { deposit: 3704, balance: 8641, balanceDueOn: "2026-10-01" },
    );
  });

  it("caps a fixed deposit at the total", () => {
    const fixed: DepositPolicy = { ...DEPOSIT_30, type: "fixed", value: 5000 };
    expect(splitDeposit(4000, fixed, { checkIn: "2026-10-01", today: "2026-09-24" })).toEqual({
      deposit: 4000,
      balance: 0,
      balanceDueOn: "2026-10-01",
    });
  });

  it("asks for no deposit when the policy is none", () => {
    const none: DepositPolicy = { ...DEPOSIT_30, type: "none" };
    expect(splitDeposit(10000, none, { checkIn: "2026-10-01", today: "2026-09-24" }).deposit).toBe(
      0,
    );
  });

  it("dates a days-before balance, never earlier than today", () => {
    const early: DepositPolicy = { ...DEPOSIT_30, balanceDue: "days_before", daysBefore: 14 };
    expect(
      splitDeposit(10000, early, { checkIn: "2026-11-01", today: "2026-09-24" }).balanceDueOn,
    ).toBe("2026-10-18");
    expect(
      splitDeposit(10000, early, { checkIn: "2026-10-01", today: "2026-09-24" }).balanceDueOn,
    ).toBe("2026-09-24");
  });
});

describe("quote", () => {
  const input = (over: Partial<QuoteInput> = {}): QuoteInput => ({
    checkIn: "2026-10-01",
    checkOut: "2026-10-04",
    adults: 2,
    children: 0,
    rooms: [
      {
        roomTypeId: "rt_classic",
        ratePlanId: "rp_bnb",
        label: "Classic Double · Bed & breakfast",
        nights: flat("2026-10-01", "2026-10-04", 14900),
        tax: VAT,
      },
    ],
    extras: [],
    deposit: DEPOSIT_30,
    today: "2026-09-24",
    ...over,
  });

  it("sums the nights, back-calculates included VAT and splits the deposit", () => {
    const q = quote(input());
    expect(q.nights).toBe(3);
    expect(q.roomsTotal).toBe(44700);
    expect(q.subtotal).toBe(44700);
    expect(q.total).toBe(44700);
    expect(q.taxIncluded).toBe(7450); // 44700 × 20 / 120
    expect(q.taxAdded).toBe(0);
    expect(q.taxes).toEqual([{ ...VAT, base: 44700, amount: 7450 }]);
    expect(q.deposit).toBe(13410);
    expect(q.balance).toBe(31290);
    expect(q.deposit + q.balance).toBe(q.total);
  });

  it("prices extras per mode and itemises tax per rate", () => {
    const q = quote(
      input({
        extras: [
          {
            extraId: "x_breakfast",
            name: "Full English breakfast",
            unitPrice: 1450,
            pricingMode: "per_guest_per_night",
            tax: VAT,
          },
          {
            extraId: "x_parking",
            name: "Parking",
            unitPrice: 800,
            pricingMode: "per_night",
            tax: NO_TAX,
          },
          {
            extraId: "x_late",
            name: "Late checkout",
            unitPrice: 2500,
            pricingMode: "per_booking",
            tax: VAT,
          },
        ],
      }),
    );
    expect(q.extras.map((e) => [e.quantity, e.total])).toEqual([
      [6, 8700],
      [3, 2400],
      [1, 2500],
    ]);
    expect(q.extrasTotal).toBe(13600);
    expect(q.total).toBe(58300);
    // VAT on rooms + breakfast + late checkout; parking is zero-rated and not listed.
    expect(q.taxes).toEqual([{ ...VAT, base: 55900, amount: 9317 }]);
  });

  it("adds tax on top for North-American hotels", () => {
    const q = quote(
      input({
        rooms: [{ ...input().rooms[0]!, tax: SALES_TAX }],
      }),
    );
    expect(q.subtotal).toBe(44700);
    expect(q.taxAdded).toBe(5811); // 13% of 44700
    expect(q.taxIncluded).toBe(0);
    expect(q.total).toBe(50511);
  });

  it("applies a percentage promo to the eligible rooms only, not extras", () => {
    const q = quote(
      input({
        extras: [
          {
            extraId: "x_late",
            name: "Late checkout",
            unitPrice: 2500,
            pricingMode: "per_booking",
            tax: VAT,
          },
        ],
        change: { type: "promo", promo: promo() },
      }),
    );
    expect(q.discount).toEqual({
      type: "promo",
      label: "Promo code LAKES10",
      amount: 4470,
      promoCodeId: "promo_1",
    });
    expect(q.total).toBe(44700 + 2500 - 4470);
    expect(q.lines.find((l) => l.kind === "extra")?.discount).toBe(0);
  });

  it("caps a fixed promo at the room total", () => {
    const q = quote(
      input({
        checkOut: "2026-10-02",
        rooms: [{ ...input().rooms[0]!, nights: flat("2026-10-01", "2026-10-02", 1500) }],
        change: { type: "promo", promo: promo({ type: "fixed", value: 2000, code: "WELCOME20" }) },
      }),
    );
    expect(q.discount?.amount).toBe(1500);
    expect(q.total).toBe(0);
    expect(q.deposit).toBe(0);
  });

  it("gives no discount for a rejected promo, and says why", () => {
    const q = quote(input({ change: { type: "promo", promo: promo({ minNights: 5 }) } }));
    expect(q.discount).toBeNull();
    expect(q.promoRejected).toEqual({ code: "LAKES10", reason: "min_nights" });
    expect(q.total).toBe(44700);
  });

  it("only discounts rooms the promo is scoped to in a multi-room stay", () => {
    const q = quote(
      input({
        rooms: [
          input().rooms[0]!,
          {
            roomTypeId: "rt_king",
            ratePlanId: "rp_king",
            label: "Fell View King · Room only",
            nights: flat("2026-10-01", "2026-10-04", 16500),
            tax: VAT,
          },
        ],
        change: { type: "promo", promo: promo({ roomTypeIds: ["rt_king"] }) },
      }),
    );
    expect(q.discount?.amount).toBe(4950);
    expect(q.lines.map((l) => l.discount)).toEqual([0, 4950]);
  });

  it("applies a manual percentage or amount discount across rooms and extras", () => {
    const withExtra = {
      extras: [
        {
          extraId: "x_spa",
          name: "Spa",
          unitPrice: 2000,
          pricingMode: "per_guest" as const,
          tax: VAT,
        },
      ],
    };
    const pct = quote(input({ ...withExtra, change: { type: "discount_bp", value: 1000 } }));
    expect(pct.subtotal).toBe(48700);
    expect(pct.discount?.amount).toBe(4870);
    expect(pct.lines.map((l) => l.discount)).toEqual([4470, 400]);

    const amount = quote(
      input({ ...withExtra, change: { type: "discount_amount", value: 99999 } }),
    );
    expect(amount.discount?.amount).toBe(48700);
    expect(amount.total).toBe(0);
  });

  it("sets a fixed price, above or below the computed one", () => {
    const lower = quote(input({ change: { type: "fixed_total", value: 40000 } }));
    expect(lower.total).toBe(40000);
    expect(lower.discount).toMatchObject({ type: "fixed_total", amount: 4700 });
    expect(lower.taxIncluded).toBe(6667);

    const higher = quote(input({ change: { type: "fixed_total", value: 50000 } }));
    expect(higher.total).toBe(50000);
    expect(higher.discount?.amount).toBe(-5300);
  });

  it("keeps tax right per rate when a discount spans two rates", () => {
    const q = quote(
      input({
        rooms: [{ ...input().rooms[0]!, tax: VAT }],
        extras: [
          {
            extraId: "x_zero",
            name: "Donation",
            unitPrice: 3000,
            pricingMode: "per_booking",
            tax: NO_TAX,
          },
        ],
        change: { type: "discount_amount", value: 1000 },
      }),
    );
    // 1000 split 44700 : 3000 → 937 : 63 (largest remainder).
    expect(q.lines.map((l) => l.discount)).toEqual([937, 63]);
    expect(q.taxes).toEqual([{ ...VAT, base: 43763, amount: 7294 }]);
    expect(q.total).toBe(46700);
  });

  it("re-quotes from the stored breakdown: rate changes don't touch history", () => {
    const stored = flat("2026-10-01", "2026-10-04", 14900);
    const booked = quote(input({ change: { type: "promo", promo: promo() } }));
    // The rate plan has since gone up, but removing the discount re-prices the stored nights.
    const removed = quote(input({ rooms: [{ ...input().rooms[0]!, nights: stored }] }));
    expect(removed.total).toBe(booked.subtotal);
    expect(removed.discount).toBeNull();
  });

  it("refuses a breakdown that doesn't match the stay", () => {
    expect(() =>
      quote(
        input({ rooms: [{ ...input().rooms[0]!, nights: flat("2026-10-01", "2026-10-03", 1) }] }),
      ),
    ).toThrow(RangeError);
    expect(() => quote(input({ checkOut: "2026-10-01" }))).toThrow(RangeError);
    expect(() => quote(input({ rooms: [] }))).toThrow(RangeError);
  });

  it("never loses a penny: lines, discount and tax always reconcile", () => {
    // Awkward prices and a discount that doesn't divide evenly.
    for (let price = 9901; price < 10030; price += 7) {
      for (const change of [
        { type: "discount_bp" as const, value: 333 },
        { type: "discount_amount" as const, value: 1001 },
        { type: "fixed_total" as const, value: 25555 },
      ]) {
        const q = quote(
          input({
            rooms: [{ ...input().rooms[0]!, nights: flat("2026-10-01", "2026-10-04", price) }],
            extras: [
              {
                extraId: "x1",
                name: "A",
                unitPrice: 333,
                pricingMode: "per_guest_per_night",
                tax: VAT,
              },
              { extraId: "x2", name: "B", unitPrice: 777, pricingMode: "per_booking", tax: NO_TAX },
            ],
            change,
          }),
        );
        const lineTotal = q.lines.reduce((s, l) => s + l.total - l.discount, 0);
        expect(lineTotal).toBe(q.total);
        expect(q.subtotal - (q.discount?.amount ?? 0)).toBe(q.total);
        expect(q.deposit + q.balance).toBe(q.total);
        expect(q.lines.every((l) => l.total - l.discount >= 0)).toBe(true);
      }
    }
  });
});
