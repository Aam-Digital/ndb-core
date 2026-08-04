import { migrateShortcutDashboardLinks } from "../../src/app/core/config/config-migrations.js";
import type {
  MigrationDefinition,
  MigrationResult,
} from "./migration-definition.js";
import { CONFIG_DOC_PATH } from "./migrations.js";

/**
 * Persist the `/c/` link-prefix fix for ShortcutDashboard widgets to the
 * stored Config:CONFIG_ENTITY document.
 *
 * ConfigService already applies `migrateShortcutDashboardLinks` transiently
 * on every config load (see config-migrations.ts), so a running app already
 * renders correct links. This migration writes that same fix back to the
 * database, so the raw config document (as seen in the Admin UI, exports,
 * or any other consumer that doesn't go through ConfigService) is correct
 * too, and instances running an older app version that predates the
 * transient migration aren't left with dead links.
 *
 * Idempotent: once a link carries the `/c/` prefix, `migrateShortcutDashboardLinks`
 * leaves it unchanged, so a re-run is a no-op.
 */
export const shortcutDashboardLinkPrefix: MigrationDefinition = {
  id: "oneoff-20260804-shortcut-dashboard-link-prefix",
  description:
    "Prefix ShortcutDashboard widget shortcut links pointing to known entity routes with /c/, matching the runtime migration in ConfigService. Safe to re-run.",

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

    const newConfig = migrateShortcutDashboardLinks(
      "",
      JSON.parse(JSON.stringify(config)),
    );
    ctx.validateJson(newConfig);

    const changed = JSON.stringify(config) !== JSON.stringify(newConfig);
    if (!changed) {
      ctx.log.info("No ShortcutDashboard links needed the /c/ prefix");
      return { changed: false, status: "no-change" };
    }

    ctx.log.info("ShortcutDashboard links require the /c/ prefix");
    await ctx.put(CONFIG_DOC_PATH, newConfig);

    return { changed: true, status: ctx.dryRun ? "dry-run" : "ok" };
  },
};
