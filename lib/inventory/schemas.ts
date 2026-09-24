import { z } from "zod";
import { diffDays } from "@/lib/dates/calendar";
import { parseMoney, parsePercent } from "@/lib/money/parse";
import { ALL_WEEKDAYS } from "./date-rules";

/*
 * Zod schemas for the inventory forms (Settings → Rooms and Rates, and the Availability tabs).
 * They take `formObject(formData)` output: every value is a string, a string array, or missing.
 * Money comes back in minor units and percentages in basis points.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const requiredText = (max: number, message: string) =>
  z.string({ error: message }).trim().min(1, message).max(max, `Keep it under ${max} characters.`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : null));

/** A checkbox posts "on" when ticked and nothing when not. */
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

const wholeNumber = (min: number, max: number, message: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : v),
    z.number({ error: message }).int(message).min(min, message).max(max, message),
  );

/** Empty means "not set". */
const optionalWholeNumber = (min: number, max: number, message: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : Number(v)) : v),
    z.number({ error: message }).int(message).min(min, message).max(max, message).optional(),
  );

const isoDate = (message: string) =>
  z
    .string({ error: message })
    .regex(ISO_DATE, message)
    .refine((v) => {
      const d = new Date(`${v}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
    }, message);

const id = z.string().trim().min(1).max(64);

const optionalId = z
  .string()
  .trim()
  .max(64)
  .optional()
  .transform((v) => (v ? v : null));

const money = (message: string, { allowNegative = false } = {}) =>
  z.string({ error: message }).transform((v, ctx) => {
    const minor = parseMoney(v, { allowNegative });
    if (minor === null) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return minor;
  });

/** Longest range any rule, override or adjustment may span. */
const MAX_RANGE_DAYS = 3 * 366;

const dateRange = {
  dateFrom: isoDate("Choose a start date."),
  dateTo: isoDate("Choose an end date."),
};

function checkRange(v: { dateFrom: string; dateTo: string }, ctx: z.RefinementCtx) {
  if (v.dateTo < v.dateFrom) {
    ctx.addIssue({ code: "custom", path: ["dateTo"], message: "End on or after the start date." });
  } else if (diffDays(v.dateFrom, v.dateTo) > MAX_RANGE_DAYS) {
    ctx.addIssue({ code: "custom", path: ["dateTo"], message: "Keep ranges under three years." });
  }
}

/** Weekday checkboxes ("0" = Monday … "6" = Sunday) to a bit mask. Missing means every day. */
const weekdays = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined) return ALL_WEEKDAYS;
    const days = (Array.isArray(v) ? v : [v]).map(Number);
    if (days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
      ctx.addIssue({ code: "custom", message: "Pick days of the week." });
      return z.NEVER;
    }
    const mask = days.reduce((m, d) => m | (1 << d), 0);
    if (mask === 0) {
      ctx.addIssue({ code: "custom", message: "Pick at least one day." });
      return z.NEVER;
    }
    return mask;
  });

/**
 * What a rule applies to, from one `<select>`: "all", "roomType:<id>" or "ratePlan:<id>".
 * A rate-plan scope's room type is filled in server-side from the plan.
 */
export const scopeSchema = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v || v === "all") return { roomTypeId: null, ratePlanId: null };
    const [kind, value] = v.split(":");
    if (!value || (kind !== "roomType" && kind !== "ratePlan")) {
      ctx.addIssue({ code: "custom", message: "Choose what this applies to." });
      return z.NEVER;
    }
    return kind === "roomType"
      ? { roomTypeId: value, ratePlanId: null }
      : { roomTypeId: null, ratePlanId: value };
  });

export type Scope = z.output<typeof scopeSchema>;

export function scopeValue(scope: {
  roomTypeId: string | null;
  ratePlanId: string | null;
}): string {
  if (scope.ratePlanId) return `ratePlan:${scope.ratePlanId}`;
  if (scope.roomTypeId) return `roomType:${scope.roomTypeId}`;
  return "all";
}

// ── Rooms ────────────────────────────────────────────────────────────────────

export const roomTypeFormSchema = z
  .object({
    name: requiredText(80, "Give the room type a name."),
    description: optionalText(1000),
    baseOccupancy: wholeNumber(1, 20, "Enter a number of guests from 1 to 20."),
    maxOccupancy: wholeNumber(1, 20, "Enter a number of guests from 1 to 20."),
    bedConfig: optionalText(80),
    amenities: z
      .string()
      .optional()
      .transform((v) => [
        ...new Set(
          (v ?? "")
            .split(/[,\n]/)
            .map((a) => a.trim())
            .filter(Boolean),
        ),
      ])
      .pipe(z.array(z.string().max(60, "Keep each amenity short.")).max(30, "Up to 30 amenities.")),
    isBookableOnline: checkbox,
  })
  .superRefine((v, ctx) => {
    if (v.maxOccupancy < v.baseOccupancy) {
      ctx.addIssue({
        code: "custom",
        path: ["maxOccupancy"],
        message: "Can't be fewer than the standard occupancy.",
      });
    }
  });

export const roomStatusSchema = z.enum(["clean", "dirty", "inspected", "out_of_order"]);

export const roomFormSchema = z.object({
  roomTypeId: id,
  name: requiredText(40, "Give the room a number or name."),
  floor: optionalText(40),
  status: roomStatusSchema,
  notes: optionalText(500),
});

// ── Rates ────────────────────────────────────────────────────────────────────

export const ratePlanFormSchema = z.object({
  roomTypeId: id,
  name: requiredText(80, "Give the rate plan a name."),
  baseNightlyPrice: money("Enter a nightly price, like 125 or 125.50."),
  includesBreakfast: checkbox,
  cancellationPolicyId: optionalId,
  minNights: wholeNumber(1, 60, "Enter a minimum stay from 1 to 60 nights."),
  isDefault: checkbox,
});

export const adjustmentTypeSchema = z.enum(["percentage", "fixed", "override"]);

/**
 * A price adjustment. For percentage and fixed types staff pick a direction and type a positive
 * amount ("Increase by 20%"); it's stored signed.
 */
export const priceAdjustmentFormSchema = z
  .object({
    label: requiredText(80, "Name this adjustment, like “Summer season”."),
    scope: scopeSchema,
    ...dateRange,
    type: adjustmentTypeSchema,
    direction: z.enum(["up", "down"]).default("up"),
    amount: z.string({ error: "Enter an amount." }),
    weekdays,
    repeatsYearly: checkbox,
  })
  .superRefine(checkRange)
  .transform((v, ctx) => {
    const sign = v.direction === "down" ? -1 : 1;
    let value: number | null;
    if (v.type === "percentage") {
      const bp = parsePercent(v.amount);
      value = bp === null || bp === 0 || (sign < 0 && bp > 10000) ? null : sign * bp;
      if (value === null) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message:
            sign < 0 ? "Enter a percentage from 0.01 to 100." : "Enter a percentage, like 20.",
        });
        return z.NEVER;
      }
    } else {
      const minor = parseMoney(v.amount);
      value =
        minor === null || (v.type === "fixed" && minor === 0)
          ? null
          : v.type === "fixed"
            ? sign * minor
            : minor;
      if (value === null) {
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: "Enter an amount, like 25 or 25.50.",
        });
        return z.NEVER;
      }
    }
    return {
      label: v.label,
      ...v.scope,
      dateFrom: v.dateFrom,
      dateTo: v.dateTo,
      type: v.type,
      value,
      weekdayMask: v.weekdays,
      repeatsYearly: v.repeatsYearly,
    };
  });

// ── Availability ─────────────────────────────────────────────────────────────

export const capacityOverrideFormSchema = z
  .object({
    roomTypeId: id,
    ...dateRange,
    roomsAvailable: wholeNumber(0, 500, "Enter how many rooms can be sold, from 0."),
    label: requiredText(80, "Say why, like “Renovation”."),
    repeatsYearly: checkbox,
  })
  .superRefine(checkRange);

export const stayRuleKindSchema = z.enum([
  "closed",
  "closed_to_arrival",
  "closed_to_departure",
  "min_stay",
]);

export const stayRuleFormSchema = z
  .object({
    kind: stayRuleKindSchema,
    scope: scopeSchema,
    ...dateRange,
    minNights: optionalWholeNumber(1, 60, "Enter a minimum stay from 1 to 60 nights."),
    label: optionalText(80),
    repeatsYearly: checkbox,
  })
  .superRefine(checkRange)
  .superRefine((v, ctx) => {
    if (v.kind === "min_stay" && v.minNights === undefined) {
      ctx.addIssue({ code: "custom", path: ["minNights"], message: "Enter the minimum stay." });
    }
  })
  .transform((v) => ({
    kind: v.kind,
    ...v.scope,
    dateFrom: v.dateFrom,
    dateTo: v.dateTo,
    minNights: v.kind === "min_stay" ? (v.minNights ?? null) : null,
    label: v.label,
    repeatsYearly: v.repeatsYearly,
  }));

export const priceModeSchema = z.enum([
  "none",
  "set",
  "up_percent",
  "down_percent",
  "up_amount",
  "down_amount",
]);

/**
 * The grid's "Edit dates" sheet: several changes over one date range and several room types,
 * saved together. Each change becomes an ordinary capacity override, price adjustment or stay
 * rule, listed (and removable) in its own tab.
 */
export const bulkEditFormSchema = z
  .object({
    ...dateRange,
    roomTypeIds: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]))
      .pipe(z.array(id).min(1, "Pick at least one room type.")),
    rooms: optionalWholeNumber(0, 500, "Enter how many rooms can be sold, from 0."),
    ratePlanId: optionalId,
    priceMode: priceModeSchema.default("none"),
    priceAmount: z.string().optional(),
    weekdays,
    close: checkbox,
    closedToArrival: checkbox,
    closedToDeparture: checkbox,
    minNights: optionalWholeNumber(1, 60, "Enter a minimum stay from 1 to 60 nights."),
    label: requiredText(80, "Name this change, like “Christmas”."),
    repeatsYearly: checkbox,
  })
  .superRefine(checkRange)
  .transform((v, ctx) => {
    let price: { type: "override" | "percentage" | "fixed"; value: number } | null = null;
    if (v.priceMode !== "none") {
      const raw = v.priceAmount ?? "";
      const down = v.priceMode.startsWith("down");
      if (v.priceMode === "set") {
        const minor = parseMoney(raw);
        if (minor !== null) price = { type: "override", value: minor };
      } else if (v.priceMode.endsWith("percent")) {
        const bp = parsePercent(raw);
        if (bp !== null && bp > 0 && !(down && bp > 10000)) {
          price = { type: "percentage", value: down ? -bp : bp };
        }
      } else {
        const minor = parseMoney(raw);
        if (minor !== null && minor > 0) price = { type: "fixed", value: down ? -minor : minor };
      }
      if (!price) {
        ctx.addIssue({
          code: "custom",
          path: ["priceAmount"],
          message: v.priceMode.endsWith("percent")
            ? "Enter a percentage, like 15."
            : "Enter an amount, like 25 or 25.50.",
        });
        return z.NEVER;
      }
    }
    if (v.ratePlanId && v.roomTypeIds.length !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["ratePlanId"],
        message: "Pick one room type to change a single rate plan.",
      });
      return z.NEVER;
    }
    const nothing =
      v.rooms === undefined &&
      !price &&
      !v.close &&
      !v.closedToArrival &&
      !v.closedToDeparture &&
      v.minNights === undefined;
    if (nothing) {
      ctx.addIssue({ code: "custom", path: ["_form"], message: "Choose at least one change." });
      return z.NEVER;
    }
    return {
      dateFrom: v.dateFrom,
      dateTo: v.dateTo,
      roomTypeIds: v.roomTypeIds,
      rooms: v.rooms ?? null,
      ratePlanId: v.ratePlanId,
      price,
      weekdayMask: v.weekdays,
      close: v.close,
      closedToArrival: v.closedToArrival,
      closedToDeparture: v.closedToDeparture,
      minNights: v.minNights ?? null,
      label: v.label,
      repeatsYearly: v.repeatsYearly,
    };
  });

export type BulkEdit = z.output<typeof bulkEditFormSchema>;

/** Query string for the grid window: a start date. */
export const gridStartSchema = z
  .string()
  .regex(ISO_DATE)
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()));
