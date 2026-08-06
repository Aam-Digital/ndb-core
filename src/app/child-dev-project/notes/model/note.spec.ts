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
// qlty-ignore: radarlint-js:typescript:S1874 - Note still declares childrenAttendance with this deprecated datatype
import { EventAttendanceMapDatatype } from "../../../features/attendance/deprecated/event-attendance-map.datatype";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { EntityActionsService } from "../../../core/entity/entity-actions/entity-actions.service";
import {
  entityRegistry,
  EntityRegistry,
} from "../../../core/entity/database-entity.decorator";

function createTestModel(): Note {
  const n1 = new Note("2");
  n1.children = ["1", "4", "7"];
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
        {
          provide: DefaultDatatype,
          // qlty-ignore: radarlint-js:typescript:S1874 - Note still declares its childrenAttendance with this deprecated datatype
          useClass: EventAttendanceMapDatatype,
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
    // sort since we don't care about the order
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

  it("performs a deep copy of itself", () => {
    const note = new Note("n1");
    note.children = ["4", "5", "6"];
    note.authors = ["A"];
    const otherNote = note.copy();
    expect(otherNote).toEqual(note);
    expect(otherNote).toBeInstanceOf(Note);
    otherNote.children = otherNote.children.filter((c) => c !== "5");
    expect(otherNote.children).toHaveLength(note.children.length - 1);
  });
});
