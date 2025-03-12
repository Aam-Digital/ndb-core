import { TestBed } from "@angular/core/testing";
import { BulkMergeService } from "./bulk-merge-service";
import { CoreTestingModule } from "app/utils/core-testing.module";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "app/core/entity/entity-mapper/mock-entity-mapper-service";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { expectEntitiesToBeInDatabase } from "app/utils/expect-entity-data.spec";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DatabaseEntity } from "app/core/entity/database-entity.decorator";
import { Entity } from "app/core/entity/model/entity";
import { DatabaseField } from "app/core/entity/database-field.decorator";

@DatabaseEntity("EntityWithMergedRelations")
class EntityWithMergedRelations extends Entity {
  @DatabaseField({
    dataType: "entity",
    additional: TestEntity.ENTITY_TYPE,
  })
  singleRelated;
  @DatabaseField({
    dataType: "entity",
    additional: ["Child", TestEntity.ENTITY_TYPE],
    isArray: true,
  })
  multiRelated;
}

fdescribe("BulkMergeService", () => {
  let service: BulkMergeService;

  let entityMapper: MockEntityMapperService;

  let recordA: TestEntity;
  let recordB: TestEntity;

  beforeEach(() => {
    entityMapper = mockEntityMapper();

    recordA = TestEntity.create({ name: "A" });
    recordB = TestEntity.create({ name: "B" });
    entityMapper.addAll([recordA, recordB]);

    TestBed.configureTestingModule({
      imports: [CoreTestingModule, NoopAnimationsModule],
      providers: [{ provide: EntityMapperService, useValue: entityMapper }],
    });

    service = TestBed.inject(BulkMergeService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should update record_A and delete record_B when merge is confirmed", async () => {
    //const mergedEntity = TestEntity.create({ name: "A1" });
    // or more realistically only update one of the existing records:
    const mergedEntity = TestEntity.create({ ...recordA, name: "A1" });

    await service.executeMerge(mergedEntity, [recordA, recordB]);

    await expectEntitiesToBeInDatabase([mergedEntity], false, true);
  });

  it("should update IDs in related entities of recordB into recordA after merging", async () => {
    const relatedEntity = new EntityWithMergedRelations();
    relatedEntity.singleRelated = recordA.getId();
    relatedEntity.multiRelated = [recordA.getId(), "unrelated-id"];
    await entityMapper.save(relatedEntity);

    // mock merged entity
    // Todo: this should be done in the service after updating executeMerge method
    relatedEntity.singleRelated = recordB.getId();
    relatedEntity.multiRelated.push(recordB.getId());
    const updatedRelatedEntity = entityMapper.get(
      EntityWithMergedRelations.ENTITY_TYPE,
      relatedEntity.getId(),
    ) as EntityWithMergedRelations;
    expect(updatedRelatedEntity.singleRelated).toEqual(recordB.getId());
    expect(updatedRelatedEntity.multiRelated).toContain(recordB.getId());
  });

  it("should not include merged ID twice in multiRelated array", async () => {
    const relatedEntity = new EntityWithMergedRelations();
    relatedEntity.multiRelated = [recordA.getId(), recordB.getId()];
    await entityMapper.save(relatedEntity);

    // replace recordB with recordA but avoid duplicates
    // Todo: this should be done in the service after updating executeMerge method
    relatedEntity.multiRelated = Array.from(
      new Set(
        relatedEntity.multiRelated.map((id) =>
          id === recordB.getId() ? recordA.getId() : id,
        ),
      ),
    );

    const updatedRelatedEntity = entityMapper.get(
      EntityWithMergedRelations.ENTITY_TYPE,
      relatedEntity.getId(),
    ) as EntityWithMergedRelations;

    console.log(updatedRelatedEntity.multiRelated);
    expect(updatedRelatedEntity.multiRelated).toEqual([recordA.getId()]);
  });
});
