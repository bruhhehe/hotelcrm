import { addDays, diffDays } from "@/lib/dates/calendar";
import type { NightlyPrice, PriceOverride } from "@/lib/db/schema/reservations";
import type { HotelSettings } from "@/lib/hotels/settings";
import { allocate, percentOf, taxFromInclusive, taxOnTop } from "@/lib/money/math";

/*
 * Stay pricing (spec §6.2), after the nights are priced (see nightly.ts):
 *
 *   rooms (stored nightly breakdown) + extras by pricing mode
 *   − one price change: a promo code, a manual discount, or a fixed price
 *   → tax per rate, included (back-calculated) or added on top
 *   → deposit / balance split.
 *
 * `quote()` takes the nightly breakdown as input rather than re-reading rate plans, so re-quoting
 * a booking from its stored breakdown ("Remove discount", edits) never picks up later rate
 * changes. All amounts are integer minor units.
 */

export type TaxMode = "included" | "added_on_top";

export type TaxRate = { name: string; rateBp: number; mode: TaxMode };

/** Used when a hotel has no tax rate set up. */
export const NO_TAX: TaxRate = { name: "No tax", rateBp: 0, mode: "included" };

export type ExtraPricingMode = "per_booking" | "per_night" | "per_guest" | "per_guest_per_night";

export type QuoteRoomInput = {
  roomTypeId: string;
  ratePlanId: string;
  /** "Classic Double · Bed & breakfast". */
  label: string;
  nights: readonly NightlyPrice[];
  tax: TaxRate;
};

export type QuoteExtraInput = {
  extraId: string;
  name: string;
  unitPrice: number;
  pricingMode: ExtraPricingMode;
  /**
   * For per-booking and per-night extras, how many (two parking spaces; default 1). For
   * per-guest extras, how many guests it's for (default everyone staying).
   */
  units?: number;
  tax: TaxRate;
};

export type PromoCode = {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  /** Basis points for "percentage", minor units off for "fixed". */
  value: number;
  /** Empty = every room type. */
  roomTypeIds: readonly string[];
  minNights: number | null;
  maxNights: number | null;
  /** Arrival dates the code is valid for (inclusive). */
  validFrom: string | null;
  validTo: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
};

/** At most one price change per reservation. */
export type PriceChange = { type: "promo"; promo: PromoCode } | PriceOverride;

export type DepositPolicy = HotelSettings["depositPolicy"];

export type QuoteInput = {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: readonly QuoteRoomInput[];
  extras?: readonly QuoteExtraInput[];
  change?: PriceChange | null;
  deposit: DepositPolicy;
  /** Hotel-local today: the balance is never due before it. */
  today: string;
};

export type QuoteLine = {
  kind: "room" | "extra";
  /** Room type id for rooms, extra id for extras. */
  refId: string;
  description: string;
  quantity: number;
  unitAmount: number;
  /** Before any discount. */
  total: number;
  /** This line's share of the discount (negative for a fixed price above the computed one). */
  discount: number;
  tax: TaxRate;
};

export type QuoteDiscount = {
  type: PriceChange["type"];
  label: string;
  /** Taken off the subtotal. Negative when a fixed price is higher than the computed price. */
  amount: number;
  promoCodeId: string | null;
};

export type PromoRejection =
  "inactive" | "used_up" | "not_yet_valid" | "expired" | "room_type" | "min_nights" | "max_nights";

export type TaxLine = TaxRate & {
  /** Amount the tax is worked out on (gross when included, net when added on top). */
  base: number;
  amount: number;
};

export type Quote = {
  nights: number;
  guests: number;
  rooms: (QuoteRoomInput & { total: number })[];
  extras: (QuoteExtraInput & { quantity: number; total: number })[];
  roomsTotal: number;
  extrasTotal: number;
  /** Rooms + extras, before any discount or added tax. */
  subtotal: number;
  discount: QuoteDiscount | null;
  /** A promo code that was asked for but doesn't apply, and why. No discount is given. */
  promoRejected: { code: string; reason: PromoRejection } | null;
  taxes: TaxLine[];
  /** Tax contained in the prices (UK/EU VAT). */
  taxIncluded: number;
  /** Tax added on top of the prices (North America). */
  taxAdded: number;
  /** What the guest pays. */
  total: number;
  /** Due online at booking. */
  deposit: number;
  /** Due later, on `balanceDueOn`. */
  balance: number;
  balanceDueOn: string;
  /** Every priced line with its discount share: the basis of invoices. */
  lines: QuoteLine[];
};

/** Quantity charged for an extra, from its pricing mode. */
export function extraQuantity(
  mode: ExtraPricingMode,
  { nights, guests, units }: { nights: number; guests: number; units?: number },
): number {
  switch (mode) {
    case "per_booking":
      return units ?? 1;
    case "per_night":
      return (units ?? 1) * nights;
    case "per_guest":
      return units ?? guests;
    case "per_guest_per_night":
      return (units ?? guests) * nights;
  }
}

/** Why a promo code can't be used on this stay, or null if it can. */
export function checkPromo(
  promo: PromoCode,
  stay: { checkIn: string; nights: number; roomTypeIds: readonly string[] },
): PromoRejection | null {
  if (!promo.isActive) return "inactive";
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return "used_up";
  if (promo.validFrom !== null && stay.checkIn < promo.validFrom) return "not_yet_valid";
  if (promo.validTo !== null && stay.checkIn > promo.validTo) return "expired";
  if (
    promo.roomTypeIds.length > 0 &&
    !stay.roomTypeIds.some((id) => promo.roomTypeIds.includes(id))
  ) {
    return "room_type";
  }
  if (promo.minNights !== null && stay.nights < promo.minNights) return "min_nights";
  if (promo.maxNights !== null && stay.nights > promo.maxNights) return "max_nights";
  return null;
}

export function describePromoRejection(reason: PromoRejection, promo: PromoCode): string {
  switch (reason) {
    case "inactive":
      return `${promo.code} isn't active.`;
    case "used_up":
      return `${promo.code} has been used the maximum number of times.`;
    case "not_yet_valid":
      return `${promo.code} is valid for arrivals from ${promo.validFrom}.`;
    case "expired":
      return `${promo.code} was valid for arrivals until ${promo.validTo}.`;
    case "room_type":
      return `${promo.code} can't be used on this room.`;
    case "min_nights":
      return `${promo.code} needs a stay of at least ${promo.minNights} nights.`;
    case "max_nights":
      return `${promo.code} is for stays of up to ${promo.maxNights} nights.`;
  }
}

/** Deposit due at booking and the balance's due date, from the hotel's deposit policy. */
export function splitDeposit(
  total: number,
  policy: DepositPolicy,
  { checkIn, today }: { checkIn: string; today: string },
): { deposit: number; balance: number; balanceDueOn: string } {
  const deposit =
    policy.type === "percentage"
      ? Math.min(total, percentOf(total, policy.value))
      : policy.type === "fixed"
        ? Math.min(total, policy.value)
        : 0;
  const due = policy.balanceDue === "days_before" ? addDays(checkIn, -policy.daysBefore) : checkIn;
  return { deposit, balance: total - deposit, balanceDueOn: due < today ? today : due };
}

const sum = (values: readonly number[]) => values.reduce((s, v) => s + v, 0);

function discountFor(
  change: PriceChange,
  lines: readonly QuoteLine[],
  subtotal: number,
): { amount: number; eligible: boolean[]; label: string } {
  const all = lines.map(() => true);
  switch (change.type) {
    case "promo": {
      const { promo } = change;
      const eligible = lines.map(
        (l) =>
          l.kind === "room" &&
          (promo.roomTypeIds.length === 0 || promo.roomTypeIds.includes(l.refId)),
      );
      const base = sum(lines.filter((_, i) => eligible[i]).map((l) => l.total));
      const amount =
        promo.type === "percentage"
          ? percentOf(base, Math.min(promo.value, 10000))
          : Math.min(promo.value, base);
      return { amount, eligible, label: `Promo code ${promo.code}` };
    }
    case "discount_bp": {
      const bp = Math.min(Math.max(change.value, 0), 10000);
      return { amount: percentOf(subtotal, bp), eligible: all, label: `Discount ${bp / 100}%` };
    }
    case "discount_amount":
      return {
        amount: Math.min(Math.max(change.value, 0), subtotal),
        eligible: all,
        label: "Discount",
      };
    case "fixed_total":
      return { amount: subtotal - Math.max(change.value, 0), eligible: all, label: "Fixed price" };
  }
}

const taxKey = (t: TaxRate) => `${t.mode}\u0000${t.rateBp}\u0000${t.name}`;

export function quote(input: QuoteInput): Quote {
  const nights = diffDays(input.checkIn, input.checkOut);
  if (nights < 1) throw new RangeError("quote: check-out must be after check-in");
  if (input.rooms.length === 0) throw new RangeError("quote: at least one room is required");
  const guests = input.adults + input.children;

  const rooms = input.rooms.map((r) => {
    if (r.nights.length !== nights) {
      throw new RangeError(`quote: ${r.label} has ${r.nights.length} nights priced, not ${nights}`);
    }
    return { ...r, total: sum(r.nights.map((n) => n.amount)) };
  });
  const extras = (input.extras ?? []).map((e) => {
    const quantity = extraQuantity(e.pricingMode, { nights, guests, units: e.units });
    return { ...e, quantity, total: quantity * e.unitPrice };
  });

  const lines: QuoteLine[] = [
    ...rooms.map((r): QuoteLine => ({
      kind: "room",
      refId: r.roomTypeId,
      description: `${r.label} · ${nights} ${nights === 1 ? "night" : "nights"}`,
      quantity: 1,
      unitAmount: r.total,
      total: r.total,
      discount: 0,
      tax: r.tax,
    })),
    ...extras.map((e): QuoteLine => ({
      kind: "extra",
      refId: e.extraId,
      description: e.name,
      quantity: e.quantity,
      unitAmount: e.unitPrice,
      total: e.total,
      discount: 0,
      tax: e.tax,
    })),
  ];
  const roomsTotal = sum(rooms.map((r) => r.total));
  const extrasTotal = sum(extras.map((e) => e.total));
  const subtotal = roomsTotal + extrasTotal;

  // One price change, spread over the lines it applies to so tax stays right per rate.
  let discount: QuoteDiscount | null = null;
  let promoRejected: Quote["promoRejected"] = null;
  const change = input.change ?? null;
  const rejection =
    change?.type === "promo"
      ? checkPromo(change.promo, {
          checkIn: input.checkIn,
          nights,
          roomTypeIds: rooms.map((r) => r.roomTypeId),
        })
      : null;
  if (change?.type === "promo" && rejection) {
    promoRejected = { code: change.promo.code, reason: rejection };
  } else if (change) {
    const { amount, eligible, label } = discountFor(change, lines, subtotal);
    const targets = lines.map((l, i) => ({ l, i })).filter(({ i }) => eligible[i]);
    const shares = allocate(
      amount,
      targets.map(({ l }) => l.total),
    );
    targets.forEach(({ l }, k) => {
      l.discount = shares[k]!;
    });
    if (amount !== 0) {
      discount = {
        type: change.type,
        label,
        amount,
        promoCodeId: change.type === "promo" ? change.promo.id : null,
      };
    }
  }

  // Tax per rate on what's charged after the discount.
  const groups = new Map<string, TaxLine>();
  for (const line of lines) {
    const key = taxKey(line.tax);
    const group = groups.get(key) ?? { ...line.tax, base: 0, amount: 0 };
    group.base += line.total - line.discount;
    groups.set(key, group);
  }
  const taxes = [...groups.values()]
    .map((g) => ({
      ...g,
      amount:
        g.mode === "included" ? taxFromInclusive(g.base, g.rateBp) : taxOnTop(g.base, g.rateBp),
    }))
    .filter((g) => g.rateBp > 0);
  const taxIncluded = sum(taxes.filter((t) => t.mode === "included").map((t) => t.amount));
  const taxAdded = sum(taxes.filter((t) => t.mode === "added_on_top").map((t) => t.amount));

  const total = subtotal - (discount?.amount ?? 0) + taxAdded;
  const split = splitDeposit(total, input.deposit, {
    checkIn: input.checkIn,
    today: input.today,
  });

  return {
    nights,
    guests,
    rooms,
    extras,
    roomsTotal,
    extrasTotal,
    subtotal,
    discount,
    promoRejected,
    taxes,
    taxIncluded,
    taxAdded,
    total,
    ...split,
    lines,
  };
}
