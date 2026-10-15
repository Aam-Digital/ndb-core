import type { Couchdb } from "../lib/couchdb-client.js";

/**
 * Backups of documents as they were before a migration overwrote them,
 * kept in the same database as `_local/` documents:
 * those are never replicated to clients, do not show up in `_changes` (so backend change handlers ignore them)
 * and are not recorded by the replication-backend's audit log.
 *
 * Restore them with the `restore-backup` migration.
 */
const BACKUP_ID_PREFIX = "migration-backup:";

export interface MigrationBackup {
  /** id of the migration whose write replaced the document */
  migrationId: string;
  /** shared by all backups of one `migrate run` invocation, across orgs (see {@link backupRunTimestamp}) */
  runAt: string;
  db: string;
  docId: string;
  /** the full document before the migration's first write in this run, `null` if the migration created it */
  doc: Record<string, unknown> | null;
  /** `_rev` the migration's last write in this run produced, to detect later edits before restoring */
  writtenRev?: string;
}

/** A compact UTC timestamp like `20261015T093012Z`, identifying one run of a migration. */
export function backupRunTimestamp(date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
}

/** `_local` id (without the `_local/` prefix) of the backup of a doc */
export function backupId(
  migrationId: string,
  runAt: string,
  docId: string,
): string {
  return `${backupIdPrefix(migrationId, runAt)}${docId}`;
}

function backupIdPrefix(migrationId: string, runAt?: string): string {
  return `${BACKUP_ID_PREFIX}${migrationId}:${runAt ? runAt + ":" : ""}`;
}

/** Path to pass to {@link Couchdb.put} / {@link Couchdb.get} for the `_local` backup doc. */
export function backupPath(db: string, id: string): string {
  return `/${db}/_local/${encodeURIComponent(id)}`;
}

/** Split a context write path like `/app/Config:CONFIG_ENTITY` (or a doc id plus explicit db) into db and doc id */
export function splitDocPath(
  path: string,
  db?: string,
): { db: string; docId: string } {
  const normalized = path.replace(/^\//, "");
  if (db) return { db, docId: normalized };
  const slash = normalized.indexOf("/");
  return {
    db: normalized.slice(0, slash),
    docId: normalized.slice(slash + 1),
  };
}

/**
 * All backups of the given migration in a database, optionally only those of one run.
 * Sorted by run timestamp (oldest first).
 */
export async function listBackups(
  couchdb: Couchdb,
  db: string,
  migrationId: string,
  runAt?: string,
): Promise<MigrationBackup[]> {
  const prefix = `_local/${backupIdPrefix(migrationId, runAt)}`;
  const query = new URLSearchParams({
    include_docs: "true",
    startkey: JSON.stringify(prefix),
    endkey: JSON.stringify(prefix + "￰"),
  });
  // Couchdb.get unwraps the `rows` of a view response
  const rows = await couchdb.get<{ id: string; doc?: MigrationBackup }[]>(
    `/${db}/_local_docs?${query}`,
  );
  const backups = await Promise.all(
    rows.map(
      async (row) =>
        // load the doc separately if this CouchDB version ignores include_docs for _local docs
        row.doc ??
        couchdb.get<MigrationBackup>(
          backupPath(db, row.id.replace(/^_local\//, "")),
        ),
    ),
  );
  return backups
    .filter((doc) => !!doc?.migrationId)
    .sort((a, b) => a.runAt.localeCompare(b.runAt));
}
