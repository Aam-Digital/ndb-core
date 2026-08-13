import {
  failedMigrationResult,
  type MigrationDefinition,
  type MigrationResult,
} from "./migration-definition.js";
import { CONFIG_DOC_PATH } from "./migrations.js";

const MAP_CONFIG_KEY = "appConfig:map";

/** The part of the app's map config this migration touches. */
interface MapConfig {
  countrycodes?: string;
}

/**
 * Set the country filter for the address lookup, e.g.
 * `migrate run set-map-countrycodes de`.
 *
 * Without this setting an instance searches worldwide. It used to be filtered
 * to Germany by a hardcoded default in the app, so systems that want to keep
 * that (and the shortened German address format that comes with it) need the
 * value written to their config. Run it with `de` before deploying the app
 * version that drops the default, so those systems never see worldwide results
 * in between.
 *
 * Overwrites whatever is configured, since the value is named on the command
 * line, and reports when it replaces a different one. Re-running with the same
 * value changes nothing.
 */
export const setMapCountrycodes: MigrationDefinition = {
  id: "set-map-countrycodes",
  description:
    "Set the address lookup country filter, e.g. `migrate run set-map-countrycodes de`. Takes a comma-separated list of country codes.",

  async run(ctx): Promise<MigrationResult> {
    const countrycodes = ctx.args[0]?.trim();
    if (!countrycodes) {
      return failedMigrationResult(
        "No country code given. Pass it after the migration id, e.g. `migrate run set-map-countrycodes de`",
      );
    }

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

    const mapConfig = data[MAP_CONFIG_KEY] as MapConfig | undefined;
    const current = mapConfig?.countrycodes;
    if (current === countrycodes) {
      ctx.log.info(
        `Country filter already set to "${countrycodes}", leaving it unchanged`,
      );
      return { changed: false, status: "no-change" };
    }
    if (current) {
      ctx.log.warn(
        `Replacing country filter "${current}" with "${countrycodes}"`,
      );
    }

    const newConfig = {
      ...config,
      data: {
        ...data,
        [MAP_CONFIG_KEY]: { ...mapConfig, countrycodes },
      },
    };
    ctx.validateJson(newConfig);
    await ctx.put(CONFIG_DOC_PATH, newConfig);

    ctx.log.info(`Country filter for address lookup set to "${countrycodes}"`);
    return { changed: true, status: ctx.dryRun ? "dry-run" : "ok" };
  },
};
