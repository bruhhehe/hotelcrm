import { createId } from "@paralleldrive/cuid2";
import { addDays, diffDays, eachNight, rangesOverlap } from "@/lib/dates/calendar";
import { zonedTimeToUtc } from "@/lib/dates/zoned";
import type * as schema from "@/lib/db/schema";
import type { InvoiceLine } from "@/lib/db/schema";
import { percentOf, taxFromInclusive } from "@/lib/money/math";
import { nightlyRates, type PriceAdjustmentRow } from "@/lib/pricing/nightly";
import { type PriceChange, quote, type QuoteExtraInput, type TaxRate } from "@/lib/pricing/quote";
import { formatReservationReference } from "@/lib/reservations/reference";
import {
  DEMO_HOTEL,
  EXTRAS,
  type ExtraKey,
  GUESTS,
  HABITUAL_NO_SHOW_GUEST,
  OUT_OF_ORDER_ROOM,
  RATE_PLANS,
  type RatePlanKey,
  ROOM_TYPES,
  type RoomTypeKey,
  STAFF,
} from "./data";

type Row<T extends { $inferInsert: object }> = T["$inferInsert"] & { id: string };
type Status = (typeof schema.reservationStatusEnum.enumValues)[number];
type Source = (typeof schema.bookingSourceEnum.enumValues)[number];

export type SeedPlan = {
  hotel: Row<typeof schema.hotels>;
  users: Row<typeof schema.users>[];
  memberships: Row<typeof schema.memberships>[];
  cancellationPolicies: Row<typeof schema.cancellationPolicies>[];
  taxRates: Row<typeof schema.taxRates>[];
  roomTypes: Row<typeof schema.roomTypes>[];
  rooms: Row<typeof schema.rooms>[];
  ratePlans: Row<typeof schema.ratePlans>[];
  priceAdjustments: Row<typeof schema.priceAdjustments>[];
  extras: Row<typeof schema.extras>[];
  packages: Row<typeof schema.packages>[];
  promoCodes: Row<typeof schema.promoCodes>[];
  guests: Row<typeof schema.guests>[];
  guestCompanions: Row<typeof schema.guestCompanions>[];
  guestPreferences: Row<typeof schema.guestPreferences>[];
  guestPackages: Row<typeof schema.guestPackages>[];
  reservations: Row<typeof schema.reservations>[];
  reservationRooms: Row<typeof schema.reservationRooms>[];
  reservationExtras: Row<typeof schema.reservationExtras>[];
  reservationStatusHistory: Row<typeof schema.reservationStatusHistory>[];
  invoices: Row<typeof schema.invoices>[];
  payments: Row<typeof schema.payments>[];
  hotelCounters: (typeof schema.hotelCounters.$inferInsert)[];
  housekeepingTasks: Row<typeof schema.housekeepingTasks>[];
  maintenanceIssues: Row<typeof schema.maintenanceIssues>[];
  notifications: Row<typeof schema.notifications>[];
};

export type SeedOptions = {
  /** Hotel-local "today" (YYYY-MM-DD). */
  today: string;
  /** The real current instant; nothing is dated after it. */
  now: Date;
  /** PRNG seed, so the same day produces the same hotel. */
  seed?: number;
  /** How many reservations to aim for (spec: ~120). */
  targetReservations?: number;
};

/** mulberry32: tiny, fast, deterministic. */
function makeRandom(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const chance = (p: number) => next() < p;
  function pick<T>(items: readonly T[]): T {
    const item = items[Math.floor(next() * items.length)];
    if (item === undefined) throw new Error("pick from empty list");
    return item;
  }
  function weighted<T>(entries: readonly (readonly [T, number])[]): T {
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = next() * total;
    for (const [value, w] of entries) {
      r -= w;
      if (r < 0) return value;
    }
    const last = entries.at(-1);
    if (!last) throw new Error("weighted pick from empty list");
    return last[0];
  }
  function shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [out[i], out[j]] = [out[j] as T, out[i] as T];
    }
    return out;
  }
  return { next, int, chance, pick, weighted, shuffle };
}

const TZ = DEMO_HOTEL.timezone;
const DEPOSIT_BP = 3000;
const VAT_BP = 2000;

function slugifyEmail(first: string, last: string, i: number): string {
  const clean = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  const domains = ["example.com", "example.org", "example.net"];
  return `${clean(first)}.${clean(last)}@${domains[i % domains.length]}`;
}

type PlannedStay = {
  id: string;
  guestIdx: number;
  typeKey: RoomTypeKey;
  roomName: string | null;
  /** Room holding capacity in the calendar even when not yet assigned. */
  blockRoomName: string;
  checkIn: string;
  checkOut: string;
  status: Status;
  source: Source;
  ratePlanKey: RatePlanKey;
  adults: number;
  children: number;
  createdAt: Date;
};

export function generateSeed(options: SeedOptions): SeedPlan {
  const { today, now } = options;
  const target = options.targetReservations ?? 120;
  const rng = makeRandom(options.seed ?? Number(today.replaceAll("-", "")));
  const at = (date: string, time: string) => zonedTimeToUtc(date, time, TZ);
  /** Never date anything after the real current instant. */
  const notAfterNow = (d: Date) => (d.getTime() > now.getTime() ? new Date(now) : d);

  // ── Tenancy ────────────────────────────────────────────────────────────────
  const hotelId = createId();
  const hotel: SeedPlan["hotel"] = {
    id: hotelId,
    ...DEMO_HOTEL,
    address: { ...DEMO_HOTEL.address },
    plan: "pro",
    trialEndsAt: new Date(now.getTime() + 9 * 86_400_000),
    settings: {
      depositPolicy: { type: "percentage", value: DEPOSIT_BP, balanceDue: "on_arrival" },
      requireValidation: true,
      displayTaxIncluded: true,
    },
  };

  const users: SeedPlan["users"] = STAFF.map((s) => ({
    id: createId(),
    name: s.name,
    email: s.email,
    emailVerified: new Date(now.getTime() - 90 * 86_400_000),
  }));
  const userId = (role: (typeof STAFF)[number]["role"]) => {
    const idx = STAFF.findIndex((s) => s.role === role);
    const user = users[idx];
    if (!user) throw new Error(`no staff user for ${role}`);
    return user.id;
  };
  const memberships: SeedPlan["memberships"] = STAFF.map((s, i) => ({
    id: createId(),
    hotelId,
    userId: users[i]!.id,
    role: s.role,
  }));

  // ── Policies, tax ──────────────────────────────────────────────────────────
  const flexible = {
    id: createId(),
    hotelId,
    name: "Flexible",
    rules: [{ daysBefore: 2, chargeBp: 0 }],
    noShowChargeBp: 5000,
  };
  const nonRefundable = {
    id: createId(),
    hotelId,
    name: "Non-refundable",
    rules: [],
    noShowChargeBp: 10000,
  };
  const vat = {
    id: createId(),
    hotelId,
    name: "VAT 20%",
    rateBp: VAT_BP,
    mode: "included" as const,
    isDefault: true,
  };
  const zeroRate = {
    id: createId(),
    hotelId,
    name: "Zero rated",
    rateBp: 0,
    mode: "included" as const,
    isDefault: false,
  };

  // ── Inventory ──────────────────────────────────────────────────────────────
  const roomTypes: SeedPlan["roomTypes"] = [];
  const rooms: SeedPlan["rooms"] = [];
  const roomTypeIdByKey = new Map<RoomTypeKey, string>();
  const roomIdByName = new Map<string, string>();
  const roomsByType = new Map<RoomTypeKey, string[]>();
  let roomSort = 0;
  ROOM_TYPES.forEach((rt, i) => {
    const rtId = createId();
    roomTypeIdByKey.set(rt.key, rtId);
    roomsByType.set(rt.key, rt.rooms);
    roomTypes.push({
      id: rtId,
      hotelId,
      name: rt.name,
      description: rt.description,
      baseOccupancy: rt.baseOccupancy,
      maxOccupancy: rt.maxOccupancy,
      bedConfig: rt.bedConfig,
      amenities: rt.amenities,
      sortOrder: i,
    });
    for (const name of rt.rooms) {
      const roomId = createId();
      roomIdByName.set(name, roomId);
      rooms.push({
        id: roomId,
        hotelId,
        roomTypeId: rtId,
        name,
        floor: rt.floor,
        sortOrder: roomSort++,
      });
    }
  });
  const typeOf = (key: RoomTypeKey) => {
    const rt = ROOM_TYPES.find((r) => r.key === key);
    if (!rt) throw new Error(`room type ${key}`);
    return rt;
  };

  const ratePlans: SeedPlan["ratePlans"] = [];
  const ratePlanId = new Map<string, string>();
  for (const rt of ROOM_TYPES) {
    for (const rp of RATE_PLANS) {
      const id = createId();
      ratePlanId.set(`${rt.key}:${rp.key}`, id);
      ratePlans.push({
        id,
        hotelId,
        roomTypeId: roomTypeIdByKey.get(rt.key)!,
        name: rp.name,
        baseNightlyPrice: percentOf(rt.price + rp.nightlyExtra, 10000 - rp.discountBp),
        includesBreakfast: rp.includesBreakfast,
        cancellationPolicyId: rp.policy === "flexible" ? flexible.id : nonRefundable.id,
        isDefault: rp.isDefault,
      });
    }
  }

  // Two seasonal adjustments: summer every year, this autumn's half-term once.
  const year = Number(today.slice(0, 4));
  const halfTermYear = today > `${year}-11-01` ? year + 1 : year;
  const halfTerm = { from: `${halfTermYear}-10-24`, to: `${halfTermYear}-11-01` };
  const priceAdjustments: SeedPlan["priceAdjustments"] = [
    {
      id: createId(),
      hotelId,
      dateFrom: `${year}-07-01`,
      dateTo: `${year}-08-31`,
      type: "percentage",
      value: 2000,
      label: "Summer season",
      repeatsYearly: true,
    },
    {
      id: createId(),
      hotelId,
      dateFrom: halfTerm.from,
      dateTo: halfTerm.to,
      type: "percentage",
      value: 1000,
      label: "October half-term",
      repeatsYearly: false,
    },
  ];
  // Stays are priced by the real engine, so seeded totals are exactly what quote() gives.
  const adjustmentRows: PriceAdjustmentRow[] = priceAdjustments.map((a) => ({
    id: a.id,
    ratePlanId: a.ratePlanId ?? null,
    roomTypeId: a.roomTypeId ?? null,
    dateFrom: a.dateFrom,
    dateTo: a.dateTo,
    repeatsYearly: a.repeatsYearly ?? false,
    weekdayMask: a.weekdayMask ?? 127,
    type: a.type,
    value: a.value,
    label: a.label,
    createdAt: now,
  }));
  const planFor = (typeKey: RoomTypeKey, planKey: RatePlanKey) => {
    const plan = ratePlans.find((p) => p.id === ratePlanId.get(`${typeKey}:${planKey}`));
    if (!plan) throw new Error(`rate plan ${typeKey}:${planKey}`);
    return { id: plan.id, roomTypeId: plan.roomTypeId, baseNightlyPrice: plan.baseNightlyPrice };
  };
  const VAT_RATE: TaxRate = { name: "VAT 20%", rateBp: VAT_BP, mode: "included" };

  const extras: SeedPlan["extras"] = EXTRAS.map((e, i) => ({
    id: createId(),
    hotelId,
    name: e.name,
    price: e.price,
    pricingMode: e.pricingMode,
    category: e.category,
    taxRateId: vat.id,
    sortOrder: i,
  }));
  const extraByKey = (key: ExtraKey) => {
    const idx = EXTRAS.findIndex((e) => e.key === key);
    return { def: EXTRAS[idx]!, row: extras[idx]! };
  };

  const fiveNights = {
    id: createId(),
    hotelId,
    name: "Five nights, any time",
    kind: "nights_bundle" as const,
    price: 55000,
    nightsIncluded: 5,
    validityDays: 365,
    applicableRoomTypeIds: [roomTypeIdByKey.get("cosy")!, roomTypeIdByKey.get("classic")!],
  };
  const lakes10 = {
    id: createId(),
    hotelId,
    code: "LAKES10",
    type: "percentage" as const,
    value: 1000,
    minNights: 2,
    validFrom: `${year}-01-01`,
    validTo: `${year + 1}-12-31`,
  };
  const welcome20 = {
    id: createId(),
    hotelId,
    code: "WELCOME20",
    type: "fixed" as const,
    value: 2000,
    maxUses: 50,
    usedCount: 0,
  };

  /** Fields the seed's two codes leave at their column defaults, for the pricing engine. */
  const promoDefaults = {
    roomTypeIds: [] as string[],
    minNights: null,
    maxNights: null,
    validFrom: null,
    validTo: null,
    maxUses: null,
    usedCount: 0,
    isActive: true,
  };

  // ── Guests ─────────────────────────────────────────────────────────────────
  const guests: SeedPlan["guests"] = GUESTS.map((g, i) => ({
    id: createId(),
    hotelId,
    firstName: g.first,
    lastName: g.last,
    email: slugifyEmail(g.first, g.last, i),
    phone: g.nationality === "GB" || g.nationality === "IE" ? `+447700900${String(100 + i)}` : null,
    nationality: g.nationality,
    language: g.language,
    marketingOptIn: g.marketing ?? false,
    tags: g.tags ?? [],
    isVip: g.vip ?? false,
    isBlacklisted: g.blacklisted ?? false,
    portalStatus: i % 8 === 0 ? "active" : i % 8 === 1 ? "invited" : "none",
    notes: g.blacklisted
      ? "Left without paying for damage in the Classic Double. Do not rebook."
      : null,
  }));
  const guestCompanions: SeedPlan["guestCompanions"] = [];
  GUESTS.forEach((g, i) => {
    if (g.partner) {
      guestCompanions.push({
        id: createId(),
        hotelId,
        guestId: guests[i]!.id,
        name: g.partner,
        relationship: "partner",
        notes: i % 5 === 0 ? "Vegetarian" : null,
      });
    }
    g.children?.forEach((child, c) => {
      guestCompanions.push({
        id: createId(),
        hotelId,
        guestId: guests[i]!.id,
        name: child,
        relationship: "child",
        dateOfBirth: `${year - 6 - c * 3}-0${(c % 9) + 1}-1${c}`,
      });
    });
  });
  const guestPreferences: SeedPlan["guestPreferences"] = GUESTS.flatMap((g, i) =>
    g.pillow || g.allergies || g.prefersRoom
      ? [
          {
            id: createId(),
            hotelId,
            guestId: guests[i]!.id,
            pillowType: g.pillow ?? null,
            allergies: g.allergies ?? null,
            preferredRoomId: g.prefersRoom ? (roomIdByName.get(g.prefersRoom) ?? null) : null,
            notes: g.prefersRoom ? `Always asks for room ${g.prefersRoom}` : null,
          },
        ]
      : [],
  );
  const guestPackages: SeedPlan["guestPackages"] = [
    {
      id: createId(),
      hotelId,
      guestId: guests[1]!.id,
      packageId: fiveNights.id,
      purchasedAt: new Date(now.getTime() - 40 * 86_400_000),
      expiresAt: new Date(now.getTime() + 325 * 86_400_000),
      nightsRemaining: 5,
    },
  ];

  // ── Reservations: plan the house ───────────────────────────────────────────
  const calendar = new Map<string, [string, string][]>();
  // Room 7 is out of order from yesterday for a few days (maintenance issue below).
  calendar.set(OUT_OF_ORDER_ROOM, [[addDays(today, -1), addDays(today, 3)]]);
  const isFree = (room: string, checkIn: string, checkOut: string) =>
    !(calendar.get(room) ?? []).some(([a, b]) => rangesOverlap(a, b, checkIn, checkOut));
  const block = (room: string, checkIn: string, checkOut: string) => {
    calendar.set(room, [...(calendar.get(room) ?? []), [checkIn, checkOut]]);
  };
  const findRoom = (typeKey: RoomTypeKey, checkIn: string, checkOut: string) =>
    rng.shuffle(roomsByType.get(typeKey) ?? []).find((r) => isFree(r, checkIn, checkOut)) ?? null;

  const TYPE_WEIGHTS = [
    ["cosy", 25],
    ["classic", 30],
    ["king", 25],
    ["family", 12],
    ["cottage", 8],
  ] as const satisfies readonly (readonly [RoomTypeKey, number])[];
  const SOURCE_WEIGHTS = [
    ["website", 28],
    ["ota_booking_com", 26],
    ["ota_airbnb", 12],
    ["ota_expedia", 8],
    ["phone", 14],
    ["walk_in", 5],
    ["agency", 3],
    ["other", 4],
  ] as const satisfies readonly (readonly [Source, number])[];

  const bookable = GUESTS.map((_, i) => i).filter((i) => !GUESTS[i]!.blacklisted);
  const guestWeight = (i: number) => (GUESTS[i]!.tags?.includes("repeat") ? 4 : 1);
  const pickGuest = () => rng.weighted(bookable.map((i) => [i, guestWeight(i)] as const));

  const stays: PlannedStay[] = [];
  const occupancyFor = (guestIdx: number, typeKey: RoomTypeKey) => {
    const g = GUESTS[guestIdx]!;
    const max = typeOf(typeKey).maxOccupancy;
    const adults = g.partner ? 2 : rng.chance(0.25) ? 2 : 1;
    const children = Math.max(0, Math.min((g.children ?? []).length, max - adults));
    return { adults: Math.min(adults, max), children };
  };
  const createdAtFor = (checkIn: string, source: Source) => {
    if (source === "walk_in") return notAfterNow(at(checkIn, "12:30"));
    const lead = rng.int(1, 60);
    return notAfterNow(
      at(addDays(checkIn, -lead), `${rng.int(8, 21)}:${rng.pick(["05", "20", "40"])}`),
    );
  };
  const pickSource = (checkIn: string): Source => {
    for (;;) {
      const s = rng.weighted(SOURCE_WEIGHTS);
      if (s !== "walk_in" || checkIn <= today) return s;
    }
  };
  const pickPlan = (source: Source): RatePlanKey =>
    source.startsWith("ota_")
      ? rng.weighted([
          ["room_only", 80],
          ["nonref", 20],
        ] as const)
      : rng.weighted([
          ["room_only", 50],
          ["bnb", 35],
          ["nonref", 15],
        ] as const);

  function addStay(
    checkIn: string,
    checkOut: string,
    status: Status,
    opts: { guestIdx?: number; typeKey?: RoomTypeKey; unassigned?: boolean } = {},
  ): PlannedStay | null {
    const guestIdx = opts.guestIdx ?? pickGuest();
    const wantsFamily = (GUESTS[guestIdx]!.children ?? []).length > 0;
    const candidates: RoomTypeKey[] = opts.typeKey
      ? [opts.typeKey]
      : wantsFamily
        ? ["family", "cottage", "king"]
        : [rng.weighted(TYPE_WEIGHTS), ...rng.shuffle(ROOM_TYPES.map((r) => r.key))];
    const active = status !== "cancelled" && status !== "no_show";
    for (const typeKey of candidates) {
      const room = active
        ? findRoom(typeKey, checkIn, checkOut)
        : rng.pick(roomsByType.get(typeKey)!);
      if (!room) continue;
      if (active) block(room, checkIn, checkOut);
      const source = pickSource(checkIn);
      const { adults, children } = occupancyFor(guestIdx, typeKey);
      const stay: PlannedStay = {
        id: createId(),
        guestIdx,
        typeKey,
        roomName: opts.unassigned || status === "cancelled" ? null : room,
        blockRoomName: room,
        checkIn,
        checkOut,
        status,
        source,
        ratePlanKey: pickPlan(source),
        adults,
        children,
        createdAt: createdAtFor(checkIn, source),
      };
      stays.push(stay);
      return stay;
    }
    return null;
  }

  // Today, explicitly: 3 departures (1 already out), 4 staying on, 8 arrivals (5 already in).
  addStay(addDays(today, -2), today, "checked_out");
  addStay(addDays(today, -3), today, "checked_in");
  addStay(addDays(today, -1), today, "checked_in");
  for (const [back, ahead] of [
    [1, 1],
    [2, 2],
    [1, 3],
    [3, 1],
  ] as const) {
    addStay(addDays(today, -back), addDays(today, ahead), "checked_in");
  }
  for (let i = 0; i < 8; i++) {
    const out = addDays(today, rng.int(1, 4));
    addStay(today, out, i < 5 ? "checked_in" : "confirmed", { unassigned: i === 7 });
  }
  // The habitual no-show: three past stays they never turned up for.
  for (const daysAgo of [52, 34, 12]) {
    addStay(addDays(today, -daysAgo), addDays(today, -daysAgo + 2), "no_show", {
      guestIdx: HABITUAL_NO_SHOW_GUEST,
    });
  }
  // The blacklisted guest's one (past) stay.
  addStay(addDays(today, -45), addDays(today, -43), "checked_out", {
    guestIdx: GUESTS.findIndex((g) => g.blacklisted),
    typeKey: "classic",
  });

  // Fill the rest of the -60…+90 day window, keeping today exactly as planned above.
  const NIGHTS = [
    [1, 15],
    [2, 35],
    [3, 25],
    [4, 15],
    [5, 6],
    [7, 4],
  ] as const;
  for (let attempts = 0; stays.length < target && attempts < 5000; attempts++) {
    const checkIn = addDays(today, rng.int(-60, 90));
    const checkOut = addDays(checkIn, rng.weighted(NIGHTS));
    if (checkIn <= today && checkOut >= today) continue;
    const past = checkOut < today;
    const status: Status = past
      ? rng.weighted([
          ["checked_out", 85],
          ["cancelled", 8],
          ["no_show", 7],
        ] as const)
      : rng.weighted([
          ["confirmed", 88],
          ["cancelled", 12],
        ] as const);
    const unassigned =
      !past && status === "confirmed" && diffDays(today, checkIn) > 7 && rng.chance(0.15);
    addStay(checkIn, checkOut, status, { unassigned });
  }

  // Three widget bookings waiting for the owner to accept them.
  const pendingCandidates = rng
    .shuffle(stays.filter((s) => s.status === "confirmed" && s.checkIn > addDays(today, 3)))
    .slice(0, 3);
  for (const s of pendingCandidates) {
    s.status = "pending_validation";
    s.source = "website";
    s.ratePlanKey = "room_only";
  }
  // Eleven bookings made today ("New reservations today").
  const minutesToday = Math.max(
    1,
    Math.floor((now.getTime() - at(today, "00:00").getTime()) / 60_000),
  );
  const newToday = [
    ...pendingCandidates,
    ...rng.shuffle(
      stays.filter(
        (s) => s.status === "confirmed" && s.checkIn >= today && !pendingCandidates.includes(s),
      ),
    ),
  ].slice(0, 11);
  for (const s of newToday) {
    if (s.source === "walk_in") s.source = "phone";
    s.createdAt = new Date(now.getTime() - rng.int(1, minutesToday) * 60_000);
  }

  // ── Money and paperwork per stay ───────────────────────────────────────────
  stays.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const reservations: SeedPlan["reservations"] = [];
  const reservationRooms: SeedPlan["reservationRooms"] = [];
  const reservationExtras: SeedPlan["reservationExtras"] = [];
  const history: SeedPlan["reservationStatusHistory"] = [];
  const payments: SeedPlan["payments"] = [];
  const pendingInvoices: (SeedPlan["invoices"][number] & { issuedAt: Date })[] = [];
  const noShows = new Map<number, number>();
  const firstSource = new Map<number, Source>();
  let welcomeUses = 0;

  stays.forEach((s, index) => {
    const guest = guests[s.guestIdx]!;
    firstSource.set(s.guestIdx, firstSource.get(s.guestIdx) ?? s.source);
    const rt = typeOf(s.typeKey);
    const plan = RATE_PLANS.find((p) => p.key === s.ratePlanKey)!;
    const policy = plan.policy === "flexible" ? flexible : nonRefundable;
    const nights = eachNight(s.checkIn, s.checkOut);
    const nightlyPrices = nightlyRates(
      planFor(s.typeKey, s.ratePlanKey),
      adjustmentRows,
      s.checkIn,
      s.checkOut,
    ).map((n) => ({ date: n.date, amount: n.amount }));

    // Extras
    const chosen: ExtraKey[] = [];
    if (!plan.includesBreakfast && rng.chance(0.4)) chosen.push("breakfast");
    if (rng.chance(0.15)) chosen.push("parking");
    if (
      (s.typeKey === "cottage" || GUESTS[s.guestIdx]!.tags?.includes("dog owner")) &&
      rng.chance(0.6)
    )
      chosen.push("dog");
    if (rng.chance(0.06)) chosen.push("late");
    if (rng.chance(0.05)) chosen.push("transfer");
    if (rng.chance(0.05)) chosen.push("spa");
    const extraInputs: QuoteExtraInput[] = chosen.map((key) => {
      const { def, row } = extraByKey(key);
      return {
        extraId: row.id,
        name: def.name,
        unitPrice: def.price,
        pricingMode: def.pricingMode,
        tax: VAT_RATE,
      };
    });

    // Promo codes on some direct bookings
    let change: PriceChange | null = null;
    if (s.source === "website" && s.status !== "pending_validation") {
      if (nights.length >= 2 && rng.chance(0.1)) {
        change = { type: "promo", promo: { ...promoDefaults, ...lakes10 } };
      } else if (welcomeUses < 3 && rng.chance(0.2)) {
        change = {
          type: "promo",
          promo: { ...promoDefaults, ...welcome20, usedCount: welcomeUses },
        };
      }
    }
    const priced = quote({
      checkIn: s.checkIn,
      checkOut: s.checkOut,
      adults: s.adults,
      children: s.children,
      rooms: [
        {
          roomTypeId: roomTypeIdByKey.get(s.typeKey)!,
          ratePlanId: ratePlanId.get(`${s.typeKey}:${s.ratePlanKey}`)!,
          label: `${rt.name} · ${plan.name}`,
          nights: nightlyPrices,
          tax: VAT_RATE,
        },
      ],
      extras: extraInputs,
      change,
      deposit: { type: "percentage", value: DEPOSIT_BP, balanceDue: "on_arrival", daysBefore: 7 },
      today,
    });
    const roomsTotal = priced.roomsTotal;
    const promoCodeId = priced.discount?.promoCodeId ?? null;
    const discount = priced.discount?.amount ?? 0;
    if (promoCodeId === welcome20.id) welcomeUses++;
    const total = priced.total;
    const extraLines: InvoiceLine[] = [];
    for (const e of priced.extras) {
      reservationExtras.push({
        id: createId(),
        hotelId,
        reservationId: s.id,
        extraId: e.extraId,
        name: e.name,
        pricingMode: e.pricingMode,
        taxRateBp: VAT_BP,
        qty: e.quantity,
        unitPrice: e.unitPrice,
        total: e.total,
      });
      extraLines.push({
        description: e.name,
        quantity: e.quantity,
        unitAmount: e.unitPrice,
        total: e.total,
        taxRateBp: VAT_BP,
        taxMode: "included",
        taxAmount: taxFromInclusive(e.total, VAT_BP),
      });
    }

    // Status timestamps
    const confirmedAt =
      s.status === "pending_validation"
        ? null
        : s.source === "website"
          ? notAfterNow(new Date(s.createdAt.getTime() + rng.int(20, 180) * 60_000))
          : s.createdAt;
    const checkedInAt =
      s.status === "checked_in" || s.status === "checked_out"
        ? notAfterNow(at(s.checkIn, `${rng.int(14, 19)}:${rng.pick(["05", "25", "45"])}`))
        : null;
    const checkedOutAt =
      s.status === "checked_out"
        ? notAfterNow(at(s.checkOut, `${rng.int(9, 10)}:${rng.pick(["10", "30", "50"])}`))
        : null;
    const cancelledAt =
      s.status === "cancelled"
        ? notAfterNow(
            new Date(
              Math.max(
                at(addDays(s.checkIn, -rng.int(1, 20)), "11:00").getTime(),
                s.createdAt.getTime() + 3_600_000,
              ),
            ),
          )
        : null;

    const createdVia =
      s.source === "website" ? "widget" : s.source.startsWith("ota_") ? "import" : "admin";
    const externalRef =
      s.source === "ota_booking_com"
        ? `BDC-${rng.int(1000000000, 9999999999)}`
        : s.source === "ota_expedia"
          ? `EXP-${rng.int(10000000, 99999999)}`
          : s.source === "ota_airbnb"
            ? `HM${rng.int(10000000, 99999999)}`
            : null;

    const arrivalTime =
      s.status === "confirmed" && s.checkIn === today ? `${rng.int(15, 20)}:00` : null;
    reservations.push({
      id: s.id,
      hotelId,
      reference: formatReservationReference(index + 1),
      guestId: guest.id,
      status: s.status,
      source: s.source,
      externalRef,
      checkIn: s.checkIn,
      checkOut: s.checkOut,
      arrivalTime,
      adults: s.adults,
      children: s.children,
      specialRequests: rng.chance(0.15)
        ? rng.pick([
            "Ground floor if possible",
            "Celebrating an anniversary",
            "Arriving late, around 10pm",
            "Travel cot please",
            "Quiet room please",
          ])
        : null,
      cancellationPolicyId: policy.id,
      promoCodeId,
      totalAmount: total,
      currency: DEMO_HOTEL.currency,
      createdVia,
      confirmedAt,
      checkedInAt,
      checkedOutAt,
      cancelledAt,
      cancellationReason:
        s.status === "cancelled"
          ? rng.pick(["Change of plans", "Illness", "Booked elsewhere", null])
          : null,
      createdAt: s.createdAt,
      updatedAt: checkedOutAt ?? checkedInAt ?? cancelledAt ?? confirmedAt ?? s.createdAt,
    });
    reservationRooms.push({
      id: createId(),
      hotelId,
      reservationId: s.id,
      roomTypeId: roomTypeIdByKey.get(s.typeKey)!,
      roomId: s.roomName ? roomIdByName.get(s.roomName)! : null,
      ratePlanId: ratePlanId.get(`${s.typeKey}:${s.ratePlanKey}`)!,
      checkIn: s.checkIn,
      checkOut: s.checkOut,
      nightlyPrices,
      companionIds: guestCompanions
        .filter((c) => c.guestId === guest.id)
        .slice(0, s.adults + s.children - 1)
        .map((c) => c.id),
      isActive: s.status !== "cancelled" && s.status !== "no_show",
    });

    // Timeline
    const actor = (
      kind: "user" | "guest" | "system",
      userRole?: (typeof STAFF)[number]["role"],
    ) => ({
      actorKind: kind,
      actorUserId: userRole ? userId(userRole) : null,
    });
    const created = s.source === "website" ? "pending_validation" : "confirmed";
    history.push({
      id: createId(),
      hotelId,
      reservationId: s.id,
      fromStatus: null,
      toStatus: created,
      ...(createdVia === "widget"
        ? actor("guest")
        : createdVia === "import"
          ? actor("system")
          : actor("user", "reception")),
      note: createdVia === "import" ? "Imported from channel" : null,
      at: s.createdAt,
    });
    if (created === "pending_validation" && confirmedAt) {
      history.push({
        id: createId(),
        hotelId,
        reservationId: s.id,
        fromStatus: "pending_validation",
        toStatus: "confirmed",
        ...actor("user", "owner"),
        at: confirmedAt,
      });
    }
    if (checkedInAt) {
      history.push({
        id: createId(),
        hotelId,
        reservationId: s.id,
        fromStatus: "confirmed",
        toStatus: "checked_in",
        ...actor("user", "reception"),
        at: checkedInAt,
      });
    }
    if (checkedOutAt) {
      history.push({
        id: createId(),
        hotelId,
        reservationId: s.id,
        fromStatus: "checked_in",
        toStatus: "checked_out",
        ...actor("user", "reception"),
        at: checkedOutAt,
      });
    }
    if (cancelledAt) {
      history.push({
        id: createId(),
        hotelId,
        reservationId: s.id,
        fromStatus: "confirmed",
        toStatus: "cancelled",
        ...actor("user", "reception"),
        at: cancelledAt,
      });
    }
    if (s.status === "no_show") {
      history.push({
        id: createId(),
        hotelId,
        reservationId: s.id,
        fromStatus: "confirmed",
        toStatus: "no_show",
        ...actor("user", "owner"),
        note: "Did not arrive",
        at: notAfterNow(at(addDays(s.checkIn, 1), "09:00")),
      });
      noShows.set(s.guestIdx, (noShows.get(s.guestIdx) ?? 0) + 1);
    }

    // Payments: deposits on direct bookings, everything up front for non-refundable,
    // OTA guests pay at the hotel. Nothing moves while a booking awaits validation.
    const pay = (
      amount: number,
      kind: "deposit" | "balance" | "full" | "refund",
      method: "stripe" | "cash" | "card_terminal" | "bank_transfer",
      receivedAt: Date,
    ) => {
      const row = {
        id: createId(),
        hotelId,
        reservationId: s.id,
        invoiceId: null as string | null,
        amount,
        currency: DEMO_HOTEL.currency,
        method,
        kind,
        stripePaymentIntentId: method === "stripe" ? `pi_demo_${createId().slice(0, 16)}` : null,
        receivedAt,
        recordedByUserId: method === "stripe" ? null : userId("reception"),
      };
      payments.push(row);
      return row;
    };
    if (s.status === "pending_validation") return;
    const direct = s.source === "website" || s.source === "phone" || s.source === "agency";
    const upfrontAt = confirmedAt ?? s.createdAt;
    let paid = 0;
    const own: ReturnType<typeof pay>[] = [];
    if (s.ratePlanKey === "nonref" && direct) {
      own.push(pay(total, "full", "stripe", upfrontAt));
      paid = total;
    } else if (direct && !(s.status === "confirmed" && rng.chance(0.1))) {
      const deposit = priced.deposit;
      if (deposit > 0) {
        own.push(pay(deposit, "deposit", "stripe", upfrontAt));
        paid = deposit;
      }
    }

    const issueInvoice = (
      amount: number,
      issuedAt: Date,
      lines: InvoiceLine[],
      discountTotal: number,
    ) => {
      const invoiceId = createId();
      const subtotal = lines.filter((l) => l.total > 0).reduce((sum, l) => sum + l.total, 0);
      pendingInvoices.push({
        id: invoiceId,
        hotelId,
        reservationId: s.id,
        guestId: guest.id,
        status: "paid",
        number: 0,
        currency: DEMO_HOTEL.currency,
        taxMode: "included",
        lines,
        subtotal,
        taxTotal: lines.reduce((sum, l) => sum + l.taxAmount, 0),
        discountTotal,
        total: amount,
        issuedAt,
        dueAt: issuedAt,
      });
      for (const p of own) p.invoiceId = invoiceId;
    };

    if (s.status === "checked_out" && checkedOutAt) {
      const balance = total - paid;
      if (balance > 0) {
        own.push(
          pay(
            balance,
            paid > 0 ? "balance" : "full",
            rng.weighted([
              ["card_terminal", 70],
              ["cash", 15],
              ["bank_transfer", 15],
            ] as const),
            checkedOutAt,
          ),
        );
      }
      const lines: InvoiceLine[] = [
        {
          description: `${rt.name} · ${plan.name} · ${nights.length} ${nights.length === 1 ? "night" : "nights"}`,
          quantity: 1,
          unitAmount: roomsTotal,
          total: roomsTotal,
          taxRateBp: VAT_BP,
          taxMode: "included",
          taxAmount: taxFromInclusive(roomsTotal, VAT_BP),
        },
        ...extraLines,
      ];
      if (discount > 0) {
        lines.push({
          description: `Discount (${promoCodeId === lakes10.id ? lakes10.code : welcome20.code})`,
          quantity: 1,
          unitAmount: -discount,
          total: -discount,
          taxRateBp: VAT_BP,
          taxMode: "included",
          taxAmount: -taxFromInclusive(discount, VAT_BP),
        });
      }
      issueInvoice(total, checkedOutAt, lines, discount);
    } else if (s.status === "cancelled" && cancelledAt && paid > 0) {
      const freeUntil = addDays(s.checkIn, -2);
      const cancelledOn = cancelledAt.toISOString().slice(0, 10);
      if (policy === flexible && cancelledOn <= freeUntil) {
        pay(-paid, "refund", "stripe", notAfterNow(new Date(cancelledAt.getTime() + 30 * 60_000)));
      }
    } else if (s.status === "no_show" && direct) {
      const charge = percentOf(total, policy.noShowChargeBp);
      const noShowAt = notAfterNow(at(addDays(s.checkIn, 1), "09:15"));
      if (charge > paid) own.push(pay(charge - paid, "balance", "stripe", noShowAt));
      const amount = Math.max(charge, paid);
      issueInvoice(
        amount,
        noShowAt,
        [
          {
            description: `No-show charge · ${rt.name} · ${nights.length} ${nights.length === 1 ? "night" : "nights"}`,
            quantity: 1,
            unitAmount: amount,
            total: amount,
            taxRateBp: VAT_BP,
            taxMode: "included",
            taxAmount: taxFromInclusive(amount, VAT_BP),
          },
        ],
        0,
      );
    }
  });
  welcome20.usedCount = welcomeUses;

  // Invoice numbers: 1…N in order of issue, gap-free.
  pendingInvoices.sort((a, b) => a.issuedAt.getTime() - b.issuedAt.getTime());
  const invoices: SeedPlan["invoices"] = pendingInvoices.map((inv, i) => ({
    ...inv,
    number: i + 1,
  }));

  guests.forEach((g, i) => {
    g.noShowCount = noShows.get(i) ?? 0;
    g.source = firstSource.get(i) ?? "other";
  });

  // ── Operations: today's board ──────────────────────────────────────────────
  const staysToday = stays.filter((s) => s.roomName && s.checkIn <= today && s.checkOut >= today);
  const roomStatus = new Map<string, (typeof schema.roomStatusEnum.enumValues)[number]>();
  roomStatus.set(OUT_OF_ORDER_ROOM, "out_of_order");
  const housekeepingTasks: SeedPlan["housekeepingTasks"] = [];
  const task = (
    roomName: string,
    type: (typeof schema.housekeepingTaskTypeEnum.enumValues)[number],
    status: (typeof schema.housekeepingTaskStatusEnum.enumValues)[number],
    reservationId: string | null,
    notes: string | null = null,
  ) =>
    housekeepingTasks.push({
      id: createId(),
      hotelId,
      roomId: roomIdByName.get(roomName)!,
      reservationId,
      date: today,
      type,
      status,
      assignedToUserId: status === "todo" && rng.chance(0.4) ? null : userId("housekeeping"),
      notes,
      completedAt: status === "done" ? notAfterNow(at(today, "10:40")) : null,
    });
  for (const s of staysToday) {
    const name = s.roomName!;
    if (s.checkOut === today) {
      task(name, "departure_clean", s.status === "checked_out" ? "in_progress" : "todo", s.id);
      if (s.status === "checked_out") roomStatus.set(name, "dirty");
    } else if (s.checkIn < today) {
      task(name, "stayover", rng.pick(["todo", "done"] as const), s.id);
    } else if (GUESTS[s.guestIdx]!.vip) {
      task(name, "inspection", "todo", s.id, "VIP arriving today");
    }
  }
  task(OUT_OF_ORDER_ROOM, "maintenance", "todo", null, "Plumber booked for tomorrow morning");
  for (const room of rooms) {
    if (!roomStatus.has(room.name) && rng.chance(0.2)) roomStatus.set(room.name, "inspected");
    room.status = roomStatus.get(room.name) ?? "clean";
  }
  const maintenanceIssues: SeedPlan["maintenanceIssues"] = [
    {
      id: createId(),
      hotelId,
      roomId: roomIdByName.get(OUT_OF_ORDER_ROOM)!,
      title: "Shower tray leaking into the room below",
      description: "Water marks on the ceiling of room 3. Room closed until the tray is resealed.",
      severity: "high",
      status: "open",
      reportedByUserId: userId("housekeeping"),
      createdAt: notAfterNow(at(addDays(today, -1), "10:15")),
    },
    {
      id: createId(),
      hotelId,
      roomId: roomIdByName.get("3")!,
      title: "Bedside lamp flickering",
      severity: "low",
      status: "resolved",
      reportedByUserId: userId("reception"),
      createdAt: notAfterNow(at(addDays(today, -9), "16:00")),
      resolvedAt: notAfterNow(at(addDays(today, -8), "11:30")),
    },
  ];

  const pendingIds = new Set(pendingCandidates.map((s) => s.id));
  const notifications: SeedPlan["notifications"] = reservations
    .filter((r) => pendingIds.has(r.id))
    .map((r) => ({
      id: createId(),
      hotelId,
      userId: userId("owner"),
      type: "reservation.pending_validation",
      payload: { reservationId: r.id, reference: r.reference, checkIn: r.checkIn },
      createdAt: r.createdAt,
    }));

  return {
    hotel,
    users,
    memberships,
    cancellationPolicies: [flexible, nonRefundable],
    taxRates: [vat, zeroRate],
    roomTypes,
    rooms,
    ratePlans,
    priceAdjustments,
    extras,
    packages: [fiveNights],
    promoCodes: [lakes10, welcome20],
    guests,
    guestCompanions,
    guestPreferences,
    guestPackages,
    reservations,
    reservationRooms,
    reservationExtras,
    reservationStatusHistory: history,
    invoices,
    payments,
    hotelCounters: [
      { hotelId, name: "reservation", value: reservations.length },
      { hotelId, name: "invoice", value: invoices.length },
    ],
    housekeepingTasks,
    maintenanceIssues,
    notifications,
  };
}
