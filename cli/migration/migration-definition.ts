import type { Couchdb } from "../lib/couchdb-client.js";
import type { SystemCredentials } from "../lib/credentials.js";

export interface MigrationLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  /** Only emitted when the CLI is run with --verbose. */
  verbose(message: string): void;
}

export interface MigrationContext {
  /** Raw CouchDB accessor for reads. Do not call couchdb.put directly; use ctx.put instead. */
  couchdb: Couchdb;
  org: SystemCredentials;
  dryRun: boolean;
  /** Extra arguments passed after the migration id, for migrations that take a value. */
  args: string[];
  log: MigrationLogger;
  put(
    path: string,
    data: unknown,
    db?: string,
    headers?: unknown,
  ): Promise<void>;
  validateJson(value: unknown): void;
  addDocIfMissing(path: string, template: unknown): Promise<boolean>;
  /**
   * Ask the operator a yes/no question about this org, for decisions a migration cannot take on its own.
   * Asked once per org: the preview and the following apply run of the same org get the same answer.
   */
  confirm(question: string): Promise<boolean>;
}

export interface MigrationResult {
  changed: boolean;
  status: "ok" | "no-change" | "dry-run" | "partial" | "failed";
  details?: unknown;
  warnings?: string[];
  /** short conclusions what the migration does for this org, shown with the outcome and in the summary */
  verdicts?: MigrationVerdict[];
}

/** A short conclusion what a migration does (or did) for an org, e.g. "remove unused legacy children field" */
export interface MigrationVerdict {
  /** how the verdict is highlighted: config is added, removed, needs a manual review or stays unchanged */
  kind: "add" | "remove" | "review" | "none";
  text: string;
}

export function failedMigrationResult(message: string): MigrationResult {
  return { changed: false, status: "failed", warnings: [message] };
}

export interface MigrationDefinition {
  id: string;
  description: string;
  run(ctx: MigrationContext): Promise<MigrationResult>;
}

export interface MigrationOutcome {
  result: MigrationResult;
  writeStats: { intended: number; succeeded: number; failed: number };
}
