import { TestBed } from "@angular/core/testing";

import { FilterService } from "./filter.service";
import { defaultInteractionTypes } from "../config/default-config/default-interaction-types";
import { Note } from "../../child-dev-project/notes/model/note";
import { ConfigurableEnumService } from "../basic-datatypes/configurable-enum/configurable-enum.service";
import moment from "moment";
import { DataFilter, Filter } from "./filters/filters";
import { buildEnumValueFilter } from "./filters/configurableEnumFilter";
import { EntityFilter } from "./filters/entityFilter";
import { Entity } from "../entity/model/entity";
import { DatabaseEntity } from "../entity/database-entity.decorator";
import { DatabaseField } from "../entity/database-field.decorator";
import { matchColorConditionsInStoredFormat } from "./color-conditions.app-initializer";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { TestEntity } from "../../utils/test-utils/TestEntity";
import { CoreTestingModule } from "../../utils/core-testing.module";
import { DateWithAge } from "../basic-datatypes/date-with-age/dateWithAge";

describe("FilterService", () => {
  let service: FilterService;

  let mockEnumService: any;

  beforeEach(() => {
    mockEnumService = {
      getEnumValues: vi.fn(),
      preLoadEnums: vi.fn(),
    };
    mockEnumService.getEnumValues.mockReturnValue(defaultInteractionTypes);

    TestBed.configureTestingModule({
      imports: [CoreTestingModule],
      providers: [
        { provide: ConfigurableEnumService, useValue: mockEnumService },
      ],
    });
    service = TestBed.inject(FilterService);
  });

  it("should patch entities with values from filters", () => {
    const filter: DataFilter<Note> = {
      subject: "Test",
    };
    const note = new Note();

    service.alignEntityWithFilter(note, filter);

    expect(note.subject).toBe("Test");
  });

  it("should support patching with configurable enum filters", () => {
    const guardianTalk = defaultInteractionTypes.find(
      ({ id }) => id === "GUARDIAN_TALK",
    );
    const filter = {
      subject: "Test",
      "category.id": guardianTalk.id,
    } as DataFilter<Note>;
    const note = new Note();

    service.alignEntityWithFilter(note, filter);

    expect(note.subject).toBe("Test");
    expect(note.category).toEqual(guardianTalk);
  });

  it("should support patching with the filter of a ConfigurableEnumFilter option", () => {
    const guardianTalk = defaultInteractionTypes.find(
      ({ id }) => id === "GUARDIAN_TALK",
    );
    const filter = buildEnumValueFilter<Note>("category", guardianTalk.id);
    const note = new Note();

    service.alignEntityWithFilter(note, filter);

    // single select: the `$elemMatch` variant of the filter must not override the value
    expect(note.category).toEqual(guardianTalk);
  });

  it("should patch a multi-select configurable enum field with an array", () => {
    @DatabaseEntity("MultiEnumPatchTestEntity")
    class MultiEnumPatchTestEntity extends Entity {
      tags: any[];
    }
    MultiEnumPatchTestEntity.schema.set("tags", {
      dataType: "configurable-enum",
      additional: "TestEnum",
      isArray: true,
    });
    const guardianTalk = defaultInteractionTypes.find(
      ({ id }) => id === "GUARDIAN_TALK",
    );
    const entity = new MultiEnumPatchTestEntity();

    service.alignEntityWithFilter(
      entity,
      buildEnumValueFilter<MultiEnumPatchTestEntity>("tags", guardianTalk.id),
    );

    expect(entity.tags).toEqual([guardianTalk]);
  });

  it("should patch entity references with the filter of an EntityFilter option", () => {
    const child = new TestEntity();

    // multi-select reference
    const [relatedOption] = new EntityFilter<Note>(
      "relatedEntities",
      "Related Records",
      [child],
    ).options;
    const note = new Note();
    service.alignEntityWithFilter(note, relatedOption.filter);
    expect(note.relatedEntities).toEqual([child.getId()]);

    // single-select reference
    const [childIdOption] = new EntityFilter<ChildSchoolRelation>(
      "childId",
      "Child",
      [child],
    ).options;
    const relation = new ChildSchoolRelation();
    service.alignEntityWithFilter(relation, childIdOption.filter);
    expect(relation.childId).toBe(child.getId());
  });

  it.each(["date", "date-only"])(
    "patches a %s field with the day of the filter in local time",
    (dataType) => {
      @DatabaseEntity(`DatePatchTestEntity-${dataType}`)
      class DatePatchTestEntity extends Entity {}
      DatePatchTestEntity.schema.set("day", { dataType });
      const filter = { day: "2022-02-03" } as DataFilter<DatePatchTestEntity>;
      const predicate = service.getFilterPredicate(filter);
      const record = new DatePatchTestEntity();

      expect(predicate(record)).toBe(false);

      service.alignEntityWithFilter(record, filter);

      expect(record["day"]).toEqual(moment("2022-02-03").toDate());
      expect(predicate(record)).toBe(true);
    },
  );

  it("should support patching with array values", () => {
    const child = new TestEntity();
    // uses `relatedEntities` rather than the removed legacy `children` field
    const filter = {
      relatedEntities: { $elemMatch: { $eq: child.getId() } },
    } as DataFilter<Note>;
    const note = new Note();

    service.alignEntityWithFilter(note, filter);

    expect(note.relatedEntities).toEqual([child.getId()]);
  });

  it.each([
    [
      "an enum id given as plain value",
      { category: "GUARDIAN_TALK" },
      "category",
      defaultInteractionTypes.find(({ id }) => id === "GUARDIAN_TALK"),
    ],
    [
      "the only option of an $in list (as saved by the conditions editor)",
      { category: { $in: ["GUARDIAN_TALK"] } },
      "category",
      defaultInteractionTypes.find(({ id }) => id === "GUARDIAN_TALK"),
    ],
    [
      "the only option of an $elemMatch.$in list of a multi-value field",
      { relatedEntities: { $elemMatch: { $in: ["Child:1"] } } },
      "relatedEntities",
      ["Child:1"],
    ],
    [
      "nothing, if an $in list offers multiple options",
      { subject: { $in: ["A", "B"] } },
      "subject",
      undefined,
    ],
    [
      "nothing, for an empty value (of a 'not defined' condition)",
      { subject: { $eq: null } },
      "subject",
      undefined,
    ],
    ["nothing, for an empty text", { subject: "" }, "subject", undefined],
    [
      "nothing, for a list as value",
      { subject: ["A", "B"] },
      "subject",
      undefined,
    ],
  ])("patches %s", (_, filter, field, expected) => {
    const note = new Note();

    service.alignEntityWithFilter(note, filter as DataFilter<Note>);

    expect(note[field]).toEqual(expected);
  });

  it("should not set properties without a schema", () => {
    const filter = {
      childId: `${TestEntity.ENTITY_TYPE}:some-id`,
      someUnknownProperty: false,
    } as DataFilter<ChildSchoolRelation>;

    const relation = new ChildSchoolRelation();
    service.alignEntityWithFilter(relation, filter);

    expect(relation.childId).toEqual(`${TestEntity.ENTITY_TYPE}:some-id`);
    expect(relation["someUnknownProperty"]).toBeUndefined();
  });

  it("should support filtering dates with day granularity", () => {
    const n1 = Note.create(moment("2022-01-01").toDate());
    const n2 = Note.create(moment("2022-01-02").toDate());
    const n3 = Note.create(moment("2022-01-03").toDate());
    const n4 = Note.create(moment("2022-01-04").toDate());
    const n5 = Note.create(moment("2022-01-05").toDate());
    const notes = [n1, n2, n3, n4, n5];

    let predicate = service.getFilterPredicate({
      date: "2022-01-02",
    } as DataFilter<Note>);
    expect(notes.filter(predicate)).toEqual([n2]);

    predicate = service.getFilterPredicate({
      date: { $gte: "2022-01-02", $lt: "2022-01-04" },
    } as DataFilter<Note>);
    expect(notes.filter(predicate)).toEqual([n2, n3]);

    // e.g. the date of the edited record, as a resolved `$current_record` placeholder
    predicate = service.getFilterPredicate({
      date: moment("2022-01-02").toDate(),
    } as DataFilter<Note>);
    expect(notes.filter(predicate)).toEqual([n2]);
  });

  it("should skip filters without a selection when combining them", () => {
    const asFilter = (filter: DataFilter<Note>) =>
      ({ getFilter: () => filter }) as Filter<Note>;
    const selected = { subject: "Test" } as DataFilter<Note>;

    expect(
      service.combineFilters([asFilter({}), asFilter({})]),
      "nothing selected",
    ).toEqual({});
    expect(
      service.combineFilters([asFilter({}), asFilter(selected)]),
      "one of two selected",
    ).toEqual(selected);
  });

  it("offers no condition fields inside internal embedded fields, like the created and updated metadata", () => {
    expect(service.getConditionFields(TestEntity)).toEqual({
      options: [],
      excludedFields: [],
    });
  });

  describe("conditional colors", () => {
    afterEach(() => Entity.matchColorConditionsWith(undefined));

    it("match records in the stored format, like all other conditions", () => {
      // like an attendance entry, the entity keeps the status behind a getter, the stored entry has it as property
      class Entry {
        private readonly _status = "absent";
        get status() {
          return this._status;
        }
      }
      @DatabaseEntity("ColorConditionTest")
      class ColorConditionTest extends Entity {
        static override readonly color = [
          {
            condition: { log: { $elemMatch: { status: { $exists: true } } } },
            color: "red",
          },
        ];
        @DatabaseField({
          dataType: "schema-embed",
          isArray: true,
          additional: { status: { dataType: "string" } },
        })
        log: Entry[];
      }
      const record = new ColorConditionTest();
      record.log = [new Entry()];

      TestBed.runInInjectionContext(matchColorConditionsInStoredFormat);

      expect(record.getColor()).toBe("red");
    });
  });

  describe("matching records in the stored format", () => {
    function testRecord() {
      return TestEntity.create({
        category: { id: "M", label: "male" },
        dateOfBirth: new DateWithAge(moment().subtract(10, "years").toDate()),
      });
    }

    it.each([
      [{ category: "M" }, true],
      [{ "category.id": "M" }, true],
      [{ "dateOfBirth.age": { $gte: 9 } }, true],
      [{ isNew: true }, true],
      [{ other: { $exists: false } }, true],
      [{ category: { $exists: false } }, false],
    ])("matches %j like the database", (condition, expected) => {
      const matches = service.getFilterPredicate(condition);

      expect(matches(testRecord())).toBe(expected);
    });

    it("converts a saved record again once it has a new revision", () => {
      const record = testRecord();
      record._rev = "1-a";
      const matches = service.getFilterPredicate({ category: "F" });
      expect(matches(record)).toBe(false);

      record.category = { id: "F", label: "female" };
      record._rev = "2-b";

      expect(matches(record)).toBe(true);
    });
  });
});
