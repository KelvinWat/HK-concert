import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".data/**",
  ]),
  {
    files: ["src/lib/importer/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["next", "next/*", "react", "react-dom"],
              message:
                "The importer must stay independent of the Next.js app so it can run as a standalone CLI.",
            },
            {
              group: ["@/app/**", "@/components/**", "@/lib/data/**"],
              message:
                "The importer may only use types and framework-free helpers, not app or repository code.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/importer/**"],
              message:
                "The app must not depend on the importer; imports arrive through the database.",
            },
          ],
        },
      ],
    },
  },
]);
