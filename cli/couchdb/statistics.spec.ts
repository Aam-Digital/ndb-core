import { describe, expect, it, vi } from "vitest";
import type { Couchdb } from "../lib/couchdb-client.js";
import { formatStatisticsCsv, getOrgStatistics } from "./statistics.js";

function makeStubCouchdb(opts: {
  statsAll?: { key: string; value: number }[];
  statsActive?: { key: string; value: number }[];
  url?: string;
}): Couchdb {
  const url = opts.url ?? "org1.example.com";
  const statsAll = opts.statsAll ?? [];
  const statsActive = opts.statsActive ?? [];
  return {
    url,
    get: vi
      .fn()
      // first call: get existing design doc for upsert (_rev needed)
      .mockResolvedValueOnce({ _id: "_design/statistics", _rev: "1-abc" })
      // second call: entities_all view
      .mockResolvedValueOnce(statsAll)
      // third call: entities_active view
      .mockResolvedValueOnce(statsActive),
    put: vi.fn().mockResolvedValue({}),
  } as unknown as Couchdb;
}

describe("getOrgStatistics", () => {
  it("merges all and active counts per entity type", async () => {
    const couchdb = makeStubCouchdb({
      statsAll: [
        { key: "Child", value: 50 },
        { key: "User", value: 10 },
      ],
      statsActive: [
        { key: "Child", value: 45 },
        { key: "User", value: 8 },
      ],
    });

    const result = await getOrgStatistics(couchdb, [{ id: "user1" }]);

    expect(result.entities["Child"]).toEqual({ all: 50, active: 45 });
    expect(result.entities["User"]).toEqual({ all: 10, active: 8 });
    expect(result.users).toBe(1);
    expect(result.name).toBe("org1.example.com");
  });

  it("handles entity type present in active but not in all (sets all: 0)", async () => {
    const couchdb = makeStubCouchdb({
      statsAll: [{ key: "Child", value: 20 }],
      statsActive: [
        { key: "Child", value: 18 },
        { key: "Note", value: 5 },
      ],
    });

    const result = await getOrgStatistics(couchdb, []);

    expect(result.entities["Note"]).toEqual({ all: 0, active: 5 });
  });

  it("returns empty entities when both views return empty", async () => {
    const couchdb = makeStubCouchdb({});

    const result = await getOrgStatistics(couchdb, []);

    expect(result.entities).toEqual({});
    expect(result.users).toBe(0);
  });
});

describe("formatStatisticsCsv", () => {
  it("flattens entity counts to columns with _all and _active suffixes", () => {
    const stats = [
      {
        name: "org1",
        users: 10,
        entities: { Child: { all: 50, active: 45 } },
      },
    ];

    const csv = formatStatisticsCsv(stats);

    expect(csv).toContain("Child_all");
    expect(csv).toContain("Child_active");
    expect(csv).toContain("50");
    expect(csv).toContain("45");
  });

  it("ensures all orgs have the same columns even if entity type is absent in one org", () => {
    const stats = [
      {
        name: "org1",
        users: 10,
        entities: {
          Child: { all: 50, active: 45 },
          User: { all: 5, active: 5 },
        },
      },
      {
        name: "org2",
        users: 3,
        entities: { Child: { all: 10, active: 8 } },
      },
    ];

    const csv = formatStatisticsCsv(stats);
    const lines = csv.trim().split("\n");
    const header = lines[0];
    const org2Row = lines[2];

    expect(header).toContain("User_all");
    expect(header).toContain("User_active");
    expect(org2Row).toContain("0");
  });

  it("returns empty CSV with only headers when given no stats", () => {
    const csv = formatStatisticsCsv([]);
    expect(csv.trim()).toBe("");
  });
});
