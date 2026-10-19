import { vi } from "vitest";
import type { Couchdb } from "../../lib/couchdb-client.js";

export type Doc = Record<string, unknown> & {
  _id?: string;
  _rev?: string;
  _deleted?: boolean;
};

/** docs by `<db>/<docId>`, e.g. `app/Config:CONFIG_ENTITY` or `app/_local/migration-backup:…` */
export type RevStore = Record<string, Doc>;

function httpError(status: number): Error {
  const error = new Error(`HTTP ${status}`) as Error & {
    status: number;
    response: { status: number };
  };
  error.status = status;
  error.response = { status };
  return error;
}

/**
 * In-memory stand-in for {@link Couchdb} that, unlike the idempotency harness stub, behaves like CouchDB
 * where backups depend on it: PUT checks and bumps `_rev`, deleted docs read as 404,
 * `/<db>/_local_docs` answers range queries and `/<db>/_all_docs` answers `keys` lookups.
 */
export function buildRevTrackingCouchdb(store: RevStore): Couchdb {
  const key = (path: string, db?: string) =>
    decodeURIComponent((db ? `${db}/` : "") + path.replace(/^\//, ""));

  return {
    get: vi.fn(async (path: string, db?: string) => {
      const [docPath, query] = path.split("?");
      if (docPath.endsWith("/_local_docs")) {
        const params = new URLSearchParams(query);
        const start = JSON.parse(params.get("startkey"));
        const end = JSON.parse(params.get("endkey"));
        const dbPrefix = key(docPath).split("/")[0] + "/";
        return Object.entries(store)
          .filter(([k]) => k.startsWith(dbPrefix + "_local/"))
          .map(([k, doc]) => ({ id: k.slice(dbPrefix.length), doc }))
          .filter(({ id }) => id >= start && id <= end)
          .map(({ id, doc }) => ({ id, doc: structuredClone(doc) }));
      }
      const doc = store[key(docPath, db)];
      if (!doc || doc._deleted) throw httpError(404);
      return structuredClone(doc);
    }),

    put: vi.fn(async (path: string, data: Doc, db?: string) => {
      const k = key(path, db);
      const existing = store[k];
      if (existing && !existing._deleted && existing._rev !== data._rev) {
        throw httpError(409);
      }
      const generation = existing ? parseInt(existing._rev) + 1 : 1;
      const rev = `${generation}-stub`;
      const id = k.slice(k.indexOf("/") + 1);
      store[k] = { ...structuredClone(data), _id: id, _rev: rev };
      return { ok: true, id, rev };
    }),

    post: vi.fn(async (path: string, body: { keys: string[] }) => {
      const db = key(path).split("/")[0];
      const rows = body.keys.map((id) => {
        const doc = store[`${db}/${id}`];
        if (!doc) return { key: id, error: "not_found" };
        return {
          id,
          key: id,
          value: { rev: doc._rev, ...(doc._deleted && { deleted: true }) },
        };
      });
      return { total_rows: rows.length, rows };
    }),
  } as unknown as Couchdb;
}
