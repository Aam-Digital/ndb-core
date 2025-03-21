import { TestBed } from "@angular/core/testing";

import { EntityRelationsService } from "./entity-relations.service";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { EntityMapperService } from "./entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "./mock-entity-mapper-service";
import { DatabaseEntity, EntityRegistry } from "../database-entity.decorator";
import { Entity } from "../model/entity";
import { DatabaseField } from "../database-field.decorator";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("EntityRelationsService", () => {
  let service: EntityRelationsService;

  let entityMapper: MockEntityMapperService;

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
    entityMapper = mockEntityMapper([primaryEntity]);

    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [{ provide: EntityMapperService, useValue: entityMapper }],
    });
    service = TestBed.inject(EntityRelationsService);
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
    spyOn(entityRegistry, "values").and.returnValue(
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

    entityMapper.addAll([
      eSingleRef,
      eMultiRef,
      eDoubleRef,
      eTestRef,
      eUnrelated,
    ]);

    // Act
    const result = await service.loadAllLinkingToEntity(primaryEntity);

    // Assert
    expect(result).toEqual(
      jasmine.arrayWithExactContents([
        {
          entity: eSingleRef,
          fields: [jasmine.objectContaining({ id: "refSingle" })],
        },
        {
          entity: eMultiRef,
          fields: [jasmine.objectContaining({ id: "refMulti" })],
        },
        {
          entity: eDoubleRef,
          fields: [
            jasmine.objectContaining({ id: "refSingle" }),
            jasmine.objectContaining({ id: "refMulti" }),
          ],
        },
        { entity: eTestRef, fields: [jasmine.objectContaining({ id: "ref" })] },
      ]),
    );
  });
});
