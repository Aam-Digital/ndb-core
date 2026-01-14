import * as path from "node:path";
import { defineConfig } from "eslint/config";
import angular from "angular-eslint";
import prettier from "eslint-plugin-prettier/recommended";
import storybook from "eslint-plugin-storybook";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import jsonc from "eslint-plugin-jsonc";

export default defineConfig([
  { ignores: [".angular", "dist", "doc/compodoc", "test-results/**"] },
  prettier,
  {
    files: ["src/**/*.ts"],

    extends: [...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/prefer-standalone": ["warn"],

      "@angular-eslint/component-selector": [
        "error",
        {
          prefix: "app",
          style: "kebab-case",
          type: "element",
        },
      ],

      "@angular-eslint/directive-selector": [
        "error",
        {
          prefix: "app",
          style: "camelCase",
          type: "attribute",
        },
      ],

      "@angular-eslint/no-output-native": "off",
    },
  },
  {
    files: ["e2e/**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: path.join(import.meta.dirname, "e2e"),
      },
    },
    rules: {
      "no-restricted-imports": [
        "error",
        "@playwright/test",
        "@argos-ci/playwright",
      ],
    },
  },
  {
    files: ["src/**/*.html"],

    extends: [...angular.configs.templateRecommended],
  },
  ...storybook.configs["flat/recommended"],
  {
    files: ["**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)"],

    rules: {
      "storybook/story-exports": "off",
    },
  },
  // JSON files linting
  ...jsonc.configs["flat/recommended-with-json"],
  // JSONC files (JSON with comments - tsconfig, VS Code config, etc.)
  ...jsonc.configs["flat/recommended-with-jsonc"],
  // VS Code config files allow comments and trailing commas
  {
    files: [".vscode/*.json"],
    rules: {
      "jsonc/no-comments": "off",
      "jsonc/comma-dangle": "off",
    },
  },
]);
