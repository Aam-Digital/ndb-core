import { ApplicationRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { ChangeHistoryService } from "./change-history.service";
import { AuditRecord } from "./model/audit-record";
import { DatabaseResolverService } from "../../core/database/database-resolver.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { EntityAbility } from "../../core/permissions/ability/entity-ability";
import { Entity } from "../../core/entity/model/entity";
import {
  EntityRegistry,
  entityRegistry,
} from "../../core/entity/database-entity.decorator";
import { KeycloakAuthService } from "../../core/session/auth/keycloak/keycloak-auth.service";

let mockDb: {
  getAll: ReturnType<typeof vi.fn>;
  query: ReturnType<typeof vi.fn>;
  saveDatabaseIndex: ReturnType<typeof vi.fn>;
};
let dbResolver: { getDatabase: ReturnType<typeof vi.fn> };
let findType: ReturnType<typeof vi.fn>;
let loadType: ReturnType<typeof vi.fn>;
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
  loadType = vi.fn().mockResolvedValue([]);
  abilityCan = vi.fn().mockReturnValue(canRead);
  httpPost = vi.fn().mockReturnValue(of({ docs: [], bookmark: "bm-next" }));
  TestBed.configureTestingModule({
    providers: [
      ChangeHistoryService,
      { provide: DatabaseResolverService, useValue: dbResolver },
      { provide: EntityMapperService, useValue: { findType, loadType } },
      { provide: EntityRegistry, useValue: entityRegistry },
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

/** a record type a login account can belong to */
class AccountEntity extends Entity {
  static override readonly ENTITY_TYPE = "AccountEntity";
  static override readonly enableUserAccounts = true;
}

// registered by hand rather than through the decorator, so it can be taken out
// again: the registry is shared, and a type left in it changes what every later
// spec sees
beforeEach(() => entityRegistry.add(AccountEntity.ENTITY_TYPE, AccountEntity));
afterEach(() => entityRegistry.delete(AccountEntity.ENTITY_TYPE));

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

it("offers the records a login account can belong to as the filter's authors", async () => {
  // reading them from the audit documents instead would mean scanning a
  // database with no index of its authors, and still only seeing recent ones
  const service = setup();
  // per type, so the assertion holds whatever else the registry happens to hold
  loadType.mockImplementation((type) =>
    Promise.resolve(
      type === AccountEntity
        ? [new AccountEntity("b"), new AccountEntity("a")]
        : [],
    ),
  );

  const authors = await service.getChangeAuthors();

  expect(loadType).toHaveBeenCalledWith(AccountEntity);
  expect(authors.map((a) => a.getId())).toEqual([
    "AccountEntity:a",
    "AccountEntity:b",
  ]);
});

it("keeps the filter usable when a record type cannot be read", async () => {
  const service = setup();
  loadType.mockRejectedValue(new Error("denied"));

  await expect(service.getChangeAuthors()).resolves.toEqual([]);
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
  loadType = vi.fn().mockResolvedValue([]);
  TestBed.configureTestingModule({
    providers: [
      ChangeHistoryService,
      { provide: DatabaseResolverService, useValue: dbResolver },
      { provide: EntityMapperService, useValue: { findType, loadType } },
      { provide: EntityRegistry, useValue: entityRegistry },
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
