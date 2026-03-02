import { Note } from "./note";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { TestBed, waitForAsync } from "@angular/core/testing";
import {
  AttendanceLogicalStatus,
  AttendanceStatusType,
  NullAttendanceStatusType,
} from "#src/app/features/attendance/model/attendance-status";
import { InteractionType } from "./interaction-type.interface";
import {
  getWarningLevelColor,
  WarningLevel,
  warningLevels,
} from "../../warning-level";
import { testEntitySubclass } from "../../../core/entity/model/entity.spec";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";
import { Ordering } from "../../../core/basic-datatypes/configurable-enum/configurable-enum-ordering";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ConfigurableEnumConfig } from "../../../core/basic-datatypes/configurable-enum/configurable-enum.types";
import {
  AttendanceItem,
  getOrCreateAttendance,
} from "#src/app/features/attendance/model/attendance-item";

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
  getOrCreateAttendance(n1.childrenAttendance, "1").status = testStatusTypes[0];
  getOrCreateAttendance(n1.childrenAttendance, "4").status = testStatusTypes[1];
  getOrCreateAttendance(n1.childrenAttendance, "4").remarks = "has fever";
  n1.date = new Date();
  n1.subject = "Note Subject";
  n1.text = "Note text";
  n1.authors = ["1"];
  n1.warningLevel = warningLevels.find((level) => level.id === "URGENT");

  return n1;
}

describe("Note", () => {
  let entitySchemaService: EntitySchemaService;

  const testInteractionTypes: InteractionType[] = Ordering.imposeTotalOrdering([
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
  ]);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
    });
    entitySchemaService = TestBed.inject(EntitySchemaService);
  }));

  testEntitySubclass(
    "Note",
    Note,
    {
      _id: "Note:some-id",

      children: ["1", "2", "5"],
      childrenAttendance: [],
      schools: [],
      relatedEntities: [],
      date: "2023-05-01",
      subject: "Note Subject",
      text: "Note text",
      authors: ["1"],
      category: defaultInteractionTypes[1].id,
      warningLevel: warningLevels[2].id,
    },
    true,
  );

  it("should return the correct childIds", function () {
    const n3 = createTestModel();
    expect(n3.children.sort()).toEqual(["1", "4", "7"].sort());
  });

  it("should return colors", function () {
    const note = new Note("1");

    note.category = { id: "", label: "test", color: "#FFFFFF", _ordinal: -1 };
    expect(note.getColor()).toBe("#FFFFFF");

    note.warningLevel = warningLevels.find((level) => level.id === "URGENT");
    expect(note.getColor()).toBe(getWarningLevelColor(WarningLevel.URGENT));
  });

  it("transforms interactionType from config", function () {
    const interactionTypeKey = "HOME_VISIT";
    const entity = new Note();
    entity.category = testInteractionTypes.find(
      (c) => c.id === interactionTypeKey,
    );

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData.category).toBe(interactionTypeKey);
  });

  it("saves and loads attendance as configurable-enums", function () {
    const status = testStatusTypes.find((c) => c.id === "ABSENT");
    const entity = new Note();
    entity.children = ["1"];
    entity.childrenAttendance = [new AttendanceItem(status, "sick", "1")];

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);
    expect(rawData.childrenAttendance).toEqual([
      ["1", { status: status.id, remarks: "sick" }],
    ]);

    const reloadedEntity = new Note();
    entitySchemaService.loadDataIntoEntity(reloadedEntity, rawData);
    expect(
      getOrCreateAttendance(reloadedEntity.childrenAttendance, "1").status,
    ).toEqual(status);
  });

  it("sets default NullAttendanceStatusType for attendance entries with missing value", function () {
    const status = testStatusTypes.find((c) => c.id === "ABSENT");
    const rawData = {
      children: ["1", "2", "3"],
      childrenAttendance: [
        ["1", { status: status.id, remarks: "" }],
        ["2", { status: "non-existing-id", remarks: "" }],
      ],
    };

    const reloadedEntity = new Note();
    entitySchemaService.loadDataIntoEntity(reloadedEntity, rawData);

    expect(
      getOrCreateAttendance(reloadedEntity.childrenAttendance, "2").status,
    ).toEqual({
      id: "non-existing-id",
      label: "[invalid option] non-existing-id",
      shortName: "?",
      countAs: AttendanceLogicalStatus.IGNORE,
      isInvalidOption: true,
    } as any);
    expect(
      getOrCreateAttendance(reloadedEntity.childrenAttendance, "3").status,
    ).toEqual(NullAttendanceStatusType);
    expect(
      getOrCreateAttendance(reloadedEntity.childrenAttendance, "1").status,
    ).toEqual(status);
  });

  it("performs a deep copy of itself", () => {
    const note = new Note("n1");
    note.children = ["4", "5", "6"];
    note.authors = ["A"];
    const otherNote = note.copy();
    expect(otherNote).toEqual(note);
    expect(otherNote).toBeInstanceOf(Note);
    otherNote.children = otherNote.children.filter((c) => c !== "5");
    expect(otherNote.children).toHaveSize(note.children.length - 1);
  });
});
