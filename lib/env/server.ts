import "server-only";
import { parseServerEnv } from "./schema";

/** Validated server env. Throws at boot with every bad key listed if anything is malformed. */
export const env = parseServerEnv(process.env);
