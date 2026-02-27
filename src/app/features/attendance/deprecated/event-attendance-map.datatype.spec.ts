import { AttendanceItem } from "../model/attendance-item";
import { defaultAttendanceStatusTypes } from "#src/app/core/config/default-config/default-attendance-status-types";
import { Entity } from "#src/app/core/entity/model/entity";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";

describe("Schema data type: event-attendance-map", () => {
  class TestEntity extends Entity {
    @DatabaseField({ dataType: "event-attendance-map" })
    attendance: AttendanceItem[] = [];
  }

  let entitySchemaService: EntitySchemaService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
    });
    entitySchemaService = TestBed.inject(EntitySchemaService);
  }));

  it("should convert to database format", () => {
    const entity = new TestEntity();
    entity.attendance = [
      new AttendanceItem(defaultAttendanceStatusTypes[0], "remark1", "a"),
      new AttendanceItem(defaultAttendanceStatusTypes[1], "remark2", "b"),
    ];

    const rawData =
      entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData.attendance).toEqual([
      ["a", { status: "PRESENT", remarks: "remark1", participant: "a" }],
      ["b", { status: "ABSENT", remarks: "remark2", participant: "b" }],
    ]);
  });

  it("should convert from database to entity format", () => {
    const data = {
      attendance: [
        ["a", { status: "PRESENT", remarks: "remark1" }],
        ["b", { status: "ABSENT", remarks: "remark2" }],
      ],
    };
    const loadedEntity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(loadedEntity, data);

    expect(loadedEntity.attendance).toEqual([
      new AttendanceItem(defaultAttendanceStatusTypes[0], "remark1", "a"),
      new AttendanceItem(defaultAttendanceStatusTypes[1], "remark2", "b"),
    ]);
  });

  it("reproduces exact same values after save and load", () => {
    const originalEntity = new TestEntity("test1");
    originalEntity.attendance = [
      new AttendanceItem(defaultAttendanceStatusTypes[1], "", "a"),
      new AttendanceItem(defaultAttendanceStatusTypes[0], "test remark", "b"),
    ];

    const rawData =
      entitySchemaService.transformEntityToDatabaseFormat(originalEntity);

    const loadedEntity = new TestEntity("");
    entitySchemaService.loadDataIntoEntity(loadedEntity, rawData);

    expect(loadedEntity.attendance).toEqual(originalEntity.attendance);
  });

  it("keeps value unchanged if it is not an array", () => {
    const entity = new TestEntity("test1");
    entity.attendance = "not an array" as any;

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData.attendance).toEqual("not an array");
  });

  it("reproduces the entries after multiple loads", () => {
    const originalEntity = new TestEntity("test1");
    originalEntity.attendance = [
      new AttendanceItem(defaultAttendanceStatusTypes[1], "", "a"),
      new AttendanceItem(defaultAttendanceStatusTypes[0], "test remark", "b"),
    ];

    const rawData =
      entitySchemaService.transformEntityToDatabaseFormat(originalEntity);

    const loadedEntity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(loadedEntity, rawData);

    expect(loadedEntity.attendance.length).toBe(
      originalEntity.attendance.length,
    );

    const loadedEntity2 = new TestEntity();
    entitySchemaService.loadDataIntoEntity(loadedEntity2, rawData);

    expect(loadedEntity2.attendance.length).toBe(
      originalEntity.attendance.length,
    );
    expect(loadedEntity2.attendance).toEqual(originalEntity.attendance);
  });
});
