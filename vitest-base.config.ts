// Learn more about Vitest configuration options at https://vitest.dev/config/

import { defineConfig } from "vitest/config";
import { availableParallelism } from "node:os";

/**
 * Cap the number of parallel test workers.
 *
 * Each Vitest fork runs a full Angular TestBed + jsdom and holds on to a lot of
 * memory. Vitest's default is `cpus - 1` (i.e. 17 forks on an 18-core laptop),
 * which exhausts RAM on developer machines. Note that non-interactive runs
 * (CI, agents) get the *higher* default, since watch mode halves it.
 *
 * Override with `VITEST_MAX_WORKERS`, either as a count (`4`) or as a share of
 * the available cores (`50%`), when you want a different trade-off.
 */
const workersOverride = process.env.VITEST_MAX_WORKERS;
const maxWorkers = workersOverride?.endsWith("%")
  ? workersOverride
  : Number(workersOverride) ||
    Math.max(1, Math.min(4, availableParallelism() - 1));

export default defineConfig({
  test: {
    globals: true,
    /**
     * Use jsdom, not happy-dom.
     *
     * The Angular unit-test builder picks happy-dom whenever it merely *resolves*
     * in node_modules — here only as a transitive dependency; `jsdom` is what this
     * project actually declares. That default breaks zone.js, which patches DOM
     * classes by copying enumerable prototype members: happy-dom declares them as
     * ES class methods (non-enumerable), so the patched `MutationObserver` ends up
     * with nothing but a constructor. Any spec opening a CDK overlay then fails in
     * teardown with "_detachContentMutationObserver.observe is not a function".
     */
    environment: "jsdom",
    maxWorkers,
    sequence: {
      hooks: "list",
    },
    exclude: [
      "src/polyfills.test.ts",
      "src/environments/environment.spec.ts",
      "src/app/utils/expect-entity-data.spec.ts",
      "src/app/core/entity/entity-actions/cascading-entity-action.spec.ts",
    ],
  },
});
