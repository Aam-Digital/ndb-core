import { AuditRecord } from "./audit-record";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { TestBed } from "@angular/core/testing";
import { Entity } from "../../../core/entity/model/entity";
import { DefaultDatatype } from "../../../core/entity/default-datatype/default.datatype";
import { StringDatatype } from "../../../core/basic-datatypes/string/string.datatype";
import { DateDatatype } from "../../../core/basic-datatypes/date/date.datatype";

describe("AuditRecord", () => {
  let schemaService: EntitySchemaService;

  const rawDoc = {
    _id: "AuditRecord:Child:123:2026-08-01T10:00:00.000Z:2-abc",
    _rev: "1-def",
    entityId: "Child:123",
    database: "app",
    operation: "update",
    rev: "2-abc",
    parentRev: "1-xyz",
    timestamp: "2026-08-01T10:00:00.000Z",
    user: { id: "User:demo", name: "demo", roles: ["user_app"] },
    diff: { phone: ["old", "new"] },
  };

  function load(doc: object): AuditRecord {
    return schemaService.loadDataIntoEntity(new AuditRecord(), { ...doc });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EntitySchemaService,
        // only the datatypes this entity's fields resolve to
        { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
        { provide: DefaultDatatype, useClass: DateDatatype, multi: true },
      ],
    });
    schemaService = TestBed.inject(EntitySchemaService);
  });

  it("should be stored in its own, remote-only database", () => {
    expect(AuditRecord.DATABASE).toBe(`${Entity.DATABASE}-audit`);
    expect(AuditRecord.DATABASE_REMOTE_ONLY).toBe(true);
  });

  it("should load the raw audit document through the schema", () => {
    const record = load(rawDoc);

    expect(record.timestamp).toEqual(new Date("2026-08-01T10:00:00.000Z"));
    expect(record.operation).toBe("update");
    expect(record.user).toEqual(rawDoc.user);
    expect(record.rev).toBe("2-abc");
    expect(record.parentRev).toBe("1-xyz");
    expect(record.database).toBe("app");
    // the delta is keyed by fields of the changed type, so it stays untouched
    expect(record.diff).toEqual({ phone: ["old", "new"] });
    // loaded from the database, so not a new record
    expect(record.isNew).toBe(false);
    // the document's own `entityId` key must never reach Entity's private
    // accessor of that name, which would rewrite this record's `_id`
    expect(record.getId()).toBe(rawDoc._id);
  });

  it("should derive the changed record and its type from the id", () => {
    const record = load(rawDoc);

    expect(record.record).toBe("Child:123");
    expect(record.recordType).toBe("Child");
  });

  it("should derive a changed record whose own id contains colons", () => {
    // a User's id is its username, which may contain anything
    const record = load({
      ...rawDoc,
      _id: "AuditRecord:User:a:b:c:2026-08-01T10:00:00.000Z:2-abc",
    });

    expect(record.record).toBe("User:a:b:c");
    expect(record.recordType).toBe("User");
  });

  it("should derive the changed record when no revision was recorded", () => {
    // the backend writes "na" when the written rev is unknown
    const record = load({
      ...rawDoc,
      _id: "AuditRecord:Child:123:2026-08-01T10:00:00.000Z:na",
    });

    expect(record.record).toBe("Child:123");
  });
});
