/**
 * Fixed demo data for The Fell View Hotel (spec §7). Fictional throughout: every guest email is
 * on a reserved example domain and every UK phone number is in Ofcom's drama range, so seeded
 * data can never reach a real person.
 */

export const DEMO_HOTEL = {
  name: "The Fell View Hotel",
  slug: "fell-view",
  timezone: "Europe/London",
  currency: "GBP",
  locale: "en",
  phone: "+447700900100",
  email: "stay@fellview.demo",
  address: {
    line1: "Lake Road",
    city: "Keswick",
    region: "Cumbria",
    postcode: "CA12 5DJ",
    country: "GB",
  },
} as const;

export const DEMO_EMAIL_DOMAIN = "fellview.demo";

export const STAFF = [
  { name: "Robert Armitage", email: "robert@fellview.demo", role: "owner" },
  { name: "Sarah Wilkinson", email: "sarah@fellview.demo", role: "manager" },
  { name: "Tom Birkett", email: "tom@fellview.demo", role: "reception" },
  { name: "Maria Santos", email: "maria@fellview.demo", role: "housekeeping" },
  { name: "Priya Shah", email: "priya@fellview.demo", role: "readonly" },
] as const;

export type RoomTypeKey = "cosy" | "classic" | "king" | "family" | "cottage";

export const ROOM_TYPES: readonly {
  key: RoomTypeKey;
  name: string;
  description: string;
  baseOccupancy: number;
  maxOccupancy: number;
  bedConfig: string;
  amenities: string[];
  price: number;
  floor: string | null;
  rooms: string[];
}[] = [
  {
    key: "cosy",
    name: "Cosy Double",
    description: "A snug double at the back of the house, looking over the garden.",
    baseOccupancy: 2,
    maxOccupancy: 2,
    bedConfig: "1 double",
    amenities: ["Shower", "Tea and coffee", "Wi-Fi"],
    price: 9500,
    floor: "Ground",
    rooms: ["1", "2", "3", "4"],
  },
  {
    key: "classic",
    name: "Classic Double",
    description: "Our most popular room, with a king-size bed and a view of the lane.",
    baseOccupancy: 2,
    maxOccupancy: 2,
    bedConfig: "1 king",
    amenities: ["Bath and shower", "Tea and coffee", "Wi-Fi", "Desk"],
    price: 12500,
    floor: "First",
    rooms: ["5", "6", "7", "8"],
  },
  {
    key: "king",
    name: "Fell View King",
    description: "A large room at the front with views straight up to Skiddaw.",
    baseOccupancy: 2,
    maxOccupancy: 2,
    bedConfig: "1 super-king",
    amenities: ["Bath and shower", "Fell views", "Nespresso", "Wi-Fi", "Robes"],
    price: 16500,
    floor: "Second",
    rooms: ["9", "10", "11"],
  },
  {
    key: "family",
    name: "Family Suite",
    description: "A double plus a twin room for the children, sharing one bathroom.",
    baseOccupancy: 2,
    maxOccupancy: 4,
    bedConfig: "1 king + 2 singles",
    amenities: ["Bath and shower", "Tea and coffee", "Wi-Fi", "Cot on request"],
    price: 21000,
    floor: "Second",
    rooms: ["12", "13"],
  },
  {
    key: "cottage",
    name: "Garden Cottage",
    description: "A converted stone barn with its own door, wood burner and dog-friendly garden.",
    baseOccupancy: 2,
    maxOccupancy: 3,
    bedConfig: "1 king + sofa bed",
    amenities: ["Wood burner", "Kitchenette", "Private garden", "Dogs welcome", "Wi-Fi"],
    price: 24500,
    floor: null,
    rooms: ["Garden Cottage"],
  },
];

/** Room taken out of order today, with its maintenance issue. */
export const OUT_OF_ORDER_ROOM = "7";

export type RatePlanKey = "room_only" | "bnb" | "nonref";

/** Three plans offered on every room type (15 rate_plans rows). */
export const RATE_PLANS: readonly {
  key: RatePlanKey;
  name: string;
  includesBreakfast: boolean;
  /** Added to the room type's price per night (B&B), or basis points off (non-refundable). */
  nightlyExtra: number;
  discountBp: number;
  policy: "flexible" | "nonref";
  isDefault: boolean;
}[] = [
  {
    key: "room_only",
    name: "Room only",
    includesBreakfast: false,
    nightlyExtra: 0,
    discountBp: 0,
    policy: "flexible",
    isDefault: true,
  },
  {
    key: "bnb",
    name: "Bed & breakfast",
    includesBreakfast: true,
    nightlyExtra: 2400,
    discountBp: 0,
    policy: "flexible",
    isDefault: false,
  },
  {
    key: "nonref",
    name: "Non-refundable",
    includesBreakfast: false,
    nightlyExtra: 0,
    discountBp: 1000,
    policy: "nonref",
    isDefault: false,
  },
];

export const EXTRAS = [
  {
    key: "breakfast",
    name: "Full English breakfast",
    price: 1450,
    pricingMode: "per_guest_per_night",
    category: "breakfast",
  },
  { key: "parking", name: "Parking", price: 800, pricingMode: "per_night", category: "parking" },
  { key: "dog", name: "Dog stay", price: 1500, pricingMode: "per_night", category: "pet" },
  {
    key: "late",
    name: "Late checkout (1pm)",
    price: 2500,
    pricingMode: "per_booking",
    category: "late_checkout",
  },
  {
    key: "transfer",
    name: "Penrith station transfer",
    price: 3000,
    pricingMode: "per_booking",
    category: "transfer",
  },
  { key: "spa", name: "Spa access", price: 2000, pricingMode: "per_guest", category: "spa" },
] as const;

export type ExtraKey = (typeof EXTRAS)[number]["key"];

/** 40 fictional guests. Phones only for UK/IE guests, in the Ofcom drama range. */
export const GUESTS: readonly {
  first: string;
  last: string;
  nationality: string;
  language: string;
  partner?: string;
  children?: string[];
  vip?: boolean;
  blacklisted?: boolean;
  tags?: string[];
  pillow?: string;
  allergies?: string;
  prefersRoom?: string;
  marketing?: boolean;
}[] = [
  {
    first: "Achille",
    last: "Moreau",
    nationality: "FR",
    language: "fr",
    partner: "Claire Moreau",
    vip: true,
    tags: ["repeat"],
    pillow: "Firm",
  },
  {
    first: "Eleanor",
    last: "Hughes",
    nationality: "GB",
    language: "en",
    partner: "James Hughes",
    tags: ["walker", "repeat"],
    prefersRoom: "9",
    marketing: true,
  },
  { first: "Oliver", last: "Bennett", nationality: "GB", language: "en", tags: ["business"] },
  {
    first: "Amelia",
    last: "Clarke",
    nationality: "GB",
    language: "en",
    partner: "Sam Clarke",
    children: ["Rosie Clarke", "Alfie Clarke"],
    tags: ["family"],
  },
  {
    first: "Lukas",
    last: "Becker",
    nationality: "DE",
    language: "de",
    partner: "Anna Becker",
    tags: ["walker"],
  },
  {
    first: "Sophie",
    last: "de Vries",
    nationality: "NL",
    language: "nl",
    partner: "Daan de Vries",
  },
  {
    first: "Harriet",
    last: "Pemberton",
    nationality: "GB",
    language: "en",
    vip: true,
    tags: ["repeat"],
    allergies: "Nuts",
    marketing: true,
  },
  {
    first: "Ciarán",
    last: "O'Donnell",
    nationality: "IE",
    language: "en",
    partner: "Aoife O'Donnell",
  },
  { first: "Lucía", last: "García", nationality: "ES", language: "es", partner: "Javier Ruiz" },
  {
    first: "George",
    last: "Atkinson",
    nationality: "GB",
    language: "en",
    tags: ["dog owner"],
    pillow: "Feather-free",
  },
  { first: "Isabella", last: "Rossi", nationality: "IT", language: "en", partner: "Marco Rossi" },
  { first: "Henry", last: "Walsh", nationality: "GB", language: "en", blacklisted: true },
  {
    first: "Charlotte",
    last: "Fairbairn",
    nationality: "GB",
    language: "en",
    partner: "Ben Fairbairn",
    children: ["Isla Fairbairn"],
    tags: ["family"],
  },
  { first: "Mateo", last: "Fernández", nationality: "ES", language: "es" },
  {
    first: "Emily",
    last: "Robinson",
    nationality: "US",
    language: "en",
    partner: "Daniel Robinson",
    tags: ["walker"],
  },
  { first: "Jack", last: "Harrison", nationality: "GB", language: "en", tags: ["business"] },
  { first: "Margot", last: "Lefèvre", nationality: "FR", language: "fr", partner: "Hugo Lefèvre" },
  { first: "Felix", last: "Schneider", nationality: "DE", language: "de" },
  {
    first: "Grace",
    last: "Thornton",
    nationality: "GB",
    language: "en",
    partner: "Will Thornton",
    tags: ["dog owner", "repeat"],
  },
  {
    first: "Noah",
    last: "Jansen",
    nationality: "NL",
    language: "nl",
    partner: "Emma Jansen",
    children: ["Tess Jansen"],
  },
  { first: "Poppy", last: "Ellison", nationality: "GB", language: "en" },
  { first: "Ethan", last: "Murphy", nationality: "IE", language: "en", partner: "Niamh Murphy" },
  { first: "Chloé", last: "Dubois", nationality: "FR", language: "fr" },
  {
    first: "Samuel",
    last: "Whitaker",
    nationality: "GB",
    language: "en",
    partner: "Hannah Whitaker",
    vip: true,
    pillow: "Soft",
  },
  { first: "Olivia", last: "Brown", nationality: "CA", language: "en", partner: "Liam Brown" },
  { first: "Arthur", last: "Kendal", nationality: "GB", language: "en", tags: ["walker"] },
  { first: "Mia", last: "Hoffmann", nationality: "DE", language: "de", partner: "Jonas Hoffmann" },
  { first: "Freddie", last: "Graham", nationality: "GB", language: "en" },
  {
    first: "Ava",
    last: "Nicholson",
    nationality: "GB",
    language: "en",
    partner: "Tom Nicholson",
    children: ["Evie Nicholson", "Max Nicholson"],
  },
  { first: "Diego", last: "Morales", nationality: "ES", language: "es", partner: "Carmen Morales" },
  { first: "Isla", last: "MacLeod", nationality: "GB", language: "en", tags: ["walker"] },
  { first: "Lotte", last: "Visser", nationality: "NL", language: "nl" },
  {
    first: "William",
    last: "Dawson",
    nationality: "GB",
    language: "en",
    partner: "Kate Dawson",
    tags: ["repeat"],
  },
  { first: "Zoe", last: "Campbell", nationality: "US", language: "en" },
  { first: "Theo", last: "Marshall", nationality: "GB", language: "en", tags: ["business"] },
  { first: "Léa", last: "Martin", nationality: "FR", language: "fr", partner: "Paul Martin" },
  { first: "Jonas", last: "Weber", nationality: "DE", language: "de", partner: "Lena Weber" },
  {
    first: "Ruby",
    last: "Stephenson",
    nationality: "GB",
    language: "en",
    partner: "Joe Stephenson",
    tags: ["dog owner"],
  },
  { first: "Sean", last: "Byrne", nationality: "IE", language: "en" },
  {
    first: "Alice",
    last: "Pattinson",
    nationality: "GB",
    language: "en",
    partner: "Rob Pattinson",
    marketing: true,
  },
];

/** Index into GUESTS of the guest with three past no-shows ("HABITUAL" in the UI). */
export const HABITUAL_NO_SHOW_GUEST = 27;
