import { ApplicationRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { HttpClient } from "@angular/common/http";
import { of, throwError } from "rxjs";
import {
  AUDIT_RECORD_SUBJECT,
  ChangeHistoryService,
} from "./change-history.service";
import { DatabaseFactoryService } from "../../core/database/database-factory.service";
import { EntityAbility } from "../../core/permissions/ability/entity-ability";
import { Entity } from "../../core/entity/model/entity";
import { KeycloakAuthService } from "../../core/session/auth/keycloak/keycloak-auth.service";

let mockDb: {
  getAll: ReturnType<typeof vi.fn>;
  query: ReturnType<typeof vi.fn>;
  saveDatabaseIndex: ReturnType<typeof vi.fn>;
};
let dbFactory: { createRemoteDatabase: ReturnType<typeof vi.fn> };
let abilityCan: ReturnType<typeof vi.fn>;
let httpPost: ReturnType<typeof vi.fn>;
/** fire the ability's "updated" event, as AbilityService does after a rules change */
let abilityUpdated: () => void;

function setup(docs: any[] = [], canRead = true) {
  mockDb = {
    getAll: vi.fn().mockResolvedValue(docs),
    query: vi.fn().mockResolvedValue({ rows: [] }),
    saveDatabaseIndex: vi.fn().mockResolvedValue(undefined),
  };
  dbFactory = { createRemoteDatabase: vi.fn().mockReturnValue(mockDb) };
  abilityCan = vi.fn().mockReturnValue(canRead);
  const abilityListeners: (() => void)[] = [];
  abilityUpdated = () => abilityListeners.forEach((listener) => listener());
  httpPost = vi.fn().mockReturnValue(of({ docs: [], bookmark: "bm-next" }));
  TestBed.configureTestingModule({
    providers: [
      ChangeHistoryService,
      { provide: DatabaseFactoryService, useValue: dbFactory },
      {
        provide: EntityAbility,
        useValue: {
          can: abilityCan,
          on: (_event: string, listener: () => void) => {
            abilityListeners.push(listener);
            return () => undefined;
          },
        },
      },
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

/** the `_find` call of the last queryChangeLog/getChangeAuthors, skipping `_index` */
function lastFindCall(): [string, any, any] {
  return httpPost.mock.calls
    .filter((call) => call[0].endsWith("/_find"))
    .at(-1) as [string, any, any];
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

  expect(dbFactory.createRemoteDatabase).toHaveBeenCalledWith("app-audit");
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
  expect(history[0].action).toBe("updated");
  expect(history[0].changes).toEqual([{ field: "name", from: "B", to: "C" }]);
});

it("caches the remote audit db across calls", async () => {
  const service = setup([]);

  await service.getHistory(new Entity("1"));
  await service.getHistory(new Entity("2"));

  expect(dbFactory.createRemoteDatabase).toHaveBeenCalledTimes(1);
});

it("propagates errors when the audit db is unavailable", async () => {
  const service = setup([]);
  mockDb.getAll.mockRejectedValue(new Error("not_found"));

  await expect(service.getHistory(new Entity("1"))).rejects.toThrow();
});

it("allows viewing history for a saved entity when AuditRecord read is granted", () => {
  const service = setup([], true);
  expect(service.canViewHistory(savedEntity())).toBe(true);
  expect(abilityCan).toHaveBeenCalledWith("read", AUDIT_RECORD_SUBJECT);
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

it("re-evaluates the audit permission when the ability rules are updated", () => {
  const service = setup([], false);
  expect(service.hasAuditPermission()).toBe(false);

  abilityCan.mockReturnValue(true);
  // the ability object is mutated in place by AbilityService, so only its
  // "updated" event tells us the answer may have changed
  abilityUpdated();

  expect(service.hasAuditPermission()).toBe(true);
});

it("queries the change log against the audit db's _find endpoint, authenticated", async () => {
  const service = setup();

  await service.queryChangeLog({ entityType: "Child" }, 10, 2);

  const [url, body, options] = lastFindCall();
  expect(url).toBe("/db/app-audit/_find");
  expect(body.skip).toBe(20);
  expect(body.selector.entityId.$gte).toBe("Child:");
  expect(options.headers["Authorization"]).toBe("Bearer t");
});

it("creates the timestamp index once before querying, since sort needs it", async () => {
  const service = setup();

  await service.queryChangeLog({}, 10);
  await service.queryChangeLog({}, 10);

  const indexCalls = httpPost.mock.calls.filter((call) =>
    call[0].endsWith("/_index"),
  );
  expect(indexCalls.length).toBe(1);
  expect(indexCalls[0][0]).toBe("/db/app-audit/_index");
  expect(indexCalls[0][1].index.fields).toEqual([{ timestamp: "desc" }]);
});

it("still queries when the index could not be created (it may already exist)", async () => {
  const service = setup();
  httpPost.mockImplementation((url: string) =>
    url.endsWith("/_index")
      ? throwError(() => new Error("forbidden"))
      : of({ docs: [rawDoc("2026-06-03T10:00:00.000Z")] }),
  );

  const page = await service.queryChangeLog({}, 10);

  expect(page.entries.length).toBe(1);
});

it("returns mapped entries, without a further page when none was found", async () => {
  const service = setup();
  httpPost.mockImplementation((url: string) =>
    url.endsWith("/_find")
      ? of({ docs: [rawDoc("2026-06-03T10:00:00.000Z")] })
      : of({}),
  );

  const page = await service.queryChangeLog({}, 10);

  expect(page.hasMore).toBe(false);
  expect(page.entries).toEqual([
    {
      id: "AuditRecord:Entity:1:2026-06-03T10:00:00.000Z:1-a",
      at: new Date("2026-06-03T10:00:00.000Z"),
      by: "User:demo",
      byEntityId: "User:demo",
      action: "updated",
      entityId: "Entity:1",
      entityType: "Entity",
      changedFields: ["name"],
    },
  ]);
});

it("reports a further page without returning the record that proved it", async () => {
  const service = setup();
  const docs = Array.from({ length: 3 }, (_, i) =>
    rawDoc(`2026-06-0${i + 1}T10:00:00.000Z`),
  );
  httpPost.mockImplementation((url: string) =>
    url.endsWith("/_find") ? of({ docs }) : of({}),
  );

  const page = await service.queryChangeLog({}, 2);

  expect(page.entries.length).toBe(2);
  expect(page.hasMore).toBe(true);
  expect(lastFindCall()[1].limit).toBe(3);
});

it("samples recent records for the distinct authors of the filter dropdown", async () => {
  const service = setup();
  httpPost.mockImplementation((url: string) =>
    url.endsWith("/_find")
      ? of({
          docs: [
            { user: { name: "b" } },
            { user: { name: "a" } },
            { user: { name: "b" } },
          ],
        })
      : of({}),
  );

  expect(await service.getChangeAuthors()).toEqual(["a", "b"]);
  // _id must stay in the projection or the proxy drops every doc
  expect(lastFindCall()[1].fields).toEqual(["_id", "user"]);
});

it("queries the reference view instead of _find when filtering by a related record", async () => {
  const service = setup();
  mockDb.query.mockResolvedValue({
    rows: [{ doc: rawDoc("2026-06-03T10:00:00.000Z") }],
  });

  const page = await service.queryChangeLog({ relatedEntityId: "User:1" }, 10);

  const [view, options] = mockDb.query.mock.calls.at(-1);
  expect(view).toBe("audit-references/by_reference");
  expect(options.startkey[0]).toBe("User:1");
  expect(options.include_docs).toBe(true);
  expect(page.entries[0].entityId).toBe("Entity:1");
  // no _find fallback: its selector cannot reach the ids inside a diff
  expect(
    httpPost.mock.calls.filter((call) => call[0].endsWith("/_find")),
  ).toEqual([]);
});

it("creates the reference view once before querying it", async () => {
  const service = setup();

  await service.queryChangeLog({ relatedEntityId: "User:1" }, 10);
  await service.queryChangeLog({ relatedEntityId: "User:2" }, 10);

  expect(mockDb.saveDatabaseIndex).toHaveBeenCalledTimes(1);
  expect(mockDb.saveDatabaseIndex.mock.calls[0][0]._id).toBe(
    "_design/audit-references",
  );
  // the remote-only audit db, never the app db: routing this through the
  // database resolver would open a *synced* handle and replicate the
  // unboundedly growing audit history onto every device
  expect(dbFactory.createRemoteDatabase).toHaveBeenCalledWith("app-audit");
  expect(dbFactory.createRemoteDatabase).toHaveBeenCalledTimes(1);
});

it("still queries the reference view when its creation was rejected (it may already exist)", async () => {
  const service = setup();
  mockDb.saveDatabaseIndex.mockRejectedValue(new Error("forbidden"));
  mockDb.query.mockResolvedValue({
    rows: [{ doc: rawDoc("2026-06-03T10:00:00.000Z") }],
  });

  const page = await service.queryChangeLog({ relatedEntityId: "User:1" }, 10);

  expect(page.entries.length).toBe(1);
});

it("drops reference-view rows the backend's permission filter emptied", async () => {
  const service = setup();
  mockDb.query.mockResolvedValue({
    rows: [
      { doc: rawDoc("2026-06-03T10:00:00.000Z") },
      { id: "AuditRecord:Secret:1:x:1-a" },
    ],
  });

  const page = await service.queryChangeLog({ relatedEntityId: "User:1" }, 10);

  expect(page.entries.length).toBe(1);
  expect(page.hasMore).toBe(false);
});

it("reads the audit feature status from the replication-backend /_features endpoint (lazily)", async () => {
  const httpGet = vi.fn().mockReturnValue(of({ audit: { enabled: true } }));
  mockDb = {
    getAll: vi.fn().mockResolvedValue([]),
    query: vi.fn().mockResolvedValue({ rows: [] }),
    saveDatabaseIndex: vi.fn().mockResolvedValue(undefined),
  };
  dbFactory = { createRemoteDatabase: vi.fn().mockReturnValue(mockDb) };
  TestBed.configureTestingModule({
    providers: [
      ChangeHistoryService,
      { provide: DatabaseFactoryService, useValue: dbFactory },
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
