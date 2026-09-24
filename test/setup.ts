import { config } from "dotenv";

// Only TEST_DATABASE_URL is used by database tests; DATABASE_URL (which may point at a real
// Neon database) is never touched by the test suite.
config({ path: [".env.test.local", ".env.local"], quiet: true, override: false });
