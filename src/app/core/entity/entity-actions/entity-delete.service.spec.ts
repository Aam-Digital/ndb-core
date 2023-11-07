import { TestBed } from "@angular/core/testing";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { EntityDeleteService } from "./entity-delete.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../entity-mapper/mock-entity-mapper-service";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import {
  allEntities,
  ENTITIES,
  EntityWithAnonRelations,
  expectAllUnchangedExcept,
  expectDeleted,
  expectUpdated,
} from "./cascading-entity-action.spec";
import { expectEntitiesToMatch } from "../../../utils/expect-entity-data.spec";

fdescribe("EntityDeleteService", () => {
  let service: EntityDeleteService;
  let entityMapper: MockEntityMapperService;

  beforeEach(() => {
    entityMapper = mockEntityMapper(allEntities.map((e) => e.copy()));

    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        EntityDeleteService,
        { provide: EntityMapperService, useValue: entityMapper },
      ],
    });

    service = TestBed.inject(EntityDeleteService);
  });

  function removeReference(
    entity: EntityWithAnonRelations,
    property: "refAggregate" | "refComposite",
    referencedEntity: EntityWithAnonRelations,
  ) {
    const result = entity.copy();
    result[property] = result[property].filter(
      (id) =>
        id !== referencedEntity.getId() && id !== referencedEntity.getId(true),
    );
    return result;
  }

  it("should not cascade delete the related entity if the entity holding the reference is deleted", async () => {
    // for direct references (e.g. x.referencesToRetainAnonymized --> recursively calls anonymize on referenced entities)
    //    see EntityDatatype & EntityArrayDatatype for unit tests

    await service.deleteEntity(ENTITIES.ReferencingSingleComposite);

    expectDeleted([ENTITIES.ReferencingSingleComposite], entityMapper);
    expectAllUnchangedExcept(
      [ENTITIES.ReferencingSingleComposite],
      entityMapper,
    );
  });

  it("should cascade delete the 'composite'-type entity that references the entity user acts on", async () => {
    await service.deleteEntity(ENTITIES.ReferencedAsComposite);

    expectDeleted(
      [ENTITIES.ReferencedAsComposite, ENTITIES.ReferencingSingleComposite],
      entityMapper,
    );
    expectAllUnchangedExcept(
      [ENTITIES.ReferencedAsComposite, ENTITIES.ReferencingSingleComposite],
      entityMapper,
    );
  });

  it("should not cascade delete the 'composite'-type entity that still references additional other entities but remove id", async () => {
    const result = await service.deleteEntity(
      ENTITIES.ReferencedAsOneOfMultipleComposites1,
    );

    const expectedUpdatedRelEntity = removeReference(
      ENTITIES.ReferencingTwoComposites,
      "refComposite",
      ENTITIES.ReferencedAsOneOfMultipleComposites1,
    );
    expectDeleted(
      [ENTITIES.ReferencedAsOneOfMultipleComposites1],
      entityMapper,
    );
    expectUpdated([expectedUpdatedRelEntity], entityMapper);
    expectAllUnchangedExcept(
      [
        ENTITIES.ReferencedAsOneOfMultipleComposites1,
        ENTITIES.ReferencingTwoComposites,
      ],
      entityMapper,
    );
    // warn user that there may be personal details in referencing entity which have not been deleted
    expectEntitiesToMatch(result.potentiallyRetainingPII, [
      expectedUpdatedRelEntity,
    ]);
  });

  it("should cascade delete the 'composite'-type entity that references the entity user acts on even when another property holds other id (e.g. ChildSchoolRelation)", async () => {
    await service.deleteEntity(
      ENTITIES.ReferencingCompositeAndAggregate_refComposite,
    );

    expectDeleted(
      [
        ENTITIES.ReferencingCompositeAndAggregate_refComposite,
        ENTITIES.ReferencingCompositeAndAggregate,
      ],
      entityMapper,
    );
    expectAllUnchangedExcept(
      [
        ENTITIES.ReferencingCompositeAndAggregate_refComposite,
        ENTITIES.ReferencingCompositeAndAggregate,
      ],
      entityMapper,
    );
  });

  it("should not cascade delete the 'aggregate'-type entity that only references the entity user acts on but remove id", async () => {
    const result = await service.deleteEntity(
      ENTITIES.ReferencingAggregate_ref,
    );

    const expectedUpdatedRelEntity = removeReference(
      ENTITIES.ReferencingAggregate,
      "refAggregate",
      ENTITIES.ReferencingAggregate_ref,
    );
    expectDeleted([ENTITIES.ReferencingAggregate_ref], entityMapper);
    expectUpdated([expectedUpdatedRelEntity], entityMapper);
    expectAllUnchangedExcept(
      [ENTITIES.ReferencingAggregate_ref, ENTITIES.ReferencingAggregate],
      entityMapper,
    );
    // warn user that there may be personal details in referencing entity which have not been deleted
    expectEntitiesToMatch(result.potentiallyRetainingPII, [
      expectedUpdatedRelEntity,
    ]);
  });

  it("should not cascade delete the 'aggregate'-type entity that still references additional other entities but remove id", async () => {
    await service.deleteEntity(ENTITIES.ReferencingTwoAggregates_ref1);

    expectDeleted([ENTITIES.ReferencingTwoAggregates_ref1], entityMapper);
    expectUpdated(
      [
        removeReference(
          ENTITIES.ReferencingTwoAggregates,
          "refAggregate",
          ENTITIES.ReferencingTwoAggregates_ref1,
        ),
      ],
      entityMapper,
    );
    expectAllUnchangedExcept(
      [
        ENTITIES.ReferencingTwoAggregates_ref1,
        ENTITIES.ReferencingTwoAggregates,
      ],
      entityMapper,
    );
  });

  // TODO: test Note with attendance (?)
  // TODO: test for entity with two properties referencing the same entity type
});