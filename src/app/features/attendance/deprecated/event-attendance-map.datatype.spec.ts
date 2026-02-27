import { AttendanceItem } from "../model/attendance-item";
import { EventAttendanceMap } from "./event-attendance-map.datatype";
import { defaultAttendanceStatusTypes } from "#src/app/core/config/default-config/default-attendance-status-types";
import { Entity } from "#src/app/core/entity/model/entity";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";

describe("Schema data type: event-attendance-map", () => {
  class TestEntity extends Entity {
    @DatabaseField() attendanceMap: EventAttendanceMap =
      new EventAttendanceMap();
  }

  let entitySchemaService: EntitySchemaService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
    });
    entitySchemaService = TestBed.inject(EntitySchemaService);
  }));

  it("reproduces exact same values after save and load", () => {
    const id = "test1";
    const originalEntity = new TestEntity(id);
    originalEntity.attendanceMap.set(
      "a",
      new AttendanceItem(defaultAttendanceStatusTypes[1]),
    );
    originalEntity.attendanceMap.set(
      "b",
      new AttendanceItem(defaultAttendanceStatusTypes[0], "test remark"),
    );

    const rawData =
      entitySchemaService.transformEntityToDatabaseFormat(originalEntity);

    const loadedEntity = new TestEntity("");
    entitySchemaService.loadDataIntoEntity(loadedEntity, rawData);

    expect(loadedEntity.attendanceMap).toEqual(originalEntity.attendanceMap);
  });

  it("keeps value unchanged if it is not a map", () => {
    const id = "test1";
    const entity = new TestEntity(id);
    entity.attendanceMap = "not a map" as any;

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData.attendanceMap).toEqual("not a map");
  });

  it("reproduces the entries after multiple loads", () => {
    const id = "test1";
    const originalEntity = new TestEntity(id);
    originalEntity.attendanceMap.set(
      "a",
      new AttendanceItem(defaultAttendanceStatusTypes[1]),
    );
    originalEntity.attendanceMap.set(
      "b",
      new AttendanceItem(defaultAttendanceStatusTypes[0], "test remark"),
    );

    const rawData =
      entitySchemaService.transformEntityToDatabaseFormat(originalEntity);

    const loadedEntity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(loadedEntity, rawData);

    expect(loadedEntity.attendanceMap.size).toBe(
      originalEntity.attendanceMap.size,
    );

    const loadedEntity2 = new TestEntity();
    entitySchemaService.loadDataIntoEntity(loadedEntity2, rawData);

    expect(loadedEntity2.attendanceMap.size).toBe(
      originalEntity.attendanceMap.size,
    );
    expect(loadedEntity2.attendanceMap).toEqual(originalEntity.attendanceMap);
  });
});
