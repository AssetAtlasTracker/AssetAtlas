import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      //"no-unused-vars": "warn",
      ...pluginJs.configs.recommended.rules, 
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
    "warn",//dont worry about it. look at me. dont worry about it.
    { "varsIgnorePattern": "^_", "argsIgnorePattern": "^_" }
  ],
    },
  },
];