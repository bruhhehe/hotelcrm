/**
 * What each staff role may do (spec §6.5). Owners and managers run everything; reception
 * handles reservations, guests and payments but no settings; housekeeping sees only the
 * housekeeping board; read-only staff see dashboards and data. Pages check `can()` before
 * rendering and server actions check it again before writing.
 */
export type Role = "owner" | "manager" | "reception" | "housekeeping" | "readonly";

const MATRIX = {
  /** See rooms, rates and availability (needed to take a booking). */
  "inventory.view": ["owner", "manager", "reception", "readonly"],
  /** Change room types, rooms, rate plans, prices, capacity and stay rules. */
  "inventory.manage": ["owner", "manager"],
  /** Open the settings area. */
  "settings.view": ["owner", "manager"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof MATRIX;

export function can(role: Role, permission: Permission): boolean {
  return (MATRIX[permission] as readonly Role[]).includes(role);
}
