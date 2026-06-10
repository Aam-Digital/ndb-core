import type { Couchdb } from "../lib/couchdb-client.js";

const VIEW_DOC_ID = "_design/conflicts";

const conflictsViewDoc = {
  _id: VIEW_DOC_ID,
  views: {
    all: {
      map:
        "(doc) => { " +
        "if (doc._conflicts) { emit(doc._conflicts, doc._id); } " +
        "}",
    },
  },
};

export async function getConflicts(couchdb: Couchdb): Promise<string[]> {
  const path = `/app/${VIEW_DOC_ID}`;
  try {
    await couchdb.get(path);
  } catch {
    await couchdb.put(path, conflictsViewDoc);
  }
  const rows = (await couchdb.get(`${path}/_view/all`)) as { value: string }[];
  return rows.map(({ value }) => value);
}
