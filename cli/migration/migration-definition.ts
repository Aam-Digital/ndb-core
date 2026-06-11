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
  log: MigrationLogger;
  put(
    path: string,
    data: unknown,
    db?: string,
    headers?: unknown,
  ): Promise<void>;
  validateJson(value: unknown): void;
  addDocIfMissing(path: string, template: unknown): Promise<boolean>;
}

export interface MigrationResult {
  changed: boolean;
  status: "ok" | "no-change" | "dry-run" | "partial" | "failed";
  details?: unknown;
  warnings?: string[];
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
