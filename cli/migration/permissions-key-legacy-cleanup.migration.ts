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
 * Leave only the underscore-prefixed `_default`/`_public` sections in the
 * Config:Permissions document, removing the legacy (non-prefixed)
 * `default`/`public` sections. The underscore prefix marks a section as
 * internal so it can never collide with a Keycloak realm role of the same name.
 *
 * Per section: if only the legacy key exists, its rules are moved to the
 * underscore-prefixed key; if both exist, the legacy key is deleted, because
 * the underscore-prefixed key wins on read anyway. So this never causes a net
 * loss of permission rules.
 *
 * Only an existing document is touched; role sections and all other keys are
 * left untouched. Idempotent: once the legacy keys are gone, a re-run is a
 * no-op.
 */
export const permissionsKeyLegacyCleanup: MigrationDefinition = {
  id: "v4-upgrade-permissions-key-legacy-cleanup",
  description:
    "Move/remove legacy Config:Permissions sections default/public so only _default/_public remain. Safe to re-run.",

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
      if (!(legacy in newData)) {
        continue;
      }
      if (renamed in newData) {
        ctx.log.info(
          `Removing legacy "${legacy}" section ("${renamed}" already present)`,
        );
      } else {
        newData[renamed] = newData[legacy];
        ctx.log.info(`Moving legacy "${legacy}" section to "${renamed}"`);
      }
      delete newData[legacy];
      changed = true;
    }

    if (!changed) {
      ctx.log.info("No legacy permission section keys to migrate");
      return { changed: false, status: "no-change" };
    }

    const newDoc = { ...doc, data: newData };
    ctx.validateJson(newDoc);
    await ctx.put(PERMISSIONS_DOC_PATH, newDoc);

    return { changed: true, status: ctx.dryRun ? "dry-run" : "ok" };
  },
};
