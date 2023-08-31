import { TestBed } from "@angular/core/testing";

import { ImportService } from "./import.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import {
  EntityRegistry,
  entityRegistry,
} from "../entity/database-entity.decorator";
import { Entity } from "../entity/model/entity";
import { ImportMetadata, ImportSettings } from "./import-metadata";
import { ColumnMapping } from "./column-mapping";
import {
  expectEntitiesToBeInDatabase,
  expectEntitiesToMatch,
} from "../../utils/expect-entity-data.spec";
import { HealthCheck } from "../../child-dev-project/children/health-checkup/model/health-check";
import moment from "moment";
import { Child } from "../../child-dev-project/children/model/child";
import { RecurringActivity } from "../../child-dev-project/attendance/model/recurring-activity";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { mockEntityMapper } from "../entity/entity-mapper/mock-entity-mapper-service";
import { ConfigurableEnumService } from "../basic-datatypes/configurable-enum/configurable-enum.service";
import { CoreModule } from "../core.module";
import { ComponentRegistry } from "../../dynamic-components";
import { EntityArrayDatatype } from "../basic-datatypes/entity-array/entity-array.datatype";

describe("ImportService", () => {
  let service: ImportService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CoreModule],
      providers: [
        ImportService,
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        {
          provide: ConfigurableEnumService,
          useValue: new ConfigurableEnumService(mockEntityMapper(), null),
        },
        ComponentRegistry,
      ],
    });
    service = TestBed.inject(ImportService);
  });

  it("should execute import, saving entities and creating history record", async () => {
    const testEntities: Entity[] = [new Entity("1"), new Entity("2")];
    const testImportSettings: ImportSettings = {
      entityType: "Entity",
      columnMapping: undefined,
    };
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "saveAll");
    spyOn(entityMapper, "save");

    await service.executeImport(testEntities, testImportSettings);

    expect(entityMapper.saveAll).toHaveBeenCalledWith(testEntities);

    expect(entityMapper.save).toHaveBeenCalledWith(
      jasmine.objectContaining({
        ids: testEntities.map((e) => e.getId(true)),
        config: testImportSettings,
      }),
    );
  });

  it("should transform raw data to mapped entities", async () => {
    HealthCheck.schema.set("entityArray", {
      dataType: EntityArrayDatatype.dataType,
      additional: "Child",
    });
    const child = Child.create("Child Name");
    await TestBed.inject(EntityMapperService).save(child);
    const rawData: any[] = [
      { x: "John", y: "111" },
      { x: "Jane" },
      { x: "broken date", y: "foo" }, // date column; ("y") ignored
      { x: "with broken mapping column", brokenMapping: "foo" }, // column mapped to non-existing property ignored
      { x: "", onlyUnmappedColumn: "1" }, // only empty or unmapped columns => row skipped
      { x: "with zero", y: "0" }, // 0 value mapped
      { x: "custom mapping fn", z: "30.01.2023" },
      { x: "entity array", childName: child.name },
    ];
    const columnMapping: ColumnMapping[] = [
      { column: "x", propertyName: "child" },
      { column: "y", propertyName: "height" },
      { column: "z", propertyName: "date", additional: "DD.MM.YYYY" },
      { column: "brokenMapping", propertyName: "brokenMapping" },
      { column: "childName", propertyName: "entityArray", additional: "name" },
    ];

    const parsedEntities = await service.transformRawDataToEntities(
      rawData,
      HealthCheck.ENTITY_TYPE,
      columnMapping,
    );

    let expectedEntities: any[] = [
      { child: "John", height: 111 },
      { child: "Jane" },
      { child: "broken date" },
      { child: "with broken mapping column" },
      { child: "with zero", height: 0 },
      { child: "custom mapping fn", date: moment("2023-01-30").toDate() },
      { child: "entity array", entityArray: [child.getId()] },
    ];

    expectEntitiesToMatch(
      parsedEntities,
      expectedEntities.map((e) => Object.assign(new HealthCheck(), e)),
      true,
    );
  });

  it("should link imported data to other entities", async () => {
    const testEntities: Entity[] = [new Child("1"), new Child("2")];
    const activity = new RecurringActivity("3");
    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.save(activity);

    const testImportSettings: ImportSettings = {
      entityType: "Child",
      columnMapping: undefined,
      additionalActions: [
        { type: "RecurringActivity", id: "3" },
        { type: "School", id: "4" },
      ],
    };
    await service.executeImport(testEntities, testImportSettings);

    const createRelations = await entityMapper.loadType(ChildSchoolRelation);
    const expectedRelations = [
      { childId: "1", schoolId: "4" },
      { childId: "2", schoolId: "4" },
    ].map((e) => Object.assign(new ChildSchoolRelation(), e));
    expectEntitiesToMatch(createRelations, expectedRelations, true);

    expect(activity.participants).toEqual(["1", "2"]);
  });

  it("should allow to remove entities and links", async () => {
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
    const children = ["1", "2", "3"].map((id) => new Child(id));
    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.saveAll([
      ...children,
      ...relations,
      activity,
      importMeta,
    ]);

    await service.undoImport(importMeta);

    await expectEntitiesToBeInDatabase([children[2]], false, true);
    await expectEntitiesToBeInDatabase([relations[2]], false, true);
    expect(activity.participants).toEqual(["3"]);
    await expectAsync(
      entityMapper.load(ImportMetadata, importMeta.getId()),
    ).toBeRejected();
  });

  it("should not fail undo if some entities have already been removed", async () => {
    const importMeta = new ImportMetadata();
    importMeta.config = { entityType: "Child", columnMapping: undefined };
    importMeta.ids = ["Child:1", "Child:2"];
    const children = ["1", "2", "3"].map((id) => new Child(id));
    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.saveAll([...children, importMeta]);

    await entityMapper.remove(children[1]);

    await service.undoImport(importMeta);

    await expectEntitiesToBeInDatabase([children[2]], false, true);
  });
});
