import { createId } from "@paralleldrive/cuid2";
import { text, timestamp } from "drizzle-orm/pg-core";

/** cuid2 primary key, generated app-side so ids are known before insert. */
export const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createId());

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const deletedAt = () => timestamp("deleted_at", { withTimezone: true });

export const timestamps = () => ({ createdAt: createdAt(), updatedAt: updatedAt() });
