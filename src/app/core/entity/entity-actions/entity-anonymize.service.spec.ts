import { TestBed } from "@angular/core/testing";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { Entity } from "../model/entity";
import { of } from "rxjs";
import { DatabaseEntity } from "../database-entity.decorator";
import { DatabaseField } from "../database-field.decorator";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../entity-mapper/mock-entity-mapper-service";
import {
  comparableEntityData,
  expectEntitiesToMatch,
} from "../../../utils/expect-entity-data.spec";
import { UpdateMetadata } from "../model/update-metadata";
import { FileService } from "../../../features/file/file.service";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { DefaultDatatype } from "../default-datatype/default.datatype";
import { FileDatatype } from "../../../features/file/file.datatype";
import moment from "moment";
import {
  allEntities,
  ENTITIES,
  EntityWithAnonRelations,
  expectAllUnchangedExcept,
} from "./cascading-entity-action.spec";
import { EntityAnonymizeService } from "./entity-anonymize.service";

describe("EntityAnonymizeService", () => {
  let service: EntityAnonymizeService;
  let entityMapper: MockEntityMapperService;
  let mockFileService: jasmine.SpyObj<FileService>;

  beforeEach(() => {
    entityMapper = mockEntityMapper(allEntities.map((e) => e.copy()));

    mockFileService = jasmine.createSpyObj(["removeFile"]);
    mockFileService.removeFile.and.returnValue(of(null));

    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        EntityAnonymizeService,
        { provide: EntityMapperService, useValue: entityMapper },
        { provide: FileService, useValue: mockFileService },
        { provide: DefaultDatatype, useClass: FileDatatype, multi: true },
      ],
    });

    service = TestBed.inject(EntityAnonymizeService);
  });

  /*
   * ANONYMIZATION
   */
  @DatabaseEntity("AnonymizableEntity")
  class AnonymizableEntity extends Entity {
    static override hasPII = true;

    @DatabaseField() defaultField: string;

    @DatabaseField({ anonymize: "retain" })
    retainedField: string;

    @DatabaseField({
      anonymize: "retain-anonymized",
      dataType: "array",
      innerDataType: "date-only",
    })
    retainAnonymizedDates: Date[];

    @DatabaseField({ dataType: "file" }) file: string;

    @DatabaseField({ anonymize: "retain-anonymized", dataType: "entity-array" })
    referencesToRetainAnonymized: string[];

    static create(properties: Partial<AnonymizableEntity>) {
      return Object.assign(new AnonymizableEntity(), properties);
    }

    static expectAnonymized(
      entityId: string,
      expectedEntity: AnonymizableEntity,
      checkAllBaseProperties = false,
    ) {
      const actualResult = entityMapper
        .get(expectedEntity.getType(), entityId)
        .copy();

      if (!checkAllBaseProperties) {
        delete actualResult.inactive;
        delete actualResult.anonymized;
      }

      expect(comparableEntityData(actualResult, true)).toEqual(
        comparableEntityData(expectedEntity, true),
      );
    }
  }

  it("should anonymize and only keep properties marked to be retained", async () => {
    const entity = new AnonymizableEntity();
    entity.defaultField = "test";
    entity.retainedField = "test";

    await service.anonymizeEntity(entity);

    AnonymizableEntity.expectAnonymized(
      entity.getId(true),
      AnonymizableEntity.create({ retainedField: "test" }),
    );
  });

  it("should anonymize and keep empty record without any fields", async () => {
    const entity = new AnonymizableEntity();
    entity.defaultField = "test";

    await service.anonymizeEntity(entity);

    AnonymizableEntity.expectAnonymized(
      entity.getId(true),
      AnonymizableEntity.create({}),
    );
  });

  it("should anonymize and retain created and updated", async () => {
    const entityProperties = {
      created: new UpdateMetadata("CREATOR", new Date("2020-01-01")),
      updated: new UpdateMetadata("UPDATER", new Date("2020-01-02")),
    };
    const entity = AnonymizableEntity.create({
      defaultField: "test",
      ...entityProperties,
    });

    await service.anonymizeEntity(entity);

    AnonymizableEntity.expectAnonymized(
      entity.getId(true),
      AnonymizableEntity.create({
        inactive: true,
        anonymized: true,
        ...entityProperties,
      }),
      true,
    );
  });

  it("should mark anonymized entities as inactive", async () => {
    const entity = new AnonymizableEntity();
    entity.defaultField = "test";

    await service.anonymizeEntity(entity);

    AnonymizableEntity.expectAnonymized(
      entity.getId(true),
      AnonymizableEntity.create({ inactive: true, anonymized: true }),
      true,
    );
  });

  it("should anonymize array values recursively and use datatype implementation for 'retain-anonymized", async () => {
    const entity = new AnonymizableEntity();
    entity.retainAnonymizedDates = [
      moment("2023-09-25").toDate(),
      moment("2023-10-04").toDate(),
    ];

    await service.anonymizeEntity(entity);

    AnonymizableEntity.expectAnonymized(
      entity.getId(true),
      AnonymizableEntity.create({
        retainAnonymizedDates: [
          moment("2023-07-01").toDate(),
          moment("2023-07-01").toDate(),
        ],
      }),
    );
  });

  it("should anonymize file values, actively deleting file attachments", async () => {
    const entity = new AnonymizableEntity();
    entity.file = "test-file.txt";

    await service.anonymizeEntity(entity);

    AnonymizableEntity.expectAnonymized(
      entity.getId(true),
      AnonymizableEntity.create({}),
    );
    expect(mockFileService.removeFile).toHaveBeenCalled();
  });

  it("should not anonymize fields if Entity type is set to not have PII", async () => {
    AnonymizableEntity.hasPII = false;
    const entity = new AnonymizableEntity();
    // make sure the original entity is available initially (we expect it to remain unchanged)
    entityMapper.add(entity);
    entity.defaultField = "test";

    await service.anonymizeEntity(entity);

    AnonymizableEntity.expectAnonymized(
      entity.getId(true),
      AnonymizableEntity.create({ defaultField: "test" }),
      true,
    );

    // reset actual state
    AnonymizableEntity.hasPII = true;
  });

  /*
    CASCADING ANONYMIZATION
   */
  function expectAnonymized(
    expectedToGetAnonymized: EntityWithAnonRelations[],
    entityMapper: MockEntityMapperService,
  ) {
    const actualEntitiesAfter = entityMapper.getAllData();

    for (const anonEntity of expectedToGetAnonymized) {
      const actualEntity = actualEntitiesAfter.find(
        (e) => e.getId(true) === anonEntity.getId(true),
      );

      const expectedAnonymizedEntity = new EntityWithAnonRelations(
        anonEntity.getId(true),
      );
      // copy over properties that are marked as `anonymize: "retain"`
      expectedAnonymizedEntity.refAggregate = anonEntity.refAggregate;
      expectedAnonymizedEntity.refComposite = anonEntity.refComposite;
      expectedAnonymizedEntity.inactive = true;
      expectedAnonymizedEntity.anonymized = true;

      expect(comparableEntityData(actualEntity)).toEqual(
        comparableEntityData(expectedAnonymizedEntity),
      );
    }

    expectAllUnchangedExcept(expectedToGetAnonymized, entityMapper);
  }

  it("should not cascade anonymize the related entity if the entity holding the reference is anonymized", async () => {
    // for direct references (e.g. x.referencesToRetainAnonymized --> recursively calls anonymize on referenced entities)
    //    see EntityDatatype & EntityArrayDatatype for unit tests

    await service.anonymizeEntity(ENTITIES.ReferencingSingleComposite);

    expectAnonymized([ENTITIES.ReferencingSingleComposite], entityMapper);
  });

  it("should cascade anonymize the 'composite'-type entity that references the entity user acts on", async () => {
    await service.anonymizeEntity(ENTITIES.ReferencedAsComposite);

    expectAnonymized(
      [ENTITIES.ReferencedAsComposite, ENTITIES.ReferencingSingleComposite],
      entityMapper,
    );
  });

  it("should not cascade anonymize the 'composite'-type entity that still references additional other entities but ask user", async () => {
    const result = await service.anonymizeEntity(
      ENTITIES.ReferencedAsOneOfMultipleComposites1,
    );

    expectAnonymized(
      [ENTITIES.ReferencedAsOneOfMultipleComposites1],
      entityMapper,
    );
    // warn user that there may be personal details in referencing entity which have not been deleted
    expectEntitiesToMatch(result.potentiallyRetainingPII, [
      ENTITIES.ReferencingTwoComposites,
    ]);
  });

  it("should cascade anonymize the 'composite'-type entity that references the entity user acts on even when another property holds other id (e.g. ChildSchoolRelation)", async () => {
    await service.anonymizeEntity(
      ENTITIES.ReferencingCompositeAndAggregate_refComposite,
    );

    expectAnonymized(
      [
        ENTITIES.ReferencingCompositeAndAggregate_refComposite,
        ENTITIES.ReferencingCompositeAndAggregate,
      ],
      entityMapper,
    );
  });

  it("should not cascade anonymize the 'aggregate'-type entity that only references the entity user acts on but ask user", async () => {
    const result = await service.anonymizeEntity(
      ENTITIES.ReferencingAggregate_ref,
    );

    expectAnonymized([ENTITIES.ReferencingAggregate_ref], entityMapper);
    // warn user that there may be personal details in referencing entity which have not been deleted
    expectEntitiesToMatch(result.potentiallyRetainingPII, [
      ENTITIES.ReferencingAggregate,
    ]);
  });

  it("should not cascade anonymize the 'aggregate'-type entity that still references additional other entities but ask user", async () => {
    const result = await service.anonymizeEntity(
      ENTITIES.ReferencingTwoAggregates_ref1,
    );

    expectAnonymized([ENTITIES.ReferencingTwoAggregates_ref1], entityMapper);
    // warn user that there may be personal details in referencing entity which have not been deleted
    expectEntitiesToMatch(result.potentiallyRetainingPII, [
      ENTITIES.ReferencingTwoAggregates,
    ]);
  });
});
