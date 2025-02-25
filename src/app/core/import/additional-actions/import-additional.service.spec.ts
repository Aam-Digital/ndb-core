import { TestBed } from "@angular/core/testing";

import { ImportAdditionalService } from "./import-additional.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { Entity } from "../../entity/model/entity";
import { createEntityOfType } from "../../demo-data/create-entity-of-type";
import { RecurringActivity } from "../../../child-dev-project/attendance/model/recurring-activity";
import { ImportMetadata, ImportSettings } from "../import-metadata";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import {
  expectEntitiesToBeInDatabase,
  expectEntitiesToMatch,
} from "../../../utils/expect-entity-data.spec";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { DatabaseEntity } from "../../entity/database-entity.decorator";

describe("ImportAdditionalService", () => {
  let service: ImportAdditionalService;

  let testEntities: Entity[];
  let testActivity: RecurringActivity;

  // ensure the "Child" entityType is registered
  @DatabaseEntity("Child")
  class Child extends Entity {}

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper() },
      ],
    });
    service = TestBed.inject(ImportAdditionalService);

    // set up basic test data:
    testEntities = [
      createEntityOfType("Child", "1"),
      createEntityOfType("Child", "2"),
    ];
    testActivity = new RecurringActivity("3");
    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.save(testActivity);
  });

  it("should add IDs of imported data to other entity with linkDirectly action", async () => {
    const testImportSettings: ImportSettings = {
      entityType: "Child",
      columnMapping: undefined,
      additionalActions: [
        { type: "RecurringActivity", id: testActivity.getId() },
      ],
    };
    await service.executeImport(testEntities, testImportSettings);

    const activityAfter = await TestBed.inject(EntityMapperService).load(
      testActivity.getConstructor(),
      testActivity.getId(),
    );
    expect(activityAfter.participants).toEqual(["Child:1", "Child:2"]);
  });

  it("should remove IDs from reference field in other entity with undo", async () => {
    const importMeta = new ImportMetadata();
    importMeta.config = {
      entityType: "Child",
      columnMapping: undefined,
      additionalActions: [{ type: "RecurringActivity", id: "3" }],
    };
    importMeta.ids = ["Child:1", "Child:2"];
    testActivity.participants = ["Child:3", "Child:2", "Child:1"];
    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.saveAll([testActivity]);

    await service.undoImport(importMeta);

    const activityAfter = await TestBed.inject(EntityMapperService).load(
      testActivity.getConstructor(),
      testActivity.getId(),
    );
    expect(activityAfter.participants).toEqual(["Child:3"]);
  });

  it("should create relationship entities for imported data with linkIndirectly action", async () => {
    const testEntities: Entity[] = [
      createEntityOfType("Child", "1"),
      createEntityOfType("Child", "2"),
    ];
    const entityMapper = TestBed.inject(EntityMapperService);

    const testImportSettings: ImportSettings = {
      entityType: "Child",
      columnMapping: undefined,
      additionalActions: [{ type: "School", id: "School:4" }],
    };
    await service.executeImport(testEntities, testImportSettings);

    const createRelations = await entityMapper.loadType(ChildSchoolRelation);
    const expectedRelations = [
      { childId: "Child:1", schoolId: "School:4" },
      { childId: "Child:2", schoolId: "School:4" },
    ].map((e) => Object.assign(new ChildSchoolRelation(), e));
    expectEntitiesToMatch(createRelations, expectedRelations, true);
  });

  it("should remove relationship entities with undo", async () => {
    const importMeta = new ImportMetadata();
    importMeta.config = {
      entityType: "Child",
      columnMapping: undefined,
      additionalActions: [{ type: "School", id: "4" }],
    };
    importMeta.ids = ["Child:1", "Child:2"];
    const relations = [
      { childId: "Child:1", schoolId: "School:4" },
      { childId: "Child:2", schoolId: "School:4" },
      { childId: "Child:3", schoolId: "School:4" }, // Other child same school -> keep
      { childId: "Child:2", schoolId: "School:3" }, // Imported child different school -> remove
    ].map((e) => Object.assign(new ChildSchoolRelation(), e));
    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.saveAll([...relations]);

    await service.undoImport(importMeta);

    await expectEntitiesToBeInDatabase([relations[2]], false, true);
  });
});
