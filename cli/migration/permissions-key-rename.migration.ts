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

const RENAMES: { legacy: string; renamed: string }[] = [
  { legacy: "default", renamed: "_default" },
  { legacy: "public", renamed: "_public" },
];

/**
 * Ensure both the legacy reserved section names (`default`, `public`) and
 * their underscore-prefixed counterparts (`_default`, `_public`) exist on
 * the Config:Permissions document, copying whichever side is present into
 * whichever is missing. The underscore-prefixed form marks the section as
 * internal so it can never collide with a Keycloak realm role of the same
 * name.
 *
 * Copying is one-way per key, never a merge: an existing key (on either
 * side) is never overwritten, only a missing one is filled in from the
 * other. This keeps both forms in sync for backwards compatibility — app
 * versions predating the underscore-prefixed form keep working, and if
 * `permissionsKeyLegacyCleanup` (see permissions-key-legacy-cleanup.migration.ts)
 * already removed the legacy key on this instance, re-running this
 * migration recreates it from `_default`/`_public` rather than leaving it
 * missing. The underscore-prefixed key always wins on read when both are
 * present (matching the read-path precedence in the app and backend), so
 * this never changes which rules actually apply.
 *
 * Only an existing document is touched; role sections and all other keys are
 * left untouched. Idempotent: once both forms of a key exist, a re-run
 * leaves them untouched, so a re-run is a no-op.
 */
export const permissionsKeyRename: MigrationDefinition = {
  id: "oneoff-20260724-permissions-key-rename",
  description:
    "Sync reserved Config:Permissions sections default/public with _default/_public, copying whichever side is missing from the other. Safe to re-run.",

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
    for (const { legacy, renamed } of RENAMES) {
      if (legacy in newData && !(renamed in newData)) {
        newData[renamed] = newData[legacy];
        ctx.log.info(`Adding "${renamed}" section (copied from "${legacy}")`);
        changed = true;
      } else if (renamed in newData && !(legacy in newData)) {
        newData[legacy] = newData[renamed];
        ctx.log.info(`Adding "${legacy}" section (copied from "${renamed}")`);
        changed = true;
      }
    }

    if (!changed) {
      ctx.log.info(
        "Legacy and underscore-prefixed permission section keys already in sync",
      );
      return { changed: false, status: "no-change" };
    }

    const newDoc = { ...doc, data: newData };
    ctx.validateJson(newDoc);
    await ctx.put(PERMISSIONS_DOC_PATH, newDoc);

    return { changed: true, status: ctx.dryRun ? "dry-run" : "ok" };
  },
};
