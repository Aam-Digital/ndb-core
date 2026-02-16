import { TestBed } from "@angular/core/testing";

import { ImportAdditionalService } from "./import-additional.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { mockEntityMapperProvider } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { Entity } from "../../entity/model/entity";
import { createEntityOfType } from "../../demo-data/create-entity-of-type";
import { RecurringActivity } from "#src/app/features/attendance/model/recurring-activity";
import { ImportMetadata, ImportSettings } from "../import-metadata";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import {
  expectEntitiesToBeInDatabase,
  expectEntitiesToMatch,
} from "../../../utils/expect-entity-data.spec";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { DatabaseField } from "../../entity/database-field.decorator";

describe("ImportAdditionalService", () => {
  let service: ImportAdditionalService;

  let testEntities: Entity[];
  let testActivity: RecurringActivity;

  // ensure the "Child" entityType is registered
  @DatabaseEntity("Child")
  class Child extends Entity {}

  @DatabaseEntity("ImportedEntity")
  class ImportedEntity extends Entity {}

  @DatabaseEntity("DirectlyLinkingEntity")
  class DirectlyLinkingEntity extends Entity {
    @DatabaseField({
      dataType: "entity",
      additional: ImportedEntity.ENTITY_TYPE,
      isArray: true, // this must take multiple values so that a whole import can be linked
    })
    participant: string;
  }

  @DatabaseEntity("RelationshipEntity")
  class RelationshipEntity extends Entity {
    @DatabaseField({
      dataType: "entity",
      additional: ImportedEntity.ENTITY_TYPE,
      entityReferenceRole: "composite", // to ensure it's shown as indirect link
    })
    participant: string;

    @DatabaseField({ dataType: "entity", additional: "Other" })
    group: string;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [...mockEntityMapperProvider()],
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

  it("should get actions linking for the given imported type", async () => {
    const actual = service.getActionsLinkingFor(ImportedEntity.ENTITY_TYPE);
    expect(actual).toEqual([
      {
        sourceType: ImportedEntity.ENTITY_TYPE,
        mode: "direct",
        targetType: DirectlyLinkingEntity.ENTITY_TYPE,
        targetProperty: "participant",
      },
      // the following should be hidden because it's also an indirect/relationship entity
      /* {
        sourceType: ImportedEntity.ENTITY_TYPE,
        mode: "direct",
        targetType: RelationshipEntity.ENTITY_TYPE,
        targetProperty: "participant",
      }, */
      {
        sourceType: ImportedEntity.ENTITY_TYPE,
        mode: "indirect",
        relationshipEntityType: RelationshipEntity.ENTITY_TYPE,
        relationshipProperty: "participant",
        relationshipTargetProperty: "group",
        targetType: "Other",
        expertOnly: false,
      },
    ]);
  });

  it("should get actions linking imported data to the given type for directly linked", async () => {
    const actual = service.getActionsLinkingTo(
      DirectlyLinkingEntity.ENTITY_TYPE,
    );
    expect(actual).toEqual([
      jasmine.objectContaining({
        sourceType: ImportedEntity.ENTITY_TYPE,
        targetProperty: "participant",
        targetType: DirectlyLinkingEntity.ENTITY_TYPE,
      }),
    ]);
  });

  it("should  get actions linking imported data to the given type for indirectly linked", async () => {
    const actual = service.getActionsLinkingTo("Other");
    expect(actual).toEqual([
      jasmine.objectContaining({
        sourceType: ImportedEntity.ENTITY_TYPE,
        mode: "indirect",
        relationshipEntityType: RelationshipEntity.ENTITY_TYPE,
        relationshipProperty: "participant",
        relationshipTargetProperty: "group",
        targetType: "Other",
      }),
    ]);
  });

  it("should add IDs of imported data to other entity with linkDirectly action", async () => {
    const testImportSettings: ImportSettings = {
      entityType: "Child",
      columnMapping: undefined,
      additionalActions: [
        {
          mode: "direct",
          targetType: "RecurringActivity",
          targetProperty: "participants",
          targetId: testActivity.getId(),
          sourceType: "Child",
        },
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
      additionalActions: [
        {
          mode: "direct",
          targetType: "RecurringActivity",
          targetProperty: "participants",
          targetId: testActivity.getId(),
          sourceType: "Child",
        },
      ],
    };
    importMeta.createdEntities = ["Child:1", "Child:2"];
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
      additionalActions: [
        {
          mode: "indirect",
          sourceType: "Child",
          targetType: "School",
          relationshipEntityType: "ChildSchoolRelation",
          relationshipProperty: "childId",
          relationshipTargetProperty: "schoolId",
          targetId: "School:4",
        },
      ],
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
      additionalActions: [
        {
          mode: "indirect",
          sourceType: "Child",
          targetType: "School",
          relationshipEntityType: "ChildSchoolRelation",
          relationshipProperty: "childId",
          relationshipTargetProperty: "schoolId",
          targetId: "School:4",
        },
      ],
    };
    importMeta.createdEntities = ["Child:1", "Child:2"];
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

  it("should handle array of target types", () => {
    const multiTypeAction: any = {
      sourceType: "Child",
      mode: "direct",
      targetType: ["Child", "DirectlyLinkingEntity"],
      targetProperty: "participant",
    };
    const label = service.createActionLabel(multiTypeAction);
    expect(label).toContain("Child / DirectlyLinkingEntity");
  });
});
