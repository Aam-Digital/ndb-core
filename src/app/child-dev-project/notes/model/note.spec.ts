import { Note } from "./note";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { InteractionType } from "./interaction-type.interface";
import {
  getWarningLevelColor,
  WarningLevel,
  warningLevels,
} from "../../warning-level";
import { testEntitySubclass } from "../../../core/entity/model/entity.test-utils";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";
import { Ordering } from "../../../core/basic-datatypes/configurable-enum/configurable-enum-ordering";
import { DefaultDatatype } from "../../../core/entity/default-datatype/default.datatype";
import { StringDatatype } from "../../../core/basic-datatypes/string/string.datatype";
import { LongTextDatatype } from "../../../core/basic-datatypes/string/long-text.datatype";
import { DateOnlyDatatype } from "../../../core/basic-datatypes/date-only/date-only.datatype";
import { EntityDatatype } from "../../../core/basic-datatypes/entity/entity.datatype";
import { ConfigurableEnumDatatype } from "../../../core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { ConfigurableEnumService } from "../../../core/basic-datatypes/configurable-enum/configurable-enum.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { EntityActionsService } from "../../../core/entity/entity-actions/entity-actions.service";
import {
  entityRegistry,
  EntityRegistry,
} from "../../../core/entity/database-entity.decorator";
import { AttendanceItem } from "../../../features/attendance/model/attendance-item";
import {
  AttendanceLogicalStatus,
  AttendanceStatusType,
} from "../../../features/attendance/model/attendance-status";
import {
  addLegacyNoteFieldsToSchema,
  removeLegacyNoteFieldsFromSchema,
} from "../deprecated/legacy-note-link-fields.testing";

function createTestModel(): Note {
  const n1 = new Note("2");
  n1.relatedEntities = ["1", "4", "7"];
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
      providers: [
        EntitySchemaService,
        // only the datatypes of Note's schema, rather than a whole module
        { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
        { provide: DefaultDatatype, useClass: LongTextDatatype, multi: true },
        { provide: DefaultDatatype, useClass: DateOnlyDatatype, multi: true },
        { provide: DefaultDatatype, useClass: EntityDatatype, multi: true },
        {
          provide: DefaultDatatype,
          useClass: ConfigurableEnumDatatype,
          multi: true,
        },
        // these datatypes only use the services below to resolve referenced records,
        // which the pure schema transformations under test never do
        {
          provide: ConfigurableEnumService,
          useValue: { getEnumValues: () => [] },
        },
        { provide: EntityMapperService, useValue: {} },
        { provide: EntityActionsService, useValue: {} },
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    });
    entitySchemaService = TestBed.inject(EntitySchemaService);
  }));

  testEntitySubclass(
    "Note",
    Note,
    {
      _id: "Note:some-id",

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

  it("should derive link fields and the property for an entity type from the schema", () => {
    Note.schema.set("linkedTestType", {
      dataType: "entity",
      isArray: true,
      additional: "TestType",
    });
    try {
      expect(Note.getLinkFields()).toContain("linkedTestType");
      expect(Note.getLinkFields()).toContain("relatedEntities");
      expect(Note.getLinkFields()).not.toContain("authors");
      expect(Note.getPropertyFor("TestType")).toBe("linkedTestType");
      expect(Note.getPropertyFor("User")).toBe("authors");
      expect(Note.getPropertyFor("Other")).toBe("relatedEntities");
    } finally {
      Note.schema.delete("linkedTestType");
    }
  });

  it("should store multiple entities of a type in a field specific to that type rather than a single-value field or relatedEntities", () => {
    const relatedEntities = Note.schema.get("relatedEntities");
    Note.schema.set("relatedEntities", {
      ...relatedEntities,
      additional: ["TestType", "Other"],
    });
    Note.schema.set("mainTestType", {
      dataType: "entity",
      additional: "TestType",
    });
    Note.schema.set("linkedTestType", {
      dataType: "entity",
      isArray: true,
      additional: "TestType",
    });
    try {
      expect(Note.getPropertyFor("TestType")).toBe("linkedTestType");
      expect(Note.getPropertyFor("Other")).toBe("relatedEntities");
    } finally {
      Note.schema.set("relatedEntities", relatedEntities);
      Note.schema.delete("mainTestType");
      Note.schema.delete("linkedTestType");
    }
  });

  it("should return colors", function () {
    const note = new Note("1");

    note.category = { id: "", label: "test", color: "#FFFFFF", _ordinal: -1 };
    expect(note.getColor()).toBe("#FFFFFF");

    note.warningLevel = warningLevels.find((level) => level.id === "URGENT");
    expect(note.getColor()).toBe(getWarningLevelColor(WarningLevel.URGENT));
  });

  describe("getColorForId", () => {
    const MEETING: InteractionType = {
      id: "M",
      label: "Meeting",
      color: "#FFFFFF",
      isMeeting: true,
    };
    const URGENT = getWarningLevelColor(WarningLevel.URGENT);
    const ABSENT: AttendanceStatusType = {
      id: "ABSENT",
      shortName: "A",
      label: "Absent",
      countAs: AttendanceLogicalStatus.ABSENT,
    };
    const PRESENT: AttendanceStatusType = {
      id: "PRESENT",
      shortName: "P",
      label: "Present",
      countAs: AttendanceLogicalStatus.PRESENT,
    };

    /** make the system's attendance field available, as it is only defined in config */
    function setUpAttendanceField(field: "attendance" | "childrenAttendance") {
      if (field === "attendance") {
        Note.schema.set("attendance", {
          dataType: "attendance",
          isArray: true,
        });
      } else {
        addLegacyNoteFieldsToSchema();
      }
    }

    afterEach(() => {
      removeLegacyNoteFieldsFromSchema();
      Note.schema.delete("attendance");
    });

    it.each([
      // the field is resolved from the schema, so both the modern and the legacy datatype work
      ["attendance", ABSENT, "Child:1", true, URGENT],
      ["childrenAttendance", ABSENT, "Child:1", true, URGENT],
      ["attendance", PRESENT, "Child:1", true, MEETING.color],
      // not a participant of this event
      ["attendance", ABSENT, "Child:2", true, MEETING.color],
      // attendance is only relevant for a meeting
      ["attendance", ABSENT, "Child:1", false, MEETING.color],
    ] as const)(
      "%s: marking %o for Child:1 colors a lookup of %s (isMeeting %s) as %s",
      (field, status, lookupId, isMeeting, expected) => {
        setUpAttendanceField(field);
        const note = new Note("n1");
        note.category = { ...MEETING, isMeeting };
        note[field] = [new AttendanceItem(status, "", "Child:1")];

        expect(note.getColorForId(lookupId)).toBe(expected);
      },
    );

    it("uses the normal color if the system has no attendance field at all", () => {
      const note = new Note("n1");
      note.category = MEETING;

      expect(note.getColorForId("Child:1")).toBe(MEETING.color);
    });
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

  it("performs a deep copy of itself", () => {
    const note = new Note("n1");
    note.relatedEntities = ["4", "5", "6"];
    note.authors = ["A"];
    const otherNote = note.copy();
    expect(otherNote).toEqual(note);
    expect(otherNote).toBeInstanceOf(Note);
    otherNote.relatedEntities = otherNote.relatedEntities.filter(
      (c) => c !== "5",
    );
    expect(otherNote.relatedEntities).toHaveLength(
      note.relatedEntities.length - 1,
    );
  });
});
