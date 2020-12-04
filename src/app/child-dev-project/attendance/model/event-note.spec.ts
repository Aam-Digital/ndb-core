import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { async } from "@angular/core/testing";
import { Entity } from "../../../core/entity/entity";
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
    const id = "test1";
    const entity = new EventNote(id);

    expect(entity.getId()).toBe(id);
    expect(entity.getType()).toBe(ENTITY_TYPE);
    expect(Entity.extractEntityIdFromId(entity._id)).toBe(id);
  });

  it("has all and only defined schema fields in rawData", function () {
    const id = "1";
    const expectedData = {
      _id: ENTITY_TYPE + ":" + id,

      children: [
        new EventAttendance("1"),
        new EventAttendance("2"),
        new EventAttendance("5"),
      ],
      date: new Date(),
      activity: "Coaching",
      author: "Max Musterman",

      searchIndices: [],
    };

    const entity = new EventNote(id);
    Object.assign(entity, expectedData);

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
      author: "Max Musterman",
    };

    const entity = new EventNote("");
    entitySchemaService.loadDataIntoEntity(entity, data);

    expect(entity.date).toEqual(new Date(data.date));
    expect(entity.children[0]).toEqual(
      new EventAttendance("1", AttendanceStatus.UNKNOWN, "")
    );
    expect(entity.children[1]).toEqual(
      new EventAttendance("2", AttendanceStatus.ABSENT, "ill")
    );
    expect(entity.author).toEqual("Max Musterman");
    expect(entity.activity).toEqual("Coaching");
  });
});
