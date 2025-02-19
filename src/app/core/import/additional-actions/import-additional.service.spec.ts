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

  // ensure the "Child" entityType is registered
  @DatabaseEntity("Child")
  class Child extends Entity {}

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper() },
      ],
    });
    service = TestBed.inject(ImportAdditionalService);
  });

  it("should link imported data to other entities", async () => {
    const testEntities: Entity[] = [
      createEntityOfType("Child", "1"),
      createEntityOfType("Child", "2"),
    ];
    const activity = new RecurringActivity("3");
    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.save(activity);

    const testImportSettings: ImportSettings = {
      entityType: "Child",
      columnMapping: undefined,
      additionalActions: [
        { type: "RecurringActivity", id: "RecurringActivity:3" },
        { type: "School", id: "School:4" },
      ],
    };
    await service.executeImport(testEntities, testImportSettings);

    const createRelations = await entityMapper.loadType(ChildSchoolRelation);
    const expectedRelations = [
      { childId: "Child:1", schoolId: "School:4" },
      { childId: "Child:2", schoolId: "School:4" },
    ].map((e) => Object.assign(new ChildSchoolRelation(), e));
    expectEntitiesToMatch(createRelations, expectedRelations, true);

    expect(activity.participants).toEqual(["Child:1", "Child:2"]);
  });

  it("should allow to remove relationship entities with undo", async () => {
    const importMeta = new ImportMetadata();
    importMeta.config = {
      entityType: "Child",
      columnMapping: undefined,
      additionalActions: [
        { type: "RecurringActivity", id: "3" },
        { type: "School", id: "4" },
      ],
    };
    importMeta.ids = ["Child:1", "Child:2"];
    const relations = [
      { childId: "1", schoolId: "4" },
      { childId: "2", schoolId: "4" },
      { childId: "3", schoolId: "4" }, // Other child same school -> keep
      { childId: "2", schoolId: "3" }, // Imported child different school -> remove
    ].map((e) => Object.assign(new ChildSchoolRelation(), e));
    const activity = new RecurringActivity("3");
    activity.participants = ["3", "2", "1"];
    const children = ["1", "2", "3"].map((id) =>
      createEntityOfType("Child", id),
    );
    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.saveAll([
      ...children,
      ...relations,
      activity,
      importMeta,
    ]);

    await service.undoImport(importMeta);

    await expectEntitiesToBeInDatabase([relations[2]], false, true);
    expect(activity.participants).toEqual(["3"]);
  });
});
