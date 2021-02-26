import { MeetingNoteAttendance } from "../meeting-note-attendance";
import { Note } from "./note";
import { WarningLevel, WarningLevelColor } from "../../warning-level";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { waitForAsync } from "@angular/core/testing";
import { Entity } from "../../../core/entity/entity";
import { ConfigurableEnumDatatype } from "../../../core/configurable-enum/configurable-enum-datatype/configurable-enum-datatype";
import { InteractionType } from "./interaction-type.interface";

function createAttendanceModels(): Array<MeetingNoteAttendance> {
  const a1 = new MeetingNoteAttendance("1", true, "not empty");
  const a2 = new MeetingNoteAttendance("4", false, "remark one");
  const a3 = new MeetingNoteAttendance("7", true, "");

  return [a1, a2, a3];
}

function createTestModel(): Note {
  const n1 = new Note("2");
  n1.attendances = createAttendanceModels();
  n1.children = n1.attendances.map((a) => a.childId);
  n1.date = new Date();
  n1.subject = "Note Subject";
  n1.text = "Note text";
  n1.author = "Max Musterman";
  n1.warningLevel = WarningLevel.URGENT;

  return n1;
}

describe("Note", () => {
  const ENTITY_TYPE = "Note";
  let entitySchemaService: EntitySchemaService;

  const testInteractionTypes: InteractionType[] = [
    {
      id: "",
      label: "",
    },
    {
      id: "HOME_VISIT",
      label: "Home Visit",
    },
    {
      id: "GUARDIAN_TALK",
      label: "Talk with Guardians",
    },
  ];

  beforeEach(
    waitForAsync(() => {
      const mockConfigService = jasmine.createSpyObj("mockConfigService", [
        "getConfig",
      ]);
      mockConfigService.getConfig.and.returnValue(testInteractionTypes);

      entitySchemaService = new EntitySchemaService();
      entitySchemaService.registerSchemaDatatype(
        new ConfigurableEnumDatatype(mockConfigService)
      );
    })
  );

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
      attendances: [
        new MeetingNoteAttendance("1"),
        new MeetingNoteAttendance("2"),
        new MeetingNoteAttendance("5"),
      ],
      date: new Date(),
      subject: "Note Subject",
      text: "Note text",
      author: "Max Musterman",
      category: "GUARDIAN_TALK",
      warningLevel: WarningLevel.URGENT,

      searchIndices: [],
    };

    const entity = new Note(id);
    Object.assign(entity, expectedData);
    entity.category = testInteractionTypes.find(
      (c) => c.id === "GUARDIAN_TALK"
    );

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData).toEqual(expectedData);
  });

  it("should return the correct linked children", function () {
    const n1 = createTestModel();
    expect(n1.isLinkedWithChild("1")).toBe(true);
    expect(n1.isLinkedWithChild("2")).toBe(false);
  });

  it("should return the correct presence behaviour", function () {
    const n2 = createTestModel();
    expect(n2.childrenWithPresence(true).length).toBe(2);
    expect(n2.childrenWithPresence(false).length).toBe(1);

    expect(n2.isPresent("1")).toBe(true);
    expect(n2.isPresent("4")).toBe(false);
  });

  it("should return the correct childIds", function () {
    // sort since we don't care about the order
    const n3 = createTestModel();
    expect(n3.children.sort()).toEqual(["1", "4", "7"].sort());
  });

  it("should shrink in size after removing", function () {
    const n4 = createTestModel();
    const previousLength = n4.children.length;
    n4.removeChild("1");
    expect(n4.children.length).toBe(previousLength - 1);
    expect(n4.attendances.length).toBe(previousLength - 1);
  });

  it("should increase in size after adding", function () {
    const n5 = createTestModel();
    const previousLength = n5.children.length;
    n5.addChildren("2", "5");
    expect(n5.children.length).toBe(previousLength + 2);
    expect(n5.attendances.length).toBe(previousLength + 2);
  });

  it("should toggle presence", function () {
    const n6 = createTestModel();
    n6.togglePresence("1");
    expect(n6.attendances[0].present).toBe(false);
  });

  it("should return colors", function () {
    const note = new Note("1");
    note.category = { id: "", label: "test", color: "#FFFFFF" };
    expect(note.getColor()).toBe("#FFFFFF");
    note.warningLevel = WarningLevel.URGENT;
    expect(note.getColor()).toBe(WarningLevelColor(WarningLevel.URGENT));
  });

  it("transforms interactionType from config", function () {
    const interactionTypeKey = "HOME_VISIT";
    const entity = new Note();
    entity.category = testInteractionTypes.find(
      (c) => c.id === interactionTypeKey
    );

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData.category).toBe(interactionTypeKey);
  });
});
