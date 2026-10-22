import type {
  MigrationDefinition,
  MigrationResult,
} from "./migration-definition.js";
import { CONFIG_DOC_PATH } from "./migrations.js";

const REMOVED_LOADER_METHOD = "HistoricalDataService";
const LEGACY_COMPONENT = "HistoricalDataComponent";
const ENTITY_TYPE = "HistoricalEntityData";
/** the field of HistoricalEntityData records that the removed loader matched against the viewed record */
const RELATION_PROPERTY = "relatedEntity";

type ConfigObject = Record<string, unknown>;

function isObject(value: unknown): value is ConfigObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Rewrite one config object that uses the removed loader to the generic
 * RelatedEntities filter on the `relatedEntity` field.
 * Mutates and returns the given object.
 */
function migrateConfigPart(part: ConfigObject): ConfigObject {
  if (part["component"] === LEGACY_COMPONENT) {
    part["component"] = "RelatedEntities";
    // the legacy component took its columns as a plain array
    const config = Array.isArray(part["config"])
      ? { columns: part["config"] }
      : (part["config"] ?? {});
    part["config"] = config;
    if (isObject(config)) {
      config["entityType"] = ENTITY_TYPE;
      setRelationProperty(config);
    }
  }

  const config = part["config"];
  if (isObject(config) && config["loaderMethod"] === REMOVED_LOADER_METHOD) {
    delete config["loaderMethod"];
    config["entityType"] ??= ENTITY_TYPE;
    setRelationProperty(config);
  }

  return part;
}

/**
 * Explicit, rather than inferred from the entity schema: older configs may not
 * declare `relatedEntity` as an entity reference, and then the inferred filter
 * would match all records instead of only those of the viewed record.
 */
function setRelationProperty(config: ConfigObject) {
  config["property"] ??= RELATION_PROPERTY;
}

/**
 * Walk the whole config and migrate every component config using the removed
 * `HistoricalDataService` loader (or the legacy `HistoricalDataComponent`).
 */
export function migrateHistoricalDataLoader(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => migrateHistoricalDataLoader(item));
  }
  if (!isObject(value)) {
    return value;
  }

  const migrated = migrateConfigPart(value);
  for (const key of Object.keys(migrated)) {
    migrated[key] = migrateHistoricalDataLoader(migrated[key]);
  }
  return migrated;
}

/**
 * The `HistoricalDataService` special loader has been removed (v4).
 * Rewrite configs that still reference it — `loaderMethod: "HistoricalDataService"`
 * or the legacy `HistoricalDataComponent` — to a plain RelatedEntities list of
 * `HistoricalEntityData` filtered by `relatedEntity`, which shows the same records.
 * A config still using the removed loader fails to load its records.
 *
 * Idempotent: once migrated, no reference to the loader or the legacy component
 * is left, so a re-run is a no-op.
 */
export const historicalDataLoader: MigrationDefinition = {
  id: "oneoff-20261022-historical-data-loader",
  description:
    'Replace the removed "HistoricalDataService" loaderMethod (and legacy HistoricalDataComponent) with a generic RelatedEntities filter on "relatedEntity". Safe to re-run.',

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
