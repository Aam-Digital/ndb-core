import { TestBed } from "@angular/core/testing";

import { ImportAdditionalService } from "./import-additional.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { mockEntityMapperProvider } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { Entity } from "../../entity/model/entity";
import { ImportMetadata, ImportSettings } from "../import-metadata";
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
  let testActivity: DirectlyLinkingEntity;

  @DatabaseEntity("ImportedEntity")
  class ImportedEntity extends Entity {}

  @DatabaseEntity("DirectlyLinkingEntity")
  class DirectlyLinkingEntity extends Entity {
    @DatabaseField({
      dataType: "entity",
      additional: ImportedEntity.ENTITY_TYPE,
      isArray: true, // this must take multiple values so that a whole import can be linked
    })
    participants: string[];
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
    testEntities = [new ImportedEntity("1"), new ImportedEntity("2")];
    testActivity = new DirectlyLinkingEntity("3");
    testActivity.participants = [];
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
        targetProperty: "participants",
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
        targetProperty: "participants",
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
      entityType: ImportedEntity.ENTITY_TYPE,
      columnMapping: undefined,
      additionalActions: [
        {
          mode: "direct",
          targetType: DirectlyLinkingEntity.ENTITY_TYPE,
          targetProperty: "participants",
          targetId: testActivity.getId(),
          sourceType: ImportedEntity.ENTITY_TYPE,
        },
      ],
    };
    await service.executeImport(testEntities, testImportSettings);

    const activityAfter = await TestBed.inject(EntityMapperService).load(
      DirectlyLinkingEntity,
      testActivity.getId(),
    );
    expect(activityAfter.participants).toEqual([
      "ImportedEntity:1",
      "ImportedEntity:2",
    ]);
  });

  it("should remove IDs from reference field in other entity with undo", async () => {
    const importMeta = new ImportMetadata();
    importMeta.config = {
      entityType: ImportedEntity.ENTITY_TYPE,
      columnMapping: undefined,
      additionalActions: [
        {
          mode: "direct",
          targetType: DirectlyLinkingEntity.ENTITY_TYPE,
          targetProperty: "participants",
          targetId: testActivity.getId(),
          sourceType: ImportedEntity.ENTITY_TYPE,
        },
      ],
    };
    importMeta.createdEntities = ["ImportedEntity:1", "ImportedEntity:2"];
    testActivity.participants = [
      "ImportedEntity:3",
      "ImportedEntity:2",
      "ImportedEntity:1",
    ];
    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.saveAll([testActivity]);

    await service.undoImport(importMeta);

    const activityAfter = await TestBed.inject(EntityMapperService).load(
      DirectlyLinkingEntity,
      testActivity.getId(),
    );
    expect(activityAfter.participants).toEqual(["ImportedEntity:3"]);
  });

  it("should create relationship entities for imported data with linkIndirectly action", async () => {
    const testEntities: Entity[] = [
      new ImportedEntity("1"),
      new ImportedEntity("2"),
    ];
    const entityMapper = TestBed.inject(EntityMapperService);

    const testImportSettings: ImportSettings = {
      entityType: ImportedEntity.ENTITY_TYPE,
      columnMapping: undefined,
      additionalActions: [
        {
          mode: "indirect",
          sourceType: ImportedEntity.ENTITY_TYPE,
          targetType: "Other",
          relationshipEntityType: RelationshipEntity.ENTITY_TYPE,
          relationshipProperty: "participant",
          relationshipTargetProperty: "group",
          targetId: "Other:4",
        },
      ],
    };
    await service.executeImport(testEntities, testImportSettings);

    const createRelations = await entityMapper.loadType(RelationshipEntity);
    const expectedRelations = [
      { participant: "ImportedEntity:1", group: "Other:4" },
      { participant: "ImportedEntity:2", group: "Other:4" },
    ].map((e) => Object.assign(new RelationshipEntity(), e));
    expectEntitiesToMatch(createRelations, expectedRelations, true);
  });

  it("should remove relationship entities with undo", async () => {
    const importMeta = new ImportMetadata();
    importMeta.config = {
      entityType: ImportedEntity.ENTITY_TYPE,
      columnMapping: undefined,
      additionalActions: [
        {
          mode: "indirect",
          sourceType: ImportedEntity.ENTITY_TYPE,
          targetType: "Other",
          relationshipEntityType: RelationshipEntity.ENTITY_TYPE,
          relationshipProperty: "participant",
          relationshipTargetProperty: "group",
          targetId: "Other:4",
        },
      ],
    };
    importMeta.createdEntities = ["ImportedEntity:1", "ImportedEntity:2"];
    const relations = [
      { participant: "ImportedEntity:1", group: "Other:4" },
      { participant: "ImportedEntity:2", group: "Other:4" },
      { participant: "ImportedEntity:3", group: "Other:4" }, // Other entity same group -> keep
      { participant: "ImportedEntity:2", group: "Other:3" }, // Imported entity different group -> remove
    ].map((e) => Object.assign(new RelationshipEntity(), e));
    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.saveAll([...relations]);

    await service.undoImport(importMeta);

    await expectEntitiesToBeInDatabase([relations[2]], false, true);
  });

  it("should handle array of target types", () => {
    const multiTypeAction: any = {
      sourceType: ImportedEntity.ENTITY_TYPE,
      mode: "direct",
      targetType: [
        ImportedEntity.ENTITY_TYPE,
        DirectlyLinkingEntity.ENTITY_TYPE,
      ],
      targetProperty: "participants",
    };
    const label = service.createActionLabel(multiTypeAction);
    expect(label).toContain("ImportedEntity / DirectlyLinkingEntity");
  });
});
