import {
  failedMigrationResult,
  type MigrationDefinition,
  type MigrationResult,
} from "./migration-definition.js";
import { CONFIG_DOC_PATH } from "./migrations.js";

const MAP_CONFIG_KEY = "appConfig:map";

/**
 * Set the map lookup country filter to Germany explicitly.
 *
 * The address lookup used to filter results to Germany through a hardcoded
 * default in the app. That default is gone, so systems that still want the
 * filter (and the shortened German address format that comes with it) have to
 * state it in their own config. Run this before deploying the app version that
 * drops the default, so those systems never see worldwide results in between.
 *
 * Only fills in a missing value: an instance that already configured
 * `countrycodes` keeps whatever it chose. Idempotent.
 */
export const mapCountrycodesDe: MigrationDefinition = {
  id: "oneoff-20260805-map-countrycodes-de",
  description:
    "Explicitly set the address lookup country filter to Germany, preserving the previous hardcoded default. Use with --category codo.",

  async run(ctx): Promise<MigrationResult> {
    let config: { data?: Record<string, unknown> };
    try {
      config = await ctx.couchdb.get<{ data?: Record<string, unknown> }>(
        CONFIG_DOC_PATH,
      );
    } catch (error: unknown) {
      if ((error as { status?: number }).status === 404) {
        return failedMigrationResult("Config document not found");
      }
      throw error;
    }

    const data = config.data;
    if (!data || typeof data !== "object") {
      return failedMigrationResult("Config document has no data object");
    }

    const mapConfig = data[MAP_CONFIG_KEY] as
      Record<string, unknown> | undefined;
    if (mapConfig?.countrycodes) {
      ctx.log.info(
        `Country filter already set to "${mapConfig.countrycodes}", leaving it unchanged`,
      );
      return { changed: false, status: "no-change" };
    }

    const newConfig = {
      ...config,
      data: {
        ...data,
        [MAP_CONFIG_KEY]: { ...mapConfig, countrycodes: "de" },
      },
    };
    ctx.validateJson(newConfig);
    await ctx.put(CONFIG_DOC_PATH, newConfig);

    ctx.log.info('Country filter for address lookup set to "de"');
    return { changed: true, status: ctx.dryRun ? "dry-run" : "ok" };
  },
};
