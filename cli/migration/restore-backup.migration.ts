import { listBackups, type MigrationBackup } from "./migration-backup.js";
import {
  failedMigrationResult,
  type MigrationContext,
  type MigrationDefinition,
  type MigrationResult,
} from "./migration-definition.js";
import { is404Error } from "./tracked-migration-context.js";

const USAGE_EXAMPLE =
  "migrate run restore-backup <migration-id> [<run-timestamp>]";

/** All current migrations only write to the main database, so only its backups are looked up. */
const BACKUP_DB = "app";

type Doc = Record<string, unknown> & { _id?: string; _rev?: string };

/**
 * Roll back the documents an earlier `migrate run` changed, from the backups it kept (see migration-backup.ts).
 *
 * Restores the latest run of the given migration on each org, or the run with the given timestamp
 * (printed at the end of a run, and part of the backups' `_local/migration-backup:<migration-id>:<run-timestamp>:<doc-id>` ids).
 * A document created by the migration is deleted again.
 * A document edited again after the migration is skipped with a warning, rather than discarding those later edits.
 *
 * The restore itself goes through the same backed-up writes, so it can be undone with
 * `migrate run restore-backup restore-backup`.
 */
export const restoreBackup: MigrationDefinition = {
  id: "restore-backup",
  description: `Roll back the documents an earlier migration run changed, from the backups it kept, e.g. \`${USAGE_EXAMPLE}\`. Without a timestamp, restores each org's latest run of that migration.`,

  async run(ctx): Promise<MigrationResult> {
    if (ctx.args.length < 1 || ctx.args.length > 2) {
      return failedMigrationResult(
        `Expected the id of the migration to roll back and optionally the run timestamp, e.g. \`${USAGE_EXAMPLE}\``,
      );
    }
    const [migrationId, requestedRun] = ctx.args;

    const allBackups = await listBackups(
      ctx.couchdb,
      BACKUP_DB,
      migrationId,
      requestedRun,
    );
    if (allBackups.length === 0) {
      const run = requestedRun ? " run " + requestedRun : "";
      ctx.log.info(`No backups of ${migrationId}${run}`);
      return { changed: false, status: "no-change" };
    }
    const runAt = allBackups[allBackups.length - 1].runAt;
    const backups = allBackups.filter((b) => b.runAt === runAt);
    ctx.log.info(
      `Restoring ${backups.length} document(s) to their state before ${migrationId} run ${runAt}`,
    );

    const warnings: string[] = [];
    let changed = false;
    for (const backup of backups) {
      if (await restoreDoc(ctx, backup, warnings)) changed = true;
    }

    if (!changed) return { changed: false, status: "no-change", warnings };
    return { changed: true, status: ctx.dryRun ? "dry-run" : "ok", warnings };
  },
};

/** @return whether the doc was (or in a dry run: would be) restored */
async function restoreDoc(
  ctx: MigrationContext,
  backup: MigrationBackup,
  warnings: string[],
): Promise<boolean> {
  const path = `/${backup.db}/${backup.docId}`;
  let current: Doc | undefined;
  try {
    current = await ctx.couchdb.get<Doc>(path);
  } catch (error: unknown) {
    if (!is404Error(error)) throw error;
  }

  // without a recorded write rev, the migration's write may have failed: then the doc should still be at the backed-up rev
  const expectedRev =
    backup.writtenRev ?? (backup.doc?._rev as string | undefined);
  if (current?._rev !== expectedRev) {
    warnings.push(
      `${backup.docId} not restored: it was edited after the migration (expected ${expectedRev ?? "no document"}, found ${current?._rev ?? "no document"}). Compare it to its backup and restore it manually if needed.`,
    );
    return false;
  }

  if (backup.doc === null) {
    if (!current) return false;
    ctx.log.info(`Deleting ${backup.docId}, which the migration created`);
    await ctx.put(path, {
      _id: backup.docId,
      _rev: current._rev,
      _deleted: true,
    });
    return true;
  }

  const { _rev: _backupRev, ...restored } = backup.doc as Doc;
  if (current) {
    const { _rev: _currentRev, ...currentContent } = current;
    if (JSON.stringify(currentContent) === JSON.stringify(restored)) {
      return false;
    }
  }
  await ctx.put(path, current ? { ...restored, _rev: current._rev } : restored);
  return true;
}
