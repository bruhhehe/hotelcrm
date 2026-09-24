import "server-only";
import { parseServerEnv } from "./schema";

/** Validated server env. Throws at boot with every bad key listed if anything is malformed. */
export const env = parseServerEnv(process.env);

/** The app's database: DATABASE_URL, else POSTGRES_URL (the name Vercel's integration also sets). */
export const databaseUrl = env.DATABASE_URL ?? env.POSTGRES_URL;
