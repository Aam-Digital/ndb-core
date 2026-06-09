import { vi } from "vitest";
import type { Couchdb } from "../../lib/couchdb-client.js";
import type { SystemCredentials } from "../../lib/credentials.js";
import type {
  MigrationContext,
  MigrationDefinition,
  MigrationLogger,
  MigrationResult,
} from "../migration-definition.js";

export type DocStore = Record<string, unknown>;

export interface IdempotencyCheckResult {
  firstRunResult: MigrationResult;
  secondRunResult: MigrationResult;
  stateAfterFirstRun: DocStore;
  stateAfterSecondRun: DocStore;
}

export function buildStubCouchdb(store: DocStore): Couchdb {
  let idCounter = 0;
  function key(path: string, db?: string): string {
    const normalized = path.replace(/^\//, "");
    return db ? `${db}/${normalized}` : normalized;
  }

  return {
    get: vi.fn(async (path: string, db?: string) => {
      const k = key(path, db);
      const val = store[k];
      if (val === undefined) {
        const err = new Error(`Not found: ${k}`) as Error & {
          status: number;
          response: { status: number };
        };
        err.status = 404;
        err.response = { status: 404 };
        throw err;
      }
      return val;
    }),

    put: vi.fn(async (path: string, data: unknown, db?: string) => {
      store[key(path, db)] = JSON.parse(JSON.stringify(data));
    }),

    putAll: vi.fn(async (docs: unknown[], db?: string) => {
      const results: { ok: boolean; id: string }[] = [];
      for (const doc of docs as Array<{ _id?: string; id?: string }>) {
        const id = doc._id ?? doc.id ?? `generated-${idCounter++}`;
        store[key(id, db)] = JSON.parse(JSON.stringify(doc));
        results.push({ ok: true, id });
      }
      return results;
    }),

    getAll: vi.fn(async (prefix: string, db?: string) => {
      const base = `${db ?? "app"}/`;
      return Object.entries(store)
        .filter(
          ([k]) =>
            k.startsWith(base) && k.slice(base.length).startsWith(prefix),
        )
        .map(([, v]) => v);
    }),

    post: vi.fn(async (path: string, data: unknown, db?: string) => {
      store[key(path, db)] = JSON.parse(JSON.stringify(data));
    }),

    find: vi.fn(async (_query: unknown, db?: string) => {
      const base = `${db ?? "app"}/`;
      const all = Object.entries(store)
        .filter(([k]) => k.startsWith(base))
        .map(([, v]) => v);
      return { docs: all };
    }),
  } as unknown as Couchdb;
}

export const silentLogger: MigrationLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  verbose: () => {},
};

const fakeOrg: SystemCredentials = {
  url: "https://test.example.com",
  username: "admin",
  password: "secret",
  name: "test",
  category: "",
};

export function buildTestContext(
  store: DocStore,
  dryRun = false,
): MigrationContext & { store: DocStore } {
  const stubCouchdb = buildStubCouchdb(store);
  const writes = { intended: 0, succeeded: 0, failed: 0 };

  const validateJson = (value: unknown): void => {
    try {
      JSON.stringify(value);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`JSON validation failed: ${message}`);
    }
  };

  return {
    couchdb: stubCouchdb,
    org: fakeOrg,
    dryRun,
    log: silentLogger,
    validateJson,
    async put(path, data, db?, _headers?) {
      validateJson(data);
      writes.intended++;
      if (dryRun) return;
      await stubCouchdb.put(path, data, db);
      writes.succeeded++;
    },
    async addDocIfMissing(path, template) {
      try {
        await stubCouchdb.get(path);
        return false;
      } catch (error: unknown) {
        if ((error as { status?: number }).status !== 404) throw error;
      }
      await this.put(path, template);
      return true;
    },
    store,
  };
}

export async function runIdempotencyCheck(
  migration: MigrationDefinition,
  initialDocs: DocStore = {},
): Promise<IdempotencyCheckResult> {
  const store1: DocStore = JSON.parse(JSON.stringify(initialDocs));
  const ctx1 = buildTestContext(store1, false);
  const firstRunResult = await migration.run(ctx1);
  const stateAfterFirstRun: DocStore = JSON.parse(JSON.stringify(store1));

  const store2: DocStore = JSON.parse(JSON.stringify(stateAfterFirstRun));
  const ctx2 = buildTestContext(store2, false);
  const secondRunResult = await migration.run(ctx2);
  const stateAfterSecondRun: DocStore = JSON.parse(JSON.stringify(store2));

  return {
    firstRunResult,
    secondRunResult,
    stateAfterFirstRun,
    stateAfterSecondRun,
  };
}
