import diff from "microdiff";
import type { Couchdb } from "../lib/couchdb-client.js";
import type { SystemCredentials } from "../lib/credentials.js";
import type {
  MigrationContext,
  MigrationLogger,
} from "./migration-definition.js";

export class TrackedMigrationContext implements MigrationContext {
  private intended = 0;
  private succeeded = 0;
  private failed = 0;

  constructor(
    readonly couchdb: Couchdb,
    readonly org: SystemCredentials,
    readonly dryRun: boolean,
    readonly log: MigrationLogger,
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

  async put(
    path: string,
    data: unknown,
    db?: string,
    headers?: unknown,
  ): Promise<void> {
    this.validateJson(data);
    this.intended++;

    await this.logDiff(path, data, db);

    if (this.dryRun) {
      this.log.info(`[PREVIEW] Would PUT ${path}`);
      return;
    }
    try {
      await this.couchdb.put(path, data, db, headers as Record<string, string>);
      this.succeeded++;
    } catch (e: unknown) {
      this.failed++;
      throw e;
    }
  }

  private async logDiff(
    path: string,
    newData: unknown,
    db?: string,
  ): Promise<void> {
    let oldData: unknown;
    try {
      oldData = await this.couchdb.get(path, db);
    } catch (error: unknown) {
      if (!is404Error(error)) throw error;
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
