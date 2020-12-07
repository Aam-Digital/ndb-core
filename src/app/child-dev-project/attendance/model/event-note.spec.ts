import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { async } from "@angular/core/testing";
import { EventAttendance } from "./event-attendance";
import { AttendanceStatus } from "./attendance-status";
import { EventNote } from "./event-note";

describe("EventNote", () => {
  const ENTITY_TYPE = "EventNote";
  let entitySchemaService: EntitySchemaService;

  beforeEach(async(() => {
    entitySchemaService = new EntitySchemaService();
  }));

  it("has correct _id and entityId", function () {
    const entity = EventNote.create(new Date());

    expect(entity.getId()).toBeDefined();
    expect(entity.getType()).toBe(ENTITY_TYPE);
  });

  it("has all and only defined schema fields in rawData", function () {
    const expectedData = {
      _id: ENTITY_TYPE + ":",

      children: [
        new EventAttendance("1"),
        new EventAttendance("2"),
        new EventAttendance("5"),
      ],
      date: new Date(),
      activity: "Coaching",

      searchIndices: [],
    };

    const entity = EventNote.create(new Date());
    Object.assign(entity, expectedData);
    expectedData._id += entity.getId();

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData).toEqual(expectedData);
  });

  it("loads correctly from rawData", () => {
    const data = {
      date: "2018-01-13",
      children: [
        new EventAttendance("1"),
        new EventAttendance("2", AttendanceStatus.ABSENT, "ill"),
        new EventAttendance("5"),
      ],
      activity: "Coaching",
    };

    const entity = EventNote.create(new Date());
    entitySchemaService.loadDataIntoEntity(entity, data);

    expect(entity.date).toEqual(new Date(data.date));
    expect(entity.children[0]).toEqual(
      new EventAttendance("1", AttendanceStatus.UNKNOWN, "")
    );
    expect(entity.children[1]).toEqual(
      new EventAttendance("2", AttendanceStatus.ABSENT, "ill")
    );
    expect(entity.activity).toEqual("Coaching");
  });

  it("adds childIds with full event attendance defaults", () => {
    const testChildIds = ["1", "99"];

    const entity = EventNote.create(new Date());
    entity.addChildren(testChildIds);

    expect(entity.children).toEqual([
      new EventAttendance(testChildIds[0], AttendanceStatus.UNKNOWN, ""),
      new EventAttendance(testChildIds[1], AttendanceStatus.UNKNOWN, ""),
    ]);
  });
});
