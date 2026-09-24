import "server-only";
import { and, eq, inArray, lt, or, sql, type SQL } from "drizzle-orm";
import type { HotelDb } from "@/lib/db/tenant";
import {
  extras as extrasTable,
  priceAdjustments,
  promoCodes,
  ratePlans,
  roomTypes,
  taxRates,
} from "@/lib/db/schema";
import type { PriceOverride } from "@/lib/db/schema/reservations";
import type { StayViolation } from "@/lib/inventory/availability";
import { type HotelBasics, loadHotelBasics, stayViolations } from "@/lib/inventory/queries";
import { type NightRate, nightlyRates, type PriceAdjustmentRow } from "./nightly";
import {
  NO_TAX,
  type PriceChange,
  type PromoCode,
  type Quote,
  quote,
  type QuoteExtraInput,
  type TaxRate,
} from "./quote";

/*
 * Database side of pricing: loads a rate plan, its adjustments, extras, promo code and tax
 * rates for one hotel, and prices a stay with the pure engine. Used by the availability grid,
 * the price check, and (from Phase 4) reservation create and edit.
 */

/** Adjustments that could price a night in [from, to) (SQL twin of `mayOverlap`). */
export function loadAdjustments(hdb: HotelDb, from: string, to: string) {
  return hdb.select(
    priceAdjustments,
    or(
      and(eq(priceAdjustments.repeatsYearly, true), lt(priceAdjustments.dateFrom, to)),
      and(lt(priceAdjustments.dateFrom, to), sql`${priceAdjustments.dateTo} >= ${from}`),
    ) as SQL,
  );
}

/** The hotel's default tax rate, used for room nights. */
export async function loadTaxRates(hdb: HotelDb): Promise<{
  byId: Map<string, TaxRate>;
  defaultRate: TaxRate;
}> {
  const rows = await hdb.select(taxRates);
  const byId = new Map(
    rows.map((r) => [r.id, { name: r.name, rateBp: r.rateBp, mode: r.mode }] as const),
  );
  const fallback = rows.find((r) => r.isDefault);
  return { byId, defaultRate: fallback ? byId.get(fallback.id)! : NO_TAX };
}

export type PriceStayRequest = {
  roomTypeId: string;
  ratePlanId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  extras?: readonly { extraId: string; units?: number }[];
  /** A code typed by staff or a guest; matched case-insensitively. */
  promoCode?: string | null;
  /** A manual discount or fixed price (staff only). Ignored when a promo code is given. */
  override?: PriceOverride | null;
};

export type PricedStay = {
  /** Null when the dates can't be priced at all (check-out not after check-in). */
  quote: Quote | null;
  /** Night-by-night rate with the adjustment that set it: what's stored on the booking. */
  nights: NightRate[];
  violations: StayViolation[];
  /** A code that doesn't exist for this hotel. */
  unknownPromoCode: string | null;
};

export class PricingInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingInputError";
  }
}

/** Promo codes are stored upper-case; staff and guests type them any way. */
export function normalisePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function findPromoCode(hdb: HotelDb, code: string): Promise<PromoCode | null> {
  const [row] = await hdb.select(promoCodes, eq(promoCodes.code, normalisePromoCode(code)));
  return row ?? null;
}

/**
 * Price a stay on one room type and rate plan, and say whether it can be sold. The quote is
 * returned even when rules are broken, so staff can see the price of a stay they're about to
 * book through a restriction.
 */
export async function priceStay(
  hdb: HotelDb,
  request: PriceStayRequest,
  hotel?: HotelBasics,
): Promise<PricedStay> {
  const basics = hotel ?? (await loadHotelBasics(hdb));
  const [plan] = await hdb.select(
    ratePlans,
    and(eq(ratePlans.id, request.ratePlanId), eq(ratePlans.roomTypeId, request.roomTypeId)),
  );
  const [type] = await hdb.select(roomTypes, eq(roomTypes.id, request.roomTypeId));
  if (!plan || !type) throw new PricingInputError("That room type and rate plan don't match.");

  const violations = await stayViolations(
    hdb,
    {
      roomTypeId: type.id,
      ratePlanId: plan.id,
      checkIn: request.checkIn,
      checkOut: request.checkOut,
      guests: request.adults + request.children,
    },
    basics,
  );
  if (violations.some((v) => v.code === "invalid_dates" || v.code === "too_long")) {
    return { quote: null, nights: [], violations, unknownPromoCode: null };
  }

  const adjustments: PriceAdjustmentRow[] = await loadAdjustments(
    hdb,
    request.checkIn,
    request.checkOut,
  );
  const nights = nightlyRates(plan, adjustments, request.checkIn, request.checkOut);
  const taxes = await loadTaxRates(hdb);

  const wanted = request.extras ?? [];
  const extraRows =
    wanted.length > 0
      ? await hdb.select(
          extrasTable,
          inArray(
            extrasTable.id,
            wanted.map((e) => e.extraId),
          ),
        )
      : [];
  const extras: QuoteExtraInput[] = wanted.map((w) => {
    const row = extraRows.find((e) => e.id === w.extraId);
    if (!row) throw new PricingInputError("One of the extras no longer exists.");
    return {
      extraId: row.id,
      name: row.name,
      unitPrice: row.price,
      pricingMode: row.pricingMode,
      units: w.units,
      tax: (row.taxRateId ? taxes.byId.get(row.taxRateId) : undefined) ?? taxes.defaultRate,
    };
  });

  let change: PriceChange | null = request.override ?? null;
  let unknownPromoCode: string | null = null;
  if (request.promoCode?.trim()) {
    const promo = await findPromoCode(hdb, request.promoCode);
    if (promo) change = { type: "promo", promo };
    else {
      unknownPromoCode = normalisePromoCode(request.promoCode);
      change = null;
    }
  }

  const priced = quote({
    checkIn: request.checkIn,
    checkOut: request.checkOut,
    adults: request.adults,
    children: request.children,
    rooms: [
      {
        roomTypeId: type.id,
        ratePlanId: plan.id,
        label: `${type.name} · ${plan.name}`,
        nights: nights.map((n) => ({ date: n.date, amount: n.amount })),
        tax: taxes.defaultRate,
      },
    ],
    extras,
    change,
    deposit: basics.settings.depositPolicy,
    today: basics.today,
  });
  return { quote: priced, nights, violations, unknownPromoCode };
}
