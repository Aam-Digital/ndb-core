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
 * Rename the reserved sections of the Config:Permissions document from their
 * legacy names (`default`, `public`) to the underscore-prefixed names
 * (`_default`, `_public`). The underscore marks them as internal so they can
 * never collide with a Keycloak realm role of the same name.
 *
 * The renamed key wins if both spellings are present (matching the read-path
 * precedence in the app and backend), so the legacy key is always dropped.
 * Only an existing document is touched; role sections and all other keys are
 * left untouched. Idempotent: once renamed there are no legacy keys left, so
 * a re-run is a no-op.
 */
export const permissionsKeyRename: MigrationDefinition = {
  id: "oneoff-20260724-permissions-key-rename",
  description:
    "Rename reserved Config:Permissions sections default/public to _default/_public so they cannot collide with Keycloak role names. Safe to re-run.",

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
      if (!(legacy in newData)) {
        continue;
      }
      // the renamed key wins if present; the legacy key is always removed
      if (!(renamed in newData)) {
        newData[renamed] = newData[legacy];
        ctx.log.info(`Renaming "${legacy}" section to "${renamed}"`);
      } else {
        ctx.log.info(
          `Dropping legacy "${legacy}" section ("${renamed}" already present)`,
        );
      }
      delete newData[legacy];
      changed = true;
    }

    if (!changed) {
      ctx.log.info("No legacy permission section keys found");
      return { changed: false, status: "no-change" };
    }

    const newDoc = { ...doc, data: newData };
    ctx.validateJson(newDoc);
    await ctx.put(PERMISSIONS_DOC_PATH, newDoc);

    return { changed: true, status: ctx.dryRun ? "dry-run" : "ok" };
  },
};
