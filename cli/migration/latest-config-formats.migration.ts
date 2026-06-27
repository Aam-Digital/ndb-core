import { applyConfigMigrations } from "../../src/app/core/config/config-migrations.js";
import type {
  MigrationDefinition,
  MigrationResult,
} from "./migration-definition.js";
import { CONFIG_DOC_PATH } from "./migrations.js";

export const latestConfigFormats: MigrationDefinition = {
  id: "latest-config-formats",
  description:
    "Transform any legacy config formats to their latest formats. Safe to re-run.",

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

    const newConfig = applyConfigMigrations(config);
    ctx.validateJson(newConfig);

    const changed = JSON.stringify(config) !== JSON.stringify(newConfig);

    if (!changed) {
      ctx.log.info("No changes needed");
      return { changed: false, status: "no-change" };
    }

    ctx.log.info("Config requires migration");
    await ctx.put(CONFIG_DOC_PATH, newConfig);

    return { changed: true, status: ctx.dryRun ? "dry-run" : "ok" };
  },
};
