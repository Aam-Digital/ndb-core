import diff from "microdiff";
import type { Couchdb } from "../lib/couchdb-client.js";
import type { SystemCredentials } from "../lib/credentials.js";
import {
  backupId,
  backupPath,
  type MigrationBackup,
  splitDocPath,
} from "./migration-backup.js";
import type {
  MigrationContext,
  MigrationLogger,
} from "./migration-definition.js";

/** Identifies the `migrate run` invocation whose writes are backed up. */
export interface BackupRun {
  migrationId: string;
  /** see {@link backupRunTimestamp} */
  runAt: string;
}

export class TrackedMigrationContext implements MigrationContext {
  private intended = 0;
  private succeeded = 0;
  private failed = 0;

  /** backups written in this run, by `<db>/<docId>`: only the first write of a doc in a run is backed up */
  private readonly backups = new Map<
    string,
    { path: string; rev?: string; body: MigrationBackup }
  >();

  constructor(
    readonly couchdb: Couchdb,
    readonly org: SystemCredentials,
    readonly dryRun: boolean,
    readonly log: MigrationLogger,
    private readonly backupRun: BackupRun,
    readonly args: string[] = [],
  ) {}

  validateJson(value: unknown): void {
    try {
      JSON.stringify(value);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`JSON validation failed: ${message}`);
    }
  }

  getWriteStats(): { intended: number; succeeded: number; failed: number } {
    return {
      intended: this.intended,
      succeeded: this.succeeded,
      failed: this.failed,
    };
  }

  async addDocIfMissing(path: string, template: unknown): Promise<boolean> {
    try {
      await this.couchdb.get(path);
      this.log.info(`${path} already exists, skipping`);
      return false;
    } catch (error: unknown) {
      if (!is404Error(error)) throw error;
    }
    await this.put(path, template);
    return true;
  }

  /**
   * Write a document, after backing up its current version (see migration-backup.ts),
   * so that the `restore-backup` migration can roll the write back.
   * A failed backup aborts the write.
   */
  async put(
    path: string,
    data: unknown,
    db?: string,
    headers?: unknown,
  ): Promise<void> {
    this.validateJson(data);
    this.intended++;

    const oldData = await this.getIfExists(path, db);
    this.logDiff(path, oldData, data);

    if (this.dryRun) {
      this.log.info(`[PREVIEW] Would PUT ${path}`);
      return;
    }
    let result: unknown;
    try {
      await this.backUp(path, db, oldData);
      result = await this.couchdb.put(
        path,
        data,
        db,
        headers as Record<string, string>,
      );
      this.succeeded++;
    } catch (e: unknown) {
      this.failed++;
      throw e;
    }
    await this.recordWrittenRev(path, db, result);
  }

  private async getIfExists(path: string, db?: string): Promise<unknown> {
    try {
      return await this.couchdb.get(path, db);
    } catch (error: unknown) {
      if (!is404Error(error)) throw error;
      return undefined;
    }
  }

  private async backUp(
    path: string,
    db: string | undefined,
    oldData: unknown,
  ): Promise<void> {
    const target = splitDocPath(path, db);
    const key = `${target.db}/${target.docId}`;
    if (this.backups.has(key)) return;

    const body: MigrationBackup = {
      migrationId: this.backupRun.migrationId,
      runAt: this.backupRun.runAt,
      db: target.db,
      docId: target.docId,
      doc: (oldData as Record<string, unknown>) ?? null,
    };
    const id = backupId(
      this.backupRun.migrationId,
      this.backupRun.runAt,
      target.docId,
    );
    const backup = backupPath(target.db, id);
    const result = (await this.couchdb.put(backup, body)) as { rev?: string };
    this.backups.set(key, { path: backup, rev: result?.rev, body });
    this.log.verbose(`Backed up ${path} to _local/${id}`);
  }

  /** Remember the rev the write produced, so a restore can tell whether the doc was edited since. Best-effort. */
  private async recordWrittenRev(
    path: string,
    db: string | undefined,
    writeResult: unknown,
  ): Promise<void> {
    const { db: targetDb, docId } = splitDocPath(path, db);
    const backup = this.backups.get(`${targetDb}/${docId}`);
    const writtenRev = (writeResult as { rev?: string })?.rev;
    if (!backup || !writtenRev) return;

    try {
      backup.body = { ...backup.body, writtenRev };
      const result = (await this.couchdb.put(backup.path, {
        ...backup.body,
        _rev: backup.rev,
      })) as { rev?: string };
      backup.rev = result?.rev;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.warn(
        `Could not record the written revision in the backup of ${path}: ${msg}`,
      );
    }
  }

  private logDiff(path: string, oldData: unknown, newData: unknown): void {
    if (oldData === undefined) {
      this.logChange(`+ ${path} (new document)`);
      return;
    }

    if (
      typeof oldData !== "object" ||
      oldData === null ||
      typeof newData !== "object" ||
      newData === null
    ) {
      return;
    }

    const changes = diff(
      oldData as Record<string, unknown>,
      newData as Record<string, unknown>,
      { cyclesFix: false },
    );
    if (changes.length === 0) return;

    for (const change of changes) {
      const pathStr = change.path.join(".");
      switch (change.type) {
        case "CREATE":
          this.logChange(
            `  + ${pathStr}: ${truncate(JSON.stringify(change.value))}`,
          );
          break;
        case "REMOVE":
          this.logChange(
            `  - ${pathStr}: ${truncate(JSON.stringify(change.oldValue))}`,
          );
          break;
        case "CHANGE":
          this.logChange(
            `  ~ ${pathStr}: ${truncate(JSON.stringify(change.oldValue))} → ${truncate(JSON.stringify(change.value))}`,
          );
          break;
      }
    }
  }

  /** Diff lines: always shown during preview (that's the point of a preview), only with --verbose during a real apply so multi-org runs stay quiet. */
  private logChange(msg: string): void {
    if (this.dryRun) this.log.info(msg);
    else this.log.verbose(msg);
  }
}

function truncate(str: string | undefined, max = 200): string {
  if (!str) return "(undefined)";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function is404Error(error: unknown): boolean {
  const e = error as { status?: number; response?: { status?: number } };
  return e.status === 404 || e.response?.status === 404;
}
