import type {
  MigrationDefinition,
  MigrationResult,
} from "./migration-definition.js";

const PERMISSIONS_DOC_PATH = "/app/Config:Permissions";

interface PermissionsDoc {
  _id: string;
  _rev: string;
  data?: Record<string, unknown>;
}

const LEGACY_KEYS: { legacy: string; renamed: string }[] = [
  { legacy: "default", renamed: "_default" },
  { legacy: "public", renamed: "_public" },
];

/**
 * Remove the legacy (non-underscore-prefixed) `default`/`public` sections
 * from the Config:Permissions document, now that the underscore-prefixed
 * `_default`/`_public` sections exist to replace them.
 *
 * `permissionsKeyRename` (see permissions-key-rename.migration.ts) copies
 * `default`/`public` into `_default`/`_public` but deliberately leaves the
 * legacy keys in place, so that app versions predating that change keep
 * reading permissions correctly during a staged rollout. This migration is
 * the follow-up cleanup step — run it only once every environment/app
 * version reading this config is confirmed to read the underscore-prefixed
 * keys.
 *
 * A legacy key is only removed if its underscore-prefixed replacement is
 * already present, so this can never cause a net loss of permission rules.
 * Only an existing document is touched; role sections and all other keys are
 * left untouched. Idempotent: once the legacy keys are gone, a re-run is a
 * no-op.
 */
export const permissionsKeyLegacyCleanup: MigrationDefinition = {
  id: "oneoff-20260804-permissions-key-legacy-cleanup",
  description:
    "Remove legacy Config:Permissions sections default/public once _default/_public exist. Run only after all app versions read the underscore-prefixed keys. Safe to re-run.",

  async run(ctx): Promise<MigrationResult> {
    let doc: PermissionsDoc;
    try {
      doc = await ctx.couchdb.get<PermissionsDoc>(PERMISSIONS_DOC_PATH);
    } catch (error: unknown) {
      if ((error as { status?: number }).status === 404) {
        ctx.log.info("No Config:Permissions document; nothing to migrate");
        return { changed: false, status: "no-change" };
      }
      throw error;
    }

    const data = doc.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      ctx.log.info(
        "Config:Permissions has no rules object; nothing to migrate",
      );
      return { changed: false, status: "no-change" };
    }

    const newData: Record<string, unknown> = { ...data };
    let changed = false;
    for (const { legacy, renamed } of LEGACY_KEYS) {
      if (!(legacy in newData) || !(renamed in newData)) {
        continue;
      }
      ctx.log.info(
        `Removing legacy "${legacy}" section ("${renamed}" already present)`,
      );
      delete newData[legacy];
      changed = true;
    }

    if (!changed) {
      ctx.log.info("No legacy permission section keys to remove");
      return { changed: false, status: "no-change" };
    }

    const newDoc = { ...doc, data: newData };
    ctx.validateJson(newDoc);
    await ctx.put(PERMISSIONS_DOC_PATH, newDoc);

    return { changed: true, status: ctx.dryRun ? "dry-run" : "ok" };
  },
};
