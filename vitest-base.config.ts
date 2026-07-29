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

/**
 * Run only a slice of the spec files, as `<index>/<count>` (e.g. `2/4`).
 *
 * Isolation costs wall time, because every spec file re-imports the Angular module
 * graph into a fresh environment. CI splits the suite across parallel shards to win
 * that back; locally you normally want the whole suite, so this stays unset.
 *
 * Spread rather than assigned inline: Vitest reads `shard` at runtime, but types it
 * on `UserConfig` rather than the `InlineConfig` that `defineConfig({ test })` expects.
 */
const shard = process.env.VITEST_SHARD
  ? { shard: process.env.VITEST_SHARD }
  : {};

export default defineConfig({
  test: {
    globals: true,
    maxWorkers,
    /**
     * Run every spec file in its own environment.
     *
     * The Angular unit-test builder defaults this to `false` "to align with the
     * Karma/Jasmine experience", which makes all spec files share one module
     * registry, one `environment` singleton and one TestBed per worker. Async
     * work outliving a spec file then throws into whichever file happens to be
     * running next, so failures land on innocent specs and move between runs.
     */
    isolate: true,
    ...shard,
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
