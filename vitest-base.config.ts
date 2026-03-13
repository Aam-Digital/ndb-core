// Learn more about Vitest configuration options at https://vitest.dev/config/

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    sequence: {
      hooks: "list",
    },
    exclude: [
      "src/polyfills.test.ts",
      "src/environments/environment.spec.ts",
      "src/app/utils/expect-entity-data.spec.ts",
      "src/app/utils/test-utils/mock-ng-on-changes.spec.ts",
      "src/app/core/entity/entity-actions/cascading-entity-action.spec.ts",
    ],
  },
});
