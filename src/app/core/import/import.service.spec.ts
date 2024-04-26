import { TestBed } from "@angular/core/testing";

import { ImportService } from "./import.service";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Entity } from "../entity/model/entity";
import { ImportMetadata, ImportSettings } from "./import-metadata";
import { ColumnMapping } from "./column-mapping";
import {
  expectEntitiesToBeInDatabase,
  expectEntitiesToMatch,
} from "../../utils/expect-entity-data.spec";
import moment from "moment";
import { Child } from "../../child-dev-project/children/model/child";
import { RecurringActivity } from "../../child-dev-project/attendance/model/recurring-activity";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { mockEntityMapper } from "../entity/entity-mapper/mock-entity-mapper-service";
import { CoreTestingModule } from "../../utils/core-testing.module";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { DatabaseField } from "../entity/database-field.decorator";
import { EntityDatatype } from "../basic-datatypes/entity/entity.datatype";
import { ArrayDatatype } from "../basic-datatypes/array/array.datatype";

describe("ImportService", () => {
  let service: ImportService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        ImportService,
        { provide: EntityMapperService, useValue: mockEntityMapper() },
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
        ids: testEntities.map((e) => e.getId()),
        config: testImportSettings,
      }),
    );
  });

  it("should transform raw data to mapped entities", async () => {
    class ImportTestTarget extends Entity {
      @DatabaseField() name: string;
      @DatabaseField() counter: number;
      @DatabaseField() date: Date;
      @DatabaseField() text: string;
      @DatabaseField({
        dataType: ArrayDatatype.dataType,
        innerDataType: EntityDatatype.dataType,
        additional: "Child",
      })
      entityRefs: string[];
    }
    spyOn(TestBed.inject(EntityRegistry), "get").and.callFake(
      (entityType: string) =>
        entityType === "ImportTestTarget" ? ImportTestTarget : Child,
    );

    const child = Child.create("Child Name");
    await TestBed.inject(EntityMapperService).save(child);

    const rawData: any[] = [
      { rawName: "John", rawCounter: "111" },
      { rawName: "Jane" },
      { rawName: "broken date", rawCounter: "foo" }, // number column; ("rawCounter") ignored
      { rawName: "with broken mapping column", brokenMapping: "foo" }, // column mapped to non-existing property ignored
      { rawName: "", onlyUnmappedColumn: "1" }, // only empty or unmapped columns => row skipped
      { rawName: "with zero", rawCounter: "0" }, // 0 value mapped
      { rawName: "custom mapping fn", rawDate: "30.01.2023" },
      { rawName: "entity array", rawRefName: child.name },
      {
        rawName: "no null",
        rawCounter: null,
        rawText: null,
        rawDate: null,
      },
      {
        rawName: "no undefined",
        rawCounter: undefined,
        rawText: undefined,
        rawDate: undefined,
      },
    ];
    const columnMapping: ColumnMapping[] = [
      { column: "rawName", propertyName: "name" },
      { column: "rawCounter", propertyName: "counter" },
      { column: "rawDate", propertyName: "date", additional: "DD.MM.YYYY" },
      { column: "brokenMapping", propertyName: "brokenMapping" },
      { column: "rawRefName", propertyName: "entityRefs", additional: "name" },
      { column: "rawText", propertyName: "text" },
    ];

    const parsedEntities = await service.transformRawDataToEntities(
      rawData,
      "ImportTestTarget",
      columnMapping,
    );

    let expectedEntities: any[] = [
      { name: "John", counter: 111 },
      { name: "Jane" },
      { name: "broken date" },
      { name: "with broken mapping column" },
      { name: "with zero", counter: 0 },
      { name: "custom mapping fn", date: moment("2023-01-30").toDate() },
      { name: "entity array", entityRefs: [child.getId()] },
      { name: "no null" },
      { name: "no undefined" },
    ];

    expectEntitiesToMatch(
      parsedEntities,
      expectedEntities.map((e) => Object.assign(new ImportTestTarget(), e)),
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
