import { TestBed } from "@angular/core/testing";
import {
  AUDIT_RECORD_SUBJECT,
  ChangeHistoryService,
} from "./change-history.service";
import { DatabaseFactoryService } from "../../core/database/database-factory.service";
import { EntityAbility } from "../../core/permissions/ability/entity-ability";
import { Entity } from "../../core/entity/model/entity";

let mockDb: { getAll: ReturnType<typeof vi.fn> };
let dbFactory: { createRemoteDatabase: ReturnType<typeof vi.fn> };
let abilityCan: ReturnType<typeof vi.fn>;

function setup(docs: any[] = [], canRead = true) {
  mockDb = { getAll: vi.fn().mockResolvedValue(docs) };
  dbFactory = { createRemoteDatabase: vi.fn().mockReturnValue(mockDb) };
  abilityCan = vi.fn().mockReturnValue(canRead);
  TestBed.configureTestingModule({
    providers: [
      ChangeHistoryService,
      { provide: DatabaseFactoryService, useValue: dbFactory },
      { provide: EntityAbility, useValue: { can: abilityCan } },
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

it("denies viewing history for an internal entity", () => {
  const service = setup([], true);
  expect(service.canViewHistory(savedEntity(InternalEntity))).toBe(false);
});

it("denies viewing history when no entity is given", () => {
  const service = setup([], true);
  expect(service.canViewHistory(undefined)).toBe(false);
});
