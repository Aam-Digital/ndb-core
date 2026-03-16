import { TestBed } from "@angular/core/testing";

import {
  EntityRelationsService,
  itemReferencesId,
} from "./entity-relations.service";
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
      providers: [...mockEntityMapperProvider([primaryEntity])],
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
    // TODO: vitest-migration: Verify this matches strict array content (multiset equality). Vitest's arrayContaining is a subset check.

    // Assert
    expect(result).toHaveLength(4);

    // Assert
    expect(result).toEqual(
      expect.arrayContaining([
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
      ]),
    );
  });
});

describe("itemReferencesId", () => {
  it("should match a plain string ID", () => {
    expect(itemReferencesId("Child:1", "Child:1")).toBe(true);
    expect(itemReferencesId("Child:2", "Child:1")).toBe(false);
  });

  it("should match an embedded object by checking only declared entity-reference keys", () => {
    const field: EntitySchemaField = {
      additional: {
        participant: { dataType: "entity", additional: ["Child"] },
        status: { dataType: "configurable-enum", additional: "att-status" },
        remarks: { dataType: "string" },
      },
    };

    const item = { participant: "Child:1", status: "PRESENT", remarks: "" };
    expect(itemReferencesId(item, "Child:1", field)).toBe(true);
  });

  it("should NOT match when a non-reference property happens to equal the ID", () => {
    const field: EntitySchemaField = {
      additional: {
        participant: { dataType: "entity", additional: ["Child"] },
        remarks: { dataType: "string" },
      },
    };

    const item = { participant: "Child:2", remarks: "Child:1" };
    expect(itemReferencesId(item, "Child:1", field)).toBe(false);
  });

  it("should fall back to checking all values when no schema field is provided", () => {
    const item = { participant: "Child:1", remarks: "some text" };
    expect(itemReferencesId(item, "Child:1")).toBe(true);
  });

  it("should fall back to checking all values when field has no embedded schema", () => {
    const field: EntitySchemaField = {
      dataType: "entity",
      additional: "Child",
    };

    const item = { participant: "Child:1", remarks: "text" };
    expect(itemReferencesId(item, "Child:1", field)).toBe(true);
  });
});
