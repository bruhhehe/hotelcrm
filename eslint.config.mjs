import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Tenant isolation: app code reaches tenant data only through `db.forHotel(hotelId)`.
    // The raw handle is for the data layer itself, auth, hotel resolution and scripts.
    files: ["app/**", "components/**", "lib/**"],
    ignores: ["lib/db/**", "lib/auth/**", "lib/hotels/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/db",
              importNames: ["getDb"],
              message: "Use db.forHotel(hotelId) so the query is scoped to one hotel.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      ".claude/**",
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "next-env.d.ts",
      "drizzle/**",
    ],
  },
];

export default eslintConfig;
