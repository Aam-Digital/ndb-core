import { Note } from "./note";
import { WarningLevel, WarningLevelColor } from "../../warning-level";
import {
  createTestingEntitySchemaService,
  EntitySchemaService,
} from "../../../core/entity/schema/entity-schema.service";
import { waitForAsync } from "@angular/core/testing";
import { Entity } from "../../../core/entity/entity";
import {
  ATTENDANCE_STATUS_CONFIG_ID,
  AttendanceLogicalStatus,
  AttendanceStatusType,
} from "../../attendance/model/attendance-status";
import { ConfigurableEnumDatatype } from "../../../core/configurable-enum/configurable-enum-datatype/configurable-enum-datatype";
import {
  INTERACTION_TYPE_CONFIG_ID,
  InteractionType,
} from "./interaction-type.interface";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnumConfig,
} from "../../../core/configurable-enum/configurable-enum.interface";
import { createTestingConfigService } from "../../../core/config/config.service";

const testStatusTypes: ConfigurableEnumConfig<AttendanceStatusType> = [
  {
    id: "PRESENT",
    shortName: "P",
    label: "Present",
    style: "attendance-P",
    countAs: "PRESENT" as AttendanceLogicalStatus,
  },
  {
    id: "ABSENT",
    shortName: "A",
    label: "Absent",
    style: "attendance-A",
    countAs: "ABSENT" as AttendanceLogicalStatus,
  },
];

function createTestModel(): Note {
  const n1 = new Note("2");
  n1.children = ["1", "4", "7"];
  n1.getAttendance("1").status = testStatusTypes[0];
  n1.getAttendance("4").status = testStatusTypes[1];
  n1.getAttendance("4").remarks = "has fever";
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
      const testConfigs = {};
      testConfigs[
        CONFIGURABLE_ENUM_CONFIG_PREFIX + INTERACTION_TYPE_CONFIG_ID
      ] = testInteractionTypes;
      testConfigs[ATTENDANCE_STATUS_CONFIG_ID] = testStatusTypes;

      entitySchemaService = createTestingEntitySchemaService();
      entitySchemaService.registerSchemaDatatype(
        new ConfigurableEnumDatatype(createTestingConfigService(testConfigs))
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
      childrenAttendance: [],
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

  it("saves and loads attendance as configurable-enums", function () {
    const status = testStatusTypes.find((c) => c.id === "ABSENT");
    const entity = new Note();
    entity.addChild("1");
    entity.getAttendance("1").status = status;
    entity.getAttendance("1").remarks = "sick";

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);
    expect(rawData.childrenAttendance).toEqual([
      ["1", { status: status.id, remarks: "sick" }],
    ]);

    const reloadedEntity = new Note();
    entitySchemaService.loadDataIntoEntity(reloadedEntity, rawData);
    expect(reloadedEntity.getAttendance("1").status).toEqual(status);
  });

  it("performs a deep copy of itself", () => {
    const note = new Note("n1");
    note.addChild("4");
    note.addChild("5");
    note.addChild("6");
    note.author = "A";
    const otherNote = note.copy();
    expect(otherNote).toEqual(note);
    expect(otherNote).toBeInstanceOf(Note);
    otherNote.removeChild("5");
    expect(otherNote.children.length).toBe(note.children.length - 1);
  });
});
