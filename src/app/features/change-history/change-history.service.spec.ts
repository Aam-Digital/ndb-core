import { ApplicationRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { HttpClient } from "@angular/common/http";
import { of, throwError } from "rxjs";
import { ChangeHistoryService } from "./change-history.service";
import { AuditRecord } from "./model/audit-record";
import { DatabaseResolverService } from "../../core/database/database-resolver.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { EntityAbility } from "../../core/permissions/ability/entity-ability";
import { Entity } from "../../core/entity/model/entity";
import { KeycloakAuthService } from "../../core/session/auth/keycloak/keycloak-auth.service";

let mockDb: {
  getAll: ReturnType<typeof vi.fn>;
  query: ReturnType<typeof vi.fn>;
  saveDatabaseIndex: ReturnType<typeof vi.fn>;
};
let dbResolver: { getDatabase: ReturnType<typeof vi.fn> };
let findType: ReturnType<typeof vi.fn>;
let abilityCan: ReturnType<typeof vi.fn>;
let httpPost: ReturnType<typeof vi.fn>;

function setup(docs: any[] = [], canRead = true) {
  mockDb = {
    getAll: vi.fn().mockResolvedValue(docs),
    query: vi.fn().mockResolvedValue({ rows: [] }),
    saveDatabaseIndex: vi.fn().mockResolvedValue(undefined),
  };
  dbResolver = { getDatabase: vi.fn().mockReturnValue(mockDb) };
  findType = vi.fn().mockResolvedValue({ records: [] });
  abilityCan = vi.fn().mockReturnValue(canRead);
  httpPost = vi.fn().mockReturnValue(of({ docs: [], bookmark: "bm-next" }));
  TestBed.configureTestingModule({
    providers: [
      ChangeHistoryService,
      { provide: DatabaseResolverService, useValue: dbResolver },
      { provide: EntityMapperService, useValue: { findType } },
      { provide: EntityAbility, useValue: { can: abilityCan } },
      {
        provide: KeycloakAuthService,
        useValue: {
          addAuthHeader: (headers: any) =>
            (headers["Authorization"] = "Bearer t"),
        },
      },
      { provide: HttpClient, useValue: { get: () => of({}), post: httpPost } },
    ],
  });
  return TestBed.inject(ChangeHistoryService);
}

class InternalEntity extends Entity {
  static override readonly isInternalEntity = true;
}

function savedEntity(ctor = Entity): Entity {
  const e = new ctor("1");
  e._rev = "1-abc";
  return e;
}

function rawDoc(
  ts: string,
  operation = "update",
  diff: any = { name: ["A", "B"] },
): any {
  return {
    _id: `AuditRecord:Entity:1:${ts}:1-a`,
    entityId: "Entity:1",
    operation,
    timestamp: ts,
    rev: "1-a",
    user: { name: "User:demo" },
    diff,
  };
}

it("queries the audit db with the entity's AuditRecord prefix", async () => {
  const service = setup([rawDoc("2026-06-03T10:00:00.000Z")]);
  const entity = new Entity("1");

  await service.getHistory(entity);

  expect(dbResolver.getDatabase).toHaveBeenCalledWith("app-audit");
  expect(mockDb.getAll).toHaveBeenCalledWith(`AuditRecord:${entity.getId()}:`);
});

it("returns normalized events newest-first", async () => {
  const service = setup([
    rawDoc("2026-06-01T10:00:00.000Z", "create", [{ name: "A" }]),
    rawDoc("2026-06-03T10:00:00.000Z", "update", { name: ["B", "C"] }),
    rawDoc("2026-06-02T10:00:00.000Z", "update", { name: ["A", "B"] }),
  ]);

  const history = await service.getHistory(new Entity("1"));

  expect(history.map((e) => e.at.toISOString())).toEqual([
    "2026-06-03T10:00:00.000Z",
    "2026-06-02T10:00:00.000Z",
    "2026-06-01T10:00:00.000Z",
  ]);
  expect(history[0].operation).toBe("update");
  expect(history[0].changes).toEqual([{ field: "name", from: "B", to: "C" }]);
});

it("reads the audit db through the resolver, which owns its lifecycle", async () => {
  const service = setup([]);

  await service.getHistory(new Entity("1"));
  await service.getHistory(new Entity("2"));

  // the handle is not cached here any more: it is a registered remote-only
  // database, so the resolver hands out the same instance
  expect(dbResolver.getDatabase).toHaveBeenCalledWith("app-audit");
});

it("propagates errors when the audit db is unavailable", async () => {
  const service = setup([]);
  mockDb.getAll.mockRejectedValue(new Error("not_found"));

  await expect(service.getHistory(new Entity("1"))).rejects.toThrow();
});

it("allows viewing history for a saved entity when AuditRecord read is granted", () => {
  const service = setup([], true);
  expect(service.canViewHistory(savedEntity())).toBe(true);
  expect(abilityCan).toHaveBeenCalledWith("read", AuditRecord.ENTITY_TYPE);
});

it("denies viewing history when AuditRecord read is denied", () => {
  const service = setup([], false);
  expect(service.canViewHistory(savedEntity())).toBe(false);
});

it("denies viewing history for a new (unsaved) entity", () => {
  const service = setup([], true);
  expect(service.canViewHistory(new Entity("1"))).toBe(false);
});

it("allows viewing history for a saved internal entity (internal entities are audited too)", () => {
  const service = setup([], true);
  expect(service.canViewHistory(savedEntity(InternalEntity))).toBe(true);
});

it("denies viewing history when no entity is given", () => {
  const service = setup([], true);
  expect(service.canViewHistory(undefined)).toBe(false);
});

it("samples recent records for the distinct authors of the filter dropdown", async () => {
  const service = setup();
  findType.mockResolvedValue({
    records: [
      { author: "User:demo" },
      { author: "priya" },
      { author: "User:demo" },
    ],
  });

  const authors = await service.getChangeAuthors();

  // the same sort index the list uses, rather than a query of its own, and
  // naming the sort field so the query is not served by the pinned index alone
  expect(findType).toHaveBeenCalledWith(
    expect.anything(),
    { timestamp: { $gt: null } },
    { limit: 1000 },
    { prop: "timestamp", dir: "desc" },
  );
  expect(authors).toEqual(["priya", "User:demo"]);
});

it("reads the audit feature status from the replication-backend /_features endpoint (lazily)", async () => {
  const httpGet = vi.fn().mockReturnValue(of({ audit: { enabled: true } }));
  mockDb = {
    getAll: vi.fn().mockResolvedValue([]),
    query: vi.fn().mockResolvedValue({ rows: [] }),
    saveDatabaseIndex: vi.fn().mockResolvedValue(undefined),
  };
  dbResolver = { getDatabase: vi.fn().mockReturnValue(mockDb) };
  findType = vi.fn().mockResolvedValue({ records: [] });
  TestBed.configureTestingModule({
    providers: [
      ChangeHistoryService,
      { provide: DatabaseResolverService, useValue: dbResolver },
      { provide: EntityMapperService, useValue: { findType } },
      { provide: EntityAbility, useValue: { can: () => true } },
      { provide: HttpClient, useValue: { get: httpGet } },
    ],
  });
  const service = TestBed.inject(ChangeHistoryService);

  // nothing fetched until the flag is requested (avoids HTTP at app startup)
  expect(httpGet).not.toHaveBeenCalled();
  expect(service.isAuditEnabled()).toBeUndefined();

  service.loadAuditFeatureFlag();
  await TestBed.inject(ApplicationRef).whenStable();

  expect(httpGet).toHaveBeenCalledWith("/db/_features");
  expect(service.isAuditEnabled()).toBe(true);
});
