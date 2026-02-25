import { TestBed } from "@angular/core/testing";
import { BulkMergeService } from "./bulk-merge-service";
import { CoreTestingModule } from "app/utils/core-testing.module";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "app/core/entity/entity-mapper/mock-entity-mapper-service";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { expectEntitiesToBeInDatabase } from "app/utils/expect-entity-data.spec";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DatabaseEntity } from "app/core/entity/database-entity.decorator";
import { Entity } from "app/core/entity/model/entity";
import { DatabaseField } from "app/core/entity/database-field.decorator";
import { AttendanceItem } from "#src/app/features/attendance/model/attendance-item";
import { Note } from "app/child-dev-project/notes/model/note";
import { createEntityOfType } from "app/core/demo-data/create-entity-of-type";

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

describe("BulkMergeService", () => {
  let service: BulkMergeService;

  let entityMapper: MockEntityMapperService;

  let recordA: TestEntity;
  let recordB: TestEntity;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreTestingModule, NoopAnimationsModule],
      providers: [...mockEntityMapperProvider()],
    });

    service = TestBed.inject(BulkMergeService);
    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;

    recordA = TestEntity.create({ name: "A" });
    recordB = TestEntity.create({ name: "B" });
    entityMapper.addAll([recordA, recordB]);
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

  it("should update IDs in singleRelated entities of recordB into recordA after merging", async () => {
    const relatedEntity = new EntityWithMergedRelations();
    relatedEntity.singleRelated = recordB.getId();
    await entityMapper.save(relatedEntity);

    const mergedEntity = TestEntity.create({ ...recordA, name: "A1" });

    await service.executeMerge(mergedEntity, [recordA, recordB]);

    const updatedRelatedEntity = entityMapper.get(
      EntityWithMergedRelations.ENTITY_TYPE,
      relatedEntity.getId(),
    ) as EntityWithMergedRelations;

    expect(updatedRelatedEntity.singleRelated).toEqual(recordA.getId());
  });

  it("should update IDs in multiRelated entities of recordB into recordA without duplicating recordA's ID", async () => {
    const relatedEntity = new EntityWithMergedRelations();
    relatedEntity.multiRelated = [recordA.getId(), recordB.getId()];
    await entityMapper.save(relatedEntity);

    const mergedEntity = TestEntity.create({ ...recordA, name: "A1" });

    await service.executeMerge(mergedEntity, [recordA, recordB]);

    const updatedRelatedEntity = entityMapper.get(
      EntityWithMergedRelations.ENTITY_TYPE,
      relatedEntity.getId(),
    ) as EntityWithMergedRelations;

    expect(updatedRelatedEntity.multiRelated).toEqual([recordA.getId()]);
    expect(updatedRelatedEntity.multiRelated).not.toContain(recordB.getId());
  });

  it("should update childrenAttendance when merging Child entities", async () => {
    const child1 = createEntityOfType("Child", "child1");
    const child2 = createEntityOfType("Child", "child2");

    const note1 = new Note("note1");
    note1.addChild(child1);

    const note2 = new Note("note2");
    note2.addChild(child2);

    const attendance = new AttendanceItem();
    (note2 as any).childrenAttendance.set(child2.getId(), attendance);

    await entityMapper.saveAll([note1, note2]);

    const mergedEntity = TestEntity.create({ ...child1, name: "A1" });
    await service.executeMerge(mergedEntity, [child1, child2]);

    const updatedNote = await entityMapper.load(Note, note2.getId());
    const newAttendance = updatedNote.getAttendance(child1.getId());
    expect(newAttendance).toBeDefined();
  });
});
