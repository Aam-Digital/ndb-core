import type {
  MigrationDefinition,
  MigrationResult,
} from "./migration-definition.js";
import { CONFIG_DOC_PATH } from "./migrations.js";

const REMOVED_LOADER_METHOD = "HistoricalDataService";

/**
 * Remove every `loaderMethod: "HistoricalDataService"` from the config.
 * Without it, RelatedEntities loads the records through the generic relation field.
 */
export function migrateHistoricalDataLoader(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => migrateHistoricalDataLoader(item));
  }
  if (typeof value !== "object" || value === null) {
    return value;
  }

  const obj = value as Record<string, unknown>;
  if (obj["loaderMethod"] === REMOVED_LOADER_METHOD) {
    delete obj["loaderMethod"];
  }
  for (const key of Object.keys(obj)) {
    obj[key] = migrateHistoricalDataLoader(obj[key]);
  }
  return obj;
}

/**
 * The `HistoricalDataService` special loader has been removed (v4).
 * A config still using it fails to load its records, so the loaderMethod is removed.
 * (The legacy `HistoricalDataComponent` is migrated by `latest-config-formats`.)
 */
export const historicalDataLoader: MigrationDefinition = {
  id: "v4-upgrade-historical-data-loader",
  description:
    'Remove the removed "HistoricalDataService" loaderMethod from the config. Safe to re-run.',

  async run(ctx): Promise<MigrationResult> {
    let config: unknown;
    try {
      config = await ctx.couchdb.get(CONFIG_DOC_PATH);
    } catch (error: unknown) {
      if ((error as { status?: number }).status === 404) {
        return {
          changed: false,
          status: "failed",
          warnings: ["Config document not found"],
        };
      }
      const message = error instanceof Error ? error.message : String(error);
      ctx.log.error(`Failed to load config document: ${message}`);
      throw error;
    }

    const newConfig = migrateHistoricalDataLoader(
      JSON.parse(JSON.stringify(config)),
    );
    ctx.validateJson(newConfig);

    const changed = JSON.stringify(config) !== JSON.stringify(newConfig);
    if (!changed) {
      ctx.log.info("No config uses the HistoricalDataService loader");
      return { changed: false, status: "no-change" };
    }

    ctx.log.info("Config uses the removed HistoricalDataService loader");
    await ctx.put(CONFIG_DOC_PATH, newConfig);

    return { changed: true, status: ctx.dryRun ? "dry-run" : "ok" };
  },
};
