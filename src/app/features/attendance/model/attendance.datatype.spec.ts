import { AttendanceItem, EventAttendanceMap } from "./attendance-item";
import { defaultAttendanceStatusTypes } from "#src/app/core/config/default-config/default-attendance-status-types";
import { Entity } from "#src/app/core/entity/model/entity";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";

describe("Schema data type: attendance", () => {
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
      new AttendanceItem(defaultAttendanceStatusTypes[1], "", "a"),
    );
    originalEntity.attendanceMap.set(
      "b",
      new AttendanceItem(defaultAttendanceStatusTypes[0], "test remark", "b"),
    );

    const rawData =
      entitySchemaService.transformEntityToDatabaseFormat(originalEntity);

    const loadedEntity = new TestEntity("");
    entitySchemaService.loadDataIntoEntity(loadedEntity, rawData);

    expect(loadedEntity.attendanceMap).toEqual(originalEntity.attendanceMap);
  });

  it("serializes old entity format (without participantId) to array-of-objects", () => {
    const entity = new TestEntity("test1");
    entity.attendanceMap.set(
      "Child:child1",
      new AttendanceItem(defaultAttendanceStatusTypes[0], "on time"),
    );
    entity.attendanceMap.set(
      "Child:child2",
      new AttendanceItem(defaultAttendanceStatusTypes[1]),
    );

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData.attendanceMap).toEqual([
      { participantId: "Child:child1", status: "PRESENT", remarks: "on time" },
      { participantId: "Child:child2", status: "ABSENT", remarks: "" },
    ]);
  });

  it("serializes new entity format (with participantId) to array-of-objects", () => {
    const entity = new TestEntity("test1");
    entity.attendanceMap.set(
      "Child:child1",
      new AttendanceItem(
        defaultAttendanceStatusTypes[0],
        "on time",
        "Child:child1",
      ),
    );
    entity.attendanceMap.set(
      "Child:child2",
      new AttendanceItem(defaultAttendanceStatusTypes[1], "", "Child:child2"),
    );

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData.attendanceMap).toEqual([
      { participantId: "Child:child1", status: "PRESENT", remarks: "on time" },
      { participantId: "Child:child2", status: "ABSENT", remarks: "" },
    ]);
  });

  it("deserializes from old tuple format to new entity format", () => {
    const tupleData = {
      attendanceMap: [
        ["Child:child1", { status: "PRESENT", remarks: "on time" }],
        ["Child:child2", { status: "ABSENT", remarks: "" }],
      ],
    };

    const entity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(entity, tupleData);

    expect(entity.attendanceMap.size).toBe(2);
    expect(entity.attendanceMap.get("Child:child1").status.id).toBe("PRESENT");
    expect(entity.attendanceMap.get("Child:child1").remarks).toBe("on time");
    expect(entity.attendanceMap.get("Child:child1").participantId).toBe(
      "Child:child1",
    );
    expect(entity.attendanceMap.get("Child:child2").status.id).toBe("ABSENT");
    expect(entity.attendanceMap.get("Child:child2").remarks).toBe("");
    expect(entity.attendanceMap.get("Child:child2").participantId).toBe(
      "Child:child2",
    );
  });

  it("deserializes from new array-of-objects format to new entity format", () => {
    const objectData = {
      attendanceMap: [
        {
          participantId: "Child:child1",
          status: "PRESENT",
          remarks: "on time",
        },
        { participantId: "Child:child2", status: "ABSENT", remarks: "" },
      ],
    };

    const entity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(entity, objectData);

    expect(entity.attendanceMap.size).toBe(2);
    expect(entity.attendanceMap.get("Child:child1").status.id).toBe("PRESENT");
    expect(entity.attendanceMap.get("Child:child1").remarks).toBe("on time");
    expect(entity.attendanceMap.get("Child:child1").participantId).toBe(
      "Child:child1",
    );
    expect(entity.attendanceMap.get("Child:child2").status.id).toBe("ABSENT");
    expect(entity.attendanceMap.get("Child:child2").remarks).toBe("");
    expect(entity.attendanceMap.get("Child:child2").participantId).toBe(
      "Child:child2",
    );
  });

  it("deserializes array-of-objects format with mixed entity types", () => {
    const objectData = {
      attendanceMap: [
        { participantId: "Child:c1", status: "PRESENT", remarks: "" },
        { participantId: "User:u1", status: "LATE", remarks: "traffic" },
      ],
    };

    const entity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(entity, objectData);

    expect(entity.attendanceMap.size).toBe(2);
    expect(entity.attendanceMap.get("Child:c1").status.id).toBe("PRESENT");
    expect(entity.attendanceMap.get("Child:c1").participantId).toBe("Child:c1");
    expect(entity.attendanceMap.get("User:u1").status.id).toBe("LATE");
    expect(entity.attendanceMap.get("User:u1").remarks).toBe("traffic");
    expect(entity.attendanceMap.get("User:u1").participantId).toBe("User:u1");
  });

  it("deserializes empty array", () => {
    const entity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(entity, { attendanceMap: [] });

    expect(entity.attendanceMap.size).toBe(0);
    expect(entity.attendanceMap).toBeInstanceOf(EventAttendanceMap);
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
      new AttendanceItem(defaultAttendanceStatusTypes[1], "", "a"),
    );
    originalEntity.attendanceMap.set(
      "b",
      new AttendanceItem(defaultAttendanceStatusTypes[0], "test remark", "b"),
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
