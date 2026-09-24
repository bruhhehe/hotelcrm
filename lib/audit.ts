import "server-only";
import type { HotelDb } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

/** Append to the hotel's audit log (spec §3: every mutation on money and status). */
export async function audit(
  hdb: HotelDb,
  entry: {
    actorUserId: string;
    action: "create" | "update" | "delete";
    entityType: string;
    entityId: string;
    before?: unknown;
    after?: unknown;
  },
): Promise<void> {
  await hdb.insert(auditLog, {
    actorKind: "user",
    actorUserId: entry.actorUserId,
    action: `${entry.entityType}.${entry.action}`,
    entityType: entry.entityType,
    entityId: entry.entityId,
    changes:
      entry.before === undefined && entry.after === undefined
        ? null
        : { before: entry.before, after: entry.after },
  });
}
