import { TestBed } from "@angular/core/testing";

import { EntityRelationsService } from "./entity-relations.service";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "./mock-entity-mapper-service";
import { DatabaseEntity, EntityRegistry } from "../database-entity.decorator";
import { Entity } from "../model/entity";
import { DatabaseField } from "../database-field.decorator";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { EntityMapperService } from "./entity-mapper.service";
import { EntitySchemaField } from "../schema/entity-schema-field";
import { expectArrayWithExactContents } from "../../../utils/test-utils/array-test-utils";
import { DefaultDatatype } from "../default-datatype/default.datatype";
import { AttendanceDatatype } from "../../../features/attendance/model/attendance.datatype";

describe("EntityRelationsService", () => {
  let service: EntityRelationsService;

  @DatabaseEntity("EntityWithTestRelations")
  class EntityWithTestRelations extends Entity {
    @DatabaseField({
      dataType: "entity",
      isArray: true,
      additional: TestEntity.ENTITY_TYPE,
    })
    refSingle: string;

    @DatabaseField({
      dataType: "entity",
      isArray: true,
      additional: [TestEntity.ENTITY_TYPE, "Other"],
    })
    refMulti: string[];
  }

  let primaryEntity: TestEntity;

  beforeEach(() => {
    primaryEntity = TestEntity.create("Primary");

    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        ...mockEntityMapperProvider([primaryEntity]),
        { provide: DefaultDatatype, useClass: AttendanceDatatype, multi: true },
      ],
    });
    service = TestBed.inject(EntityRelationsService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should getEntityTypesReferencingType with all entity types having schema fields referencing the given type", () => {
    @DatabaseEntity("ReferencingEntity")
    class ReferencingEntity extends Entity {
      @DatabaseField({
        dataType: "entity",
        isArray: true,
        additional: "Child",
      })
      refChildren: string[];

      @DatabaseField({
        dataType: "entity",
        additional: "Child",
      })
      refChild: string;

      @DatabaseField({
        dataType: "entity",
        additional: "School",
      })
      refSchool: string;

      @DatabaseField({
        dataType: "entity",
        isArray: true,
        additional: ["Child", "School"],
      })
      multiTypeRef: string[];
    }

    // mock entityRegistry result to only have the ones given here without other types registered across the codebase
    const entityRegistry = TestBed.inject(EntityRegistry);
    vi.spyOn(entityRegistry, "values").mockImplementation(() =>
      [ReferencingEntity, Entity][Symbol.iterator](),
    );

    const result = service.getEntityTypesReferencingType("Child");

    expect(result).toEqual([
      {
        entityType: ReferencingEntity,
        referencingProperties: [
          { id: "refChildren", ...ReferencingEntity.schema.get("refChildren") },
          { id: "refChild", ...ReferencingEntity.schema.get("refChild") },
          {
            id: "multiTypeRef",
            ...ReferencingEntity.schema.get("multiTypeRef"),
          },
        ],
      },
    ]);
  });

  it("should find all entities linking to entity", async () => {
    const eSingleRef = new EntityWithTestRelations();
    eSingleRef.refSingle = primaryEntity.getId();

    const eMultiRef = new EntityWithTestRelations();
    eMultiRef.refMulti = [primaryEntity.getId(), "Other:123", "TestEntity:123"];

    const eDoubleRef = new EntityWithTestRelations();
    eDoubleRef.refSingle = primaryEntity.getId();
    eDoubleRef.refMulti = [primaryEntity.getId(), "Other:123"];

    const eUnrelated = new EntityWithTestRelations();
    eUnrelated.refSingle = "Other:123";

    const eTestRef = new TestEntity();
    eTestRef.ref = primaryEntity.getId();

    (TestBed.inject(EntityMapperService) as MockEntityMapperService).addAll([
      eSingleRef,
      eMultiRef,
      eDoubleRef,
      eTestRef,
      eUnrelated,
    ]);

    // Act
    const result = await service.loadAllLinkingToEntity(primaryEntity);

    // Assert
    expectArrayWithExactContents(result, [
      {
        entity: eSingleRef,
        fields: [expect.objectContaining({ id: "refSingle" })],
      },
      {
        entity: eMultiRef,
        fields: [expect.objectContaining({ id: "refMulti" })],
      },
      {
        entity: eDoubleRef,
        fields: [
          expect.objectContaining({ id: "refSingle" }),
          expect.objectContaining({ id: "refMulti" }),
        ],
      },
      { entity: eTestRef, fields: [expect.objectContaining({ id: "ref" })] },
    ]);
  });

  it("discovers an embedded reference whose override only restricts the entity types, inheriting dataType 'entity'", () => {
    @DatabaseEntity("EntityWithPartialAttendanceOverride")
    class EntityWithPartialAttendanceOverride extends Entity {}
    EntityWithPartialAttendanceOverride.schema.set("attendance", {
      dataType: "attendance",
      additional: { participant: { additional: ["Child"] } },
    });
    const entityRegistry = TestBed.inject(EntityRegistry);
    vi.spyOn(entityRegistry, "values").mockImplementation(() =>
      [EntityWithPartialAttendanceOverride][Symbol.iterator](),
    );

    const result = service.getEntityTypesReferencingType("Child");

    expect(result).toEqual([
      {
        entityType: EntityWithPartialAttendanceOverride,
        referencingProperties: [expect.objectContaining({ id: "attendance" })],
      },
    ]);
  });

  describe("itemReferencesId", () => {
    const attendanceField: EntitySchemaField = {
      dataType: "schema-embed",
      additional: {
        participant: { dataType: "entity", additional: ["Child"] },
        status: { dataType: "configurable-enum", additional: "att-status" },
        remarks: { dataType: "string" },
      },
    };

    it.each<[string, unknown, EntitySchemaField | undefined, boolean]>([
      ["a plain matching id", "Child:1", undefined, true],
      ["a plain other id", "Child:2", undefined, false],
      [
        "an embedded object referencing it in a declared reference key",
        { participant: "Child:1", status: "PRESENT", remarks: "" },
        attendanceField,
        true,
      ],
      [
        "an embedded object where only a non-reference property equals the id",
        { participant: "Child:2", remarks: "Child:1" },
        attendanceField,
        false,
      ],
      [
        "an embedded object of a partially overridden reference, where only a non-reference property equals the id",
        { participant: "Child:2", remarks: "Child:1" },
        {
          dataType: "attendance",
          additional: { participant: { additional: ["Child"] } },
        },
        false,
      ],
      [
        "an object without a schema field (checking all values)",
        { participant: "Child:1", remarks: "some text" },
        undefined,
        true,
      ],
      [
        "an object for a field without embedded schema (checking all values)",
        { participant: "Child:1", remarks: "text" },
        { dataType: "entity", additional: "Child" },
        true,
      ],
    ])("detects a reference correctly for %s", (_, item, field, expected) => {
      expect(service.itemReferencesId(item, "Child:1", field)).toBe(expected);
    });
  });
});
