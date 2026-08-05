import * as path from "node:path";
import { defineConfig } from "eslint/config";
import angular from "angular-eslint";
import prettier from "eslint-plugin-prettier/recommended";
import storybook from "eslint-plugin-storybook";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import jsonc from "eslint-plugin-jsonc";

export default defineConfig([
  // ".claude" holds git worktrees (stale copies of the repo) and agent config - never lint them
  {
    ignores: [".angular", ".claude", "dist", "doc/compodoc", "test-results/**"],
  },
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
    // index.html is the static app shell, not an Angular template
    files: ["src/**/*.html"],
    ignores: ["src/index.html"],

    extends: [...angular.configs.templateRecommended],
    rules: {
      // report-only for now: flags user-facing text that is not marked for translation.
      // See #4156 - findings are still being worked through, do not raise to "error"
      // until the backlog is cleared.
      "@angular-eslint/template/i18n": [
        "warn",
        {
          checkId: false,
          checkText: true,
          checkAttributes: true,
          // structural / behavioural attributes that never hold user-facing text
          ignoreAttributes: [
            "align",
            "angulartics2On",
            "angularticsAction",
            "angularticsCategory",
            "appearance",
            "buttonType",
            "cdkDragBoundary",
            "cdkDragLockAxis",
            "cdkDropListOrientation",
            "clickMode",
            "containerId",
            "content",
            "data-testid",
            "display",
            "entityType",
            "floatLabel",
            "icon",
            "imgProperty",
            "matBadgeColor",
            "matColumnDef",
            "matTooltipPosition",
            "media",
            "mode",
            "panelClass",
            "property",
            "queryParamsHandling",
            "rel",
            "scope",
            "showLabel",
            "size",
            "startView",
            "tabIndexKey",
            "templateType",
            "theme",
            "uniqueAreaId",
          ],
        },
      ],
    },
  },
  {
    // Inline templates in tests, stories and story helpers are fixtures, not user-facing UI.
    // angular-eslint's processor matches config against a virtual "<file>.ts/<block>.html"
    // path, so the patterns need the trailing "/**".
    files: [
      "**/*.spec.ts/**",
      "**/*.stories.ts/**",
      "**/*stories-helper*.ts/**",
    ],
    rules: { "@angular-eslint/template/i18n": "off" },
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
