import { defineConfig } from "eslint/config";
import angular from "angular-eslint";
import prettier from "eslint-plugin-prettier/recommended";
import storybook from "eslint-plugin-storybook";

export default defineConfig([
  { ignores: [".angular", "dist", "doc/compodoc"] },
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
]);
