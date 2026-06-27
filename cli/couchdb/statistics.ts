import Papa from "papaparse";
import type { Couchdb } from "../lib/couchdb-client.js";

const STATISTICS_DESIGN_DOC_ID = "_design/statistics";

const MAP_FN =
  "function(doc) { var prefix = doc._id.split(':')[0]; if (prefix && doc._id.indexOf(':') > 0) { emit(prefix, doc.inactive ? 0 : 1); } }";

const statisticsDesignDoc = {
  _id: STATISTICS_DESIGN_DOC_ID,
  views: {
    entities_all: { map: MAP_FN, reduce: "_count" },
    entities_active: { map: MAP_FN, reduce: "_sum" },
  },
};

export interface OrgStatistics {
  name: string;
  users: number;
  entities: Record<string, { all: number; active: number }>;
  error?: boolean;
}

async function upsertStatisticsView(couchdb: Couchdb): Promise<void> {
  try {
    const existing = (await couchdb.get(STATISTICS_DESIGN_DOC_ID, "app")) as {
      _rev?: string;
    };
    await couchdb.put(
      STATISTICS_DESIGN_DOC_ID,
      { ...statisticsDesignDoc, _rev: existing._rev },
      "app",
    );
  } catch (error: unknown) {
    if ((error as { status?: number }).status === 404) {
      await couchdb.put(STATISTICS_DESIGN_DOC_ID, statisticsDesignDoc, "app");
    } else {
      console.error("Error upserting statistics design document:", error);
    }
  }
}

export async function getOrgStatistics(
  couchdb: Couchdb,
  users: unknown[],
  usersError = false,
): Promise<OrgStatistics> {
  let hasError = usersError;

  await upsertStatisticsView(couchdb);

  const statsAll = await couchdb
    .get<
      { key: string; value: number }[]
    >(`${STATISTICS_DESIGN_DOC_ID}/_view/entities_all?group=true`, "app")
    .catch(() => {
      console.warn(
        "Couldn't get statistics (entities_all) from CouchDB for",
        couchdb.url,
      );
      hasError = true;
      return [] as { key: string; value: number }[];
    });

  const statsActive = await couchdb
    .get<
      { key: string; value: number }[]
    >(`${STATISTICS_DESIGN_DOC_ID}/_view/entities_active?group=true`, "app")
    .catch(() => {
      console.warn(
        "Couldn't get statistics (entities_active) from CouchDB for",
        couchdb.url,
      );
      hasError = true;
      return [] as { key: string; value: number }[];
    });

  const entities: Record<string, { all: number; active: number }> = {};
  for (const row of statsAll) {
    entities[row.key] = { all: row.value, active: 0 };
  }
  for (const row of statsActive) {
    if (entities[row.key]) {
      entities[row.key].active = row.value;
    } else {
      entities[row.key] = { all: 0, active: row.value };
    }
  }

  return {
    name: couchdb.url,
    users: users.length,
    entities,
    error: hasError || undefined,
  };
}

export function formatStatisticsCsv(stats: OrgStatistics[]): string {
  if (stats.length === 0) return "";

  const allEntityTypes = new Set<string>();
  for (const stat of stats) {
    for (const type of Object.keys(stat.entities)) {
      allEntityTypes.add(type);
    }
  }

  const rows = stats.map((stat) => {
    const flat: Record<string, number | string> = {
      name: stat.name,
      users: stat.error ? "-" : stat.users,
    };
    for (const entityType of allEntityTypes) {
      if (stat.error) {
        flat[`${entityType}_all`] = "-";
        flat[`${entityType}_active`] = "-";
      } else {
        const counts = stat.entities[entityType] ?? { all: 0, active: 0 };
        flat[`${entityType}_all`] = counts.all;
        flat[`${entityType}_active`] = counts.active;
      }
    }
    return flat;
  });

  return Papa.unparse(rows);
}
