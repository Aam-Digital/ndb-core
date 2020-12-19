import { Note } from "./note";
import { WarningLevel, WarningLevelColor } from "../../warning-level";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { async } from "@angular/core/testing";
import { Entity } from "../../../core/entity/entity";
import { AttendanceStatus } from "../../attendance/model/attendance-status";

function createTestModel(): Note {
  const n1 = new Note("2");
  n1.children = ["1", "4", "7"];
  n1.getAttendance("1").status = AttendanceStatus.PRESENT;
  n1.getAttendance("4").status = AttendanceStatus.ABSENT;
  n1.getAttendance("4").remarks = "has fever";
  n1.date = new Date();
  n1.subject = "Note Subject";
  n1.text = "Note text";
  n1.author = "Max Musterman";
  n1.category = { name: "Discussion/Decision", color: "#E1BEE7" };
  n1.warningLevel = WarningLevel.URGENT;

  return n1;
}

describe("Note", () => {
  const ENTITY_TYPE = "Note";
  let entitySchemaService: EntitySchemaService;

  beforeEach(async(() => {
    entitySchemaService = new EntitySchemaService();
  }));

  it("has correct _id and entityId", function () {
    const id = "test1";
    const entity = new Note(id);

    expect(entity.getId()).toBe(id);
    expect(entity.getType()).toBe(ENTITY_TYPE);
    expect(Entity.extractEntityIdFromId(entity._id)).toBe(id);
  });

  it("has all and only defined schema fields in rawData", function () {
    const id = "1";
    const expectedData = {
      _id: ENTITY_TYPE + ":" + id,

      children: ["1", "2", "5"],
      childrenAttendance: [],
      date: new Date(),
      subject: "Note Subject",
      text: "Note text",
      author: "Max Musterman",
      category: "DISCUSSION",
      warningLevel: WarningLevel.URGENT,

      searchIndices: [],
    };

    const entity = new Note(id);
    Object.assign(entity, expectedData);

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData).toEqual(expectedData);
  });

  it("should return the correct childIds", function () {
    // sort since we don't care about the order
    const n3 = createTestModel();
    expect(n3.children.sort()).toEqual(["1", "4", "7"].sort());
  });

  it("should fully remove child including optional attendance details", function () {
    const n4 = createTestModel();
    const previousLength = n4.children.length;
    n4.removeChild("1");
    expect(n4.children.length).toBe(previousLength - 1);
    expect(n4.getAttendance("1")).toBeUndefined();
  });

  it("should increase in size after adding", function () {
    const n5 = createTestModel();
    const previousLength = n5.children.length;
    n5.addChild("2");
    expect(n5.children.length).toBe(previousLength + 1);
  });

  it("should not add same twice", function () {
    const n5 = createTestModel();
    const previousLength = n5.children.length;
    n5.addChild("2");
    n5.addChild("2");
    expect(n5.children.length).toBe(previousLength + 1);
  });

  it("should return colors", function () {
    const note = new Note("1");
    note.category = { name: "test", color: "#FFFFFF" };
    expect(note.getColor()).toBe("#FFFFFF");
    note.warningLevel = WarningLevel.URGENT;
    expect(note.getColor()).toBe(WarningLevelColor(WarningLevel.URGENT));
  });
});
