import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierRecommended from "eslint-plugin-prettier/recommended";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierRecommended,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "components/ui/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
