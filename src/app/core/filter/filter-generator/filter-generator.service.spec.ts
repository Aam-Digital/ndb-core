import { TestBed } from "@angular/core/testing";
import { FilterGeneratorService } from "./filter-generator.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import {
  BooleanFilterConfig,
  PrebuiltFilterConfig,
} from "../../entity-list/EntityListConfig";
import { Note } from "../../../child-dev-project/notes/model/note";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import moment from "moment";
import { mockEntityMapperProvider } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { FilterService } from "../filter.service";
import {
  EMPTY_FILTER_OPTION_KEY,
  FilterSelectionOption,
  SelectableFilter,
} from "../filters/filters";
import { Entity } from "../../entity/model/entity";
import {
  DatabaseEntity,
  entityRegistry,
  EntityRegistry,
} from "../../entity/database-entity.decorator";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";
import { getDefaultEnumEntities } from "../../basic-datatypes/configurable-enum/configurable-enum-testing";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { entityAbilityFactory } from "../../permissions/ability/testing-entity-ability-factory";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { ConfigurableEnumDatatype } from "../../basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { BooleanDatatype } from "../../basic-datatypes/boolean/boolean.datatype";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { DateDatatype } from "../../basic-datatypes/date/date.datatype";
import { DateOnlyDatatype } from "../../basic-datatypes/date-only/date-only.datatype";
import { StringDatatype } from "../../basic-datatypes/string/string.datatype";
import { LongTextDatatype } from "../../basic-datatypes/string/long-text.datatype";
import { EmailDatatype } from "../../basic-datatypes/string/email.datatype";
import { UrlDatatype } from "../../basic-datatypes/string/url.datatype";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { DynamicPlaceholderValueService } from "../../default-values/x-dynamic-placeholder/dynamic-placeholder-value.service";
import { DateFilter } from "../filters/dateFilter";
import { StringFilter } from "../filters/stringFilter";
import { BooleanFilter } from "../filters/booleanFilter";
import { ConfigurableEnumFilter } from "../filters/configurableEnumFilter";
import { EntityFilter } from "../filters/entityFilter";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import {
  EntitySchemaField,
  PLACEHOLDERS,
} from "../../entity/schema/entity-schema-field";
import { CurrentUserSubject } from "app/core/session/current-user-subject";
import { expectArrayWithExactContents } from "../../../utils/test-utils/array-test-utils";
import { AttendanceItem } from "../../../features/attendance/model/attendance-item";
import { EventAttendanceMapDatatype } from "../../../features/attendance/deprecated/event-attendance-map.datatype";
import { SchemaEmbedDatatype } from "../../basic-datatypes/schema-embed/schema-embed.datatype";

describe("FilterGeneratorService", () => {
  let service: FilterGeneratorService;
  let filterService: FilterService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        FilterGeneratorService,
        FilterService,
        EntitySchemaService,
        DynamicPlaceholderValueService,
        ConfigurableEnumService,
        ...mockEntityMapperProvider(getDefaultEnumEntities()),
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: EntityAbility,
          useFactory: entityAbilityFactory,
          deps: [EntitySchemaService],
        },
        // only the datatypes of the entity schemas under test, rather than a whole module
        {
          provide: DefaultDatatype,
          useClass: ConfigurableEnumDatatype,
          multi: true,
        },
        { provide: DefaultDatatype, useClass: BooleanDatatype, multi: true },
        { provide: DefaultDatatype, useClass: EntityDatatype, multi: true },
        { provide: DefaultDatatype, useClass: DateDatatype, multi: true },
        { provide: DefaultDatatype, useClass: DateOnlyDatatype, multi: true },
        { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
        { provide: DefaultDatatype, useClass: LongTextDatatype, multi: true },
        { provide: DefaultDatatype, useClass: EmailDatatype, multi: true },
        { provide: DefaultDatatype, useClass: UrlDatatype, multi: true },
        {
          provide: DefaultDatatype,
          useClass: EventAttendanceMapDatatype,
          multi: true,
        },
        {
          provide: DefaultDatatype,
          useClass: SchemaEmbedDatatype,
          multi: true,
        },
        // EntityDatatype only uses this to offer entity actions, which filters don't
        { provide: EntityActionsService, useValue: {} },
      ],
    });
    service = TestBed.inject(FilterGeneratorService);
    filterService = TestBed.inject(FilterService);
    await TestBed.inject(ConfigurableEnumService).preLoadEnums();
  });

  it("should create a boolean filter", async () => {
    @DatabaseEntity("BooleanFilterTestEntity")
    class BooleanFilterTestEntity extends Entity {}
    BooleanFilterTestEntity.schema.set("test", {
      dataType: "boolean",
      label: "test Property",
    });

    const filterConfig: BooleanFilterConfig = {
      id: "test",
      true: "On",
      false: "Off",
      type: "boolean",
    };

    const filter = (
      await service.generate([filterConfig], BooleanFilterTestEntity, [])
    )[0] as BooleanFilter<Entity>;

    expect(filter.label).toEqual("test Property");
    expect(filter.name).toEqual("test");
    expect(
      filter.options.map((option) => {
        return { key: option.key, label: option.label };
      }),
    ).toEqual([
      { key: "true", label: "On" },
      { key: "false", label: "Off" },
    ]);
  });

  it("should create a configurable enum filter", async () => {
    const interactionTypes = defaultInteractionTypes.map((it) =>
      expect.objectContaining({ key: it.id, label: it.label }),
    );
    const schema = Note.schema.get("category");

    let filterOptions = (
      await service.generate([{ id: "category" }], Note, [])
    )[0] as ConfigurableEnumFilter<Note>;

    expect(filterOptions.label).toEqual(schema.label);
    expect(filterOptions.name).toEqual("category");
    let comparableOptions = filterOptions.options.map((option) => {
      return { key: option.key, label: option.label };
    });

    // Enum options + empty option
    expect(comparableOptions).toHaveLength(interactionTypes.length + 1);
    expect(comparableOptions).toEqual(expect.arrayContaining(interactionTypes));

    try {
      // enum name in additional field
      const schemaAdditional = {
        id: "otherEnum",
        dataType: schema.dataType,
        additional: schema.additional,
      };
      Note.schema.set("otherEnum", schemaAdditional);

      filterOptions = (
        await service.generate([{ id: "otherEnum" }], Note, [])
      )[0] as ConfigurableEnumFilter<Note>;

      comparableOptions = filterOptions.options.map((option) => {
        return { key: option.key, label: option.label };
      });
      expect(comparableOptions).toHaveLength(interactionTypes.length + 1);
      expect(comparableOptions).toEqual(
        expect.arrayContaining(interactionTypes),
      );

      // enum as array
      const schemaArray: FormFieldConfig = {
        id: "otherEnum",
        dataType: schema.dataType,
        isArray: true,
        additional: schema.additional,
      };
      Note.schema.set("otherEnum", schemaArray);

      filterOptions = (
        await service.generate([{ id: "otherEnum" }], Note, [])
      )[0] as ConfigurableEnumFilter<Note>;
      comparableOptions = filterOptions.options.map((option) => {
        return { key: option.key, label: option.label };
      });
      expect(comparableOptions).toHaveLength(interactionTypes.length + 1);
      expect(comparableOptions).toEqual(
        expect.arrayContaining(interactionTypes),
      );

      const note = new Note();
      note["otherEnum"] = [
        defaultInteractionTypes[1],
        defaultInteractionTypes[2],
      ];

      expect(filter([note], filterOptions.options[2])).toEqual([note]);
      expect(filter([note], filterOptions.options[3])).toEqual([note]);
      expect(filter([note], filterOptions.options[4])).toEqual([]);
    } finally {
      // restore even on a failed assertion, the schema is shared across spec files
      Note.schema.delete("otherEnum");
    }
  });

  it("should create an entity filter", async () => {
    const school1 = new TestEntity();
    school1.name = "First School";
    const school2 = new TestEntity();
    school2.name = "Second School";
    await TestBed.inject(EntityMapperService).saveAll([school1, school2]);
    const csr1 = new ChildSchoolRelation();
    csr1.schoolId = school1.getId();
    const csr2 = new ChildSchoolRelation();
    csr2.schoolId = school2.getId();
    const csr3 = new ChildSchoolRelation();
    csr3.schoolId = school2.getId();
    const csr4 = new ChildSchoolRelation();
    csr4.schoolId = school1.getId();
    const schema = ChildSchoolRelation.schema.get("schoolId");
    const originalSchemaAdditional = schema.additional;
    const originalSchemaLabel = schema.label;
    schema.additional = TestEntity.ENTITY_TYPE;
    // the model itself defines no label for this field, it usually comes from the app config
    schema.label = "School";

    try {
      const filterOptions = (
        await service.generate([{ id: "schoolId" }], ChildSchoolRelation, [])
      )[0] as EntityFilter<TestEntity>;

      expect(filterOptions.label).toEqual(schema.label);
      expect(filterOptions.name).toEqual("schoolId");
      const allRelations = [csr1, csr2, csr3, csr4];
      const school1Filter: FilterSelectionOption<Entity> =
        filterOptions.options.find((opt) => opt.key === school1.getId());
      expect(school1Filter.label).toEqual(school1.name);
      expect(filter(allRelations, school1Filter)).toEqual([csr1, csr4]);
      const school2Filter: FilterSelectionOption<Entity> =
        filterOptions.options.find((opt) => opt.key === school2.getId());
      expect(school2Filter.label).toEqual(school2.name);
      expect(filter(allRelations, school2Filter)).toEqual([csr2, csr3]);
    } finally {
      // restore even on a failed assertion, the schema is shared across spec files
      schema.additional = originalSchemaAdditional;
      schema.label = originalSchemaLabel;
    }
  });

  it("should create filters with all possible options on default", async () => {
    const fieldSchema = TestEntity.schema.get("rating");

    const child1 = new TestEntity();
    child1.rating = 1;
    const child2 = new TestEntity();
    child2.rating = 5;
    const child3 = new TestEntity();
    child3.rating = 1;

    const filter = (
      await service.generate([{ id: "rating" }], TestEntity, [
        child1,
        child2,
        child3,
      ])
    )[0] as SelectableFilter<TestEntity>;

    expect(filter.label).toEqual(fieldSchema.label);
    expect(filter.name).toEqual("rating");
    const comparableOptions = filter.options.map((option) => {
      return { key: option.key, label: option.label };
    });
    expectArrayWithExactContents(comparableOptions, [
      { key: "1", label: "1" },
      { key: "5", label: "5" },
      { key: EMPTY_FILTER_OPTION_KEY, label: "not defined" },
    ]);
  });

  it("should use values from a prebuilt filter", async () => {
    const today = moment().format("YYYY-MM-DD");
    const prebuiltFilter = {
      id: "someID",
      type: "prebuilt",
      label: "Date",
      default: "today",
      options: [
        {
          key: "today",
          label: "Today",
          filter: { date: today },
        },
        {
          key: "before",
          label: "Before today",
          filter: { date: { $lt: today } },
        },
      ],
    } as PrebuiltFilterConfig<Note>;

    const filterOptions = (
      await service.generate([prebuiltFilter], Note, [])
    )[0] as SelectableFilter<Note>;

    expect(filterOptions.label).toEqual(prebuiltFilter.label);
    expect(filterOptions.name).toEqual(prebuiltFilter.id);
    expect(filterOptions.options).toEqual(prebuiltFilter.options);
    expect(filterOptions.selectedOptionValues).toEqual([
      prebuiltFilter.default,
    ]);

    const todayNote = new Note();
    todayNote.date = new Date();
    const yesterdayNote = new Note();
    const notes = [todayNote, yesterdayNote];
    yesterdayNote.date = moment().subtract(1, "day").toDate();
    const todayFilter = filterOptions.options.find((f) => f.key === "today");
    expect(filter(notes, todayFilter)).toEqual([todayNote]);
    const beforeFilter = filterOptions.options.find((f) => f.key === "before");
    expect(filter(notes, beforeFilter)).toEqual([yesterdayNote]);
  });

  it("should create a date range filter", async () => {
    let generatedFilter = await service.generate([{ id: "date" }], Note, []);
    expect(generatedFilter[0]).toBeInstanceOf(DateFilter);
  });

  it("should create a string filter for 'string' fields with default text edit component", async () => {
    const fieldSchema = TestEntity.schema.get("other");

    const filter = (
      await service.generate([{ id: "other" }], TestEntity, [])
    )[0];

    expect(filter).toBeInstanceOf(StringFilter);
    expect(filter.name).toBe("other");
    expect(filter.label).toBe(fieldSchema.label);
  });

  it("should create a string filter for 'long-text' fields", async () => {
    const fieldSchema: EntitySchemaField = {
      dataType: "long-text",
      label: "Notes Field",
    };
    TestEntity.schema.set("longText", fieldSchema);

    const filter = (
      await service.generate([{ id: "longText" }], TestEntity, [])
    )[0];

    expect(filter).toBeInstanceOf(StringFilter);

    TestEntity.schema.delete("longText");
  });

  it("should create a string filter for fields with explicit EditText / EditLongText edit component", async () => {
    TestEntity.schema.set("customEditField", {
      dataType: "string",
      editComponent: "EditLongText",
      label: "Custom Edit Field",
    });

    const filter = (
      await service.generate([{ id: "customEditField" }], TestEntity, [])
    )[0];

    expect(filter).toBeInstanceOf(StringFilter);

    TestEntity.schema.delete("customEditField");
  });

  it("should not create a string filter for string fields with a special edit component", async () => {
    TestEntity.schema.set("specialString", {
      dataType: "string",
      editComponent: "EditAge",
      label: "Special String Field",
    });
    const entityWithValue = new TestEntity();
    entityWithValue["specialString"] = "some value";
    const otherEntityWithValue = new TestEntity();
    otherEntityWithValue["specialString"] = "other value";

    const filter = (
      await service.generate([{ id: "specialString" }], TestEntity, [
        entityWithValue,
        otherEntityWithValue,
      ])
    )[0];

    expect(filter).not.toBeInstanceOf(StringFilter);
    expect(filter).toBeInstanceOf(SelectableFilter);

    TestEntity.schema.delete("specialString");
  });

  it("should generate a working $regex filter query from a generated string filter", async () => {
    const fieldSchema: EntitySchemaField = {
      dataType: "string",
      label: "Free Text Field",
    };
    TestEntity.schema.set("freeText", fieldSchema);

    const e1 = new TestEntity();
    e1["freeText"] = "Hello World";
    const e2 = new TestEntity();
    e2["freeText"] = "Something else";

    const filter = (
      await service.generate([{ id: "freeText" }], TestEntity, [e1, e2])
    )[0] as StringFilter<TestEntity>;

    filter.selectedOptionValues = ["hello"];
    expect(filter.getFilter()).toEqual({
      freeText: { $regex: "hello", $options: "i" },
    });

    const predicate = filterService.getFilterPredicate(filter.getFilter());
    expect([e1, e2].filter(predicate)).toEqual([e1]);

    TestEntity.schema.delete("freeText");
  });

  it("should set current User if PLACEHOLDER is selected", async () => {
    let user = new Entity();
    TestBed.inject(CurrentUserSubject).next(user);
    const placeholderUserFilter = {
      id: "userID",
      type: "prebuilt",
      label: "Current User",
      default: PLACEHOLDERS.CURRENT_USER,
      options: [{}, {}],
    } as PrebuiltFilterConfig<Note>;
    const filterData = (
      await service.generate([placeholderUserFilter], Note, [])
    )[0] as SelectableFilter<Note>;
    expect(filterData.selectedOptionValues).toEqual([user.getId()]);
  });

  it("should filter entities with empty values using configurable enum filter", async () => {
    @DatabaseEntity("EnumFilterTestEntity")
    class EnumFilterTestEntity extends Entity {}
    EnumFilterTestEntity.schema.set("enumField", {
      dataType: "configurable-enum",
      additional: "TestEnum",
      label: "Enum Field",
    });

    vi.spyOn(
      TestBed.inject(FilterGeneratorService)["enumService"],
      "getEnumValues",
    ).mockReturnValue([
      { id: "A", label: "A" },
      { id: "B", label: "B" },
    ]);

    // Create entities with various "empty" values
    const e1 = new EnumFilterTestEntity(); // undefined
    const e2 = new EnumFilterTestEntity();
    e2["enumField"] = null;
    const e3 = new EnumFilterTestEntity();
    e3["enumField"] = "";
    const e4 = new EnumFilterTestEntity();
    e4["enumField"] = { id: undefined };
    const e5 = new EnumFilterTestEntity();
    e5["enumField"] = { id: null };
    const e6 = new EnumFilterTestEntity();
    e6["enumField"] = { id: "" };
    const e7 = new EnumFilterTestEntity();
    e7["enumField"] = { id: "A" }; // valid

    const data = [e1, e2, e3, e4, e5, e6, e7];

    const filter = (
      await service.generate([{ id: "enumField" }], EnumFilterTestEntity, data)
    )[0] as ConfigurableEnumFilter<Entity>;

    const emptyOption = filter.options.find(
      (opt) => opt.key === EMPTY_FILTER_OPTION_KEY,
    );
    expect(emptyOption).toBeTruthy();

    const filtered = filterService.getFilterPredicate(emptyOption.filter);
    expect(data.filter((item) => filtered(item))).toEqual([
      e1,
      e2,
      e3,
      e4,
      e5,
      e6,
    ]);
  });

  it("should add empty option for generic selectable filters", async () => {
    const e1 = new TestEntity();
    e1.rating = 3;
    const e2 = new TestEntity();
    e2.rating = "" as any;
    const e3 = new TestEntity();
    e3.rating = null as any;
    const e4 = new TestEntity();

    const data = [e1, e2, e3, e4];

    const filter = (
      await service.generate([{ id: "rating" }], TestEntity, data)
    )[0] as SelectableFilter<TestEntity>;

    const emptyOption = filter.options.find(
      (opt) => opt.key === EMPTY_FILTER_OPTION_KEY,
    );
    expect(emptyOption).toBeTruthy();

    const filtered = filterService.getFilterPredicate(emptyOption.filter);
    expect(data.filter((item) => filtered(item))).toEqual([e2, e3, e4]);
  });

  it("should add empty option for entity reference filters", async () => {
    const school = new TestEntity();
    school.name = "First School";
    await TestBed.inject(EntityMapperService).saveAll([school]);

    const relationWithSchool = new ChildSchoolRelation();
    relationWithSchool.schoolId = school.getId();
    const relationWithNull = new ChildSchoolRelation();
    relationWithNull["schoolId"] = null;
    const relationWithUndefined = new ChildSchoolRelation();

    const data = [relationWithSchool, relationWithNull, relationWithUndefined];

    const schema = ChildSchoolRelation.schema.get("schoolId");
    const originalSchemaAdditional = schema.additional;
    schema.additional = TestEntity.ENTITY_TYPE;

    try {
      const filter = (
        await service.generate([{ id: "schoolId" }], ChildSchoolRelation, data)
      )[0] as EntityFilter<ChildSchoolRelation>;

      const emptyOption = filter.options.find(
        (opt) => opt.key === EMPTY_FILTER_OPTION_KEY,
      );
      expect(emptyOption).toBeTruthy();

      const filtered = filterService.getFilterPredicate(emptyOption.filter);
      expect(data.filter((item) => filtered(item))).toEqual([
        relationWithNull,
        relationWithUndefined,
      ]);
    } finally {
      // restore even on a failed assertion, the schema is shared across spec files
      schema.additional = originalSchemaAdditional;
    }
  });

  it("should handle array values (multi-select fields) and show invalid options correctly", async () => {
    @DatabaseEntity("TagsFilterTestEntity")
    class TagsFilterTestEntity extends Entity {}
    TagsFilterTestEntity.schema.set("tags", {
      dataType: "configurable-enum",
      additional: "TestEnum",
      label: "Tags",
      isArray: true,
    });

    vi.spyOn(
      TestBed.inject(FilterGeneratorService)["enumService"],
      "getEnumValues",
    ).mockReturnValue([
      { id: "VALID_A", label: "Valid A" },
      { id: "VALID_B", label: "Valid B" },
    ]);

    // Create entities with array values containing invalid enum IDs
    const e1 = new TagsFilterTestEntity();
    e1["tags"] = [
      { id: "VALID_A", label: "Valid A" },
      { id: "INVALID_X", label: "Invalid X" },
    ];
    const e2 = new TagsFilterTestEntity();
    e2["tags"] = [{ id: "INVALID_Y", label: "Invalid Y" }];
    const e3 = new TagsFilterTestEntity();
    e3["tags"] = [];

    const data = [e1, e2, e3];

    const filter = (
      await service.generate([{ id: "tags" }], TagsFilterTestEntity, data)
    )[0] as ConfigurableEnumFilter<Entity>;

    // Main assertion: invalid options should show the actual ID, not [object Object]
    const invalidOptionX = filter.options.find(
      (opt) => opt.key === "invalid:INVALID_X",
    );
    expect(invalidOptionX).toBeTruthy();
    expect(invalidOptionX.label).toBe("[Invalid: INVALID_X]");

    const invalidOptionY = filter.options.find(
      (opt) => opt.key === "invalid:INVALID_Y",
    );
    expect(invalidOptionY).toBeTruthy();
    expect(invalidOptionY.label).toBe("[Invalid: INVALID_Y]");

    // Verify filtering by invalid option works correctly
    const filteredByInvalidX = filterService.getFilterPredicate(
      invalidOptionX.filter,
    );
    expect(data.filter((item) => filteredByInvalidX(item))).toEqual([e1]);

    const emptyOption = filter.options.find(
      (opt) => opt.key === EMPTY_FILTER_OPTION_KEY,
    );
    expect(emptyOption).toBeTruthy();

    const filteredByEmpty = filterService.getFilterPredicate(
      emptyOption.filter,
    );
    expect(data.filter((item) => filteredByEmpty(item))).toEqual([e3]);
  });

  describe("filters for properties nested in an embedded field (e.g. Note.childrenAttendance.participant)", () => {
    it("should create an entity filter for a reference nested in an embedded array field, matching if any entry has the selected value", async () => {
      const outerSchema = Note.schema.get("childrenAttendance");
      const participantSchema = outerSchema.additional.participant;
      const original = {
        outerLabel: outerSchema.label,
        participantLabel: participantSchema.label,
        participantAdditional: participantSchema.additional,
      };
      outerSchema.label = "Children attendance";
      participantSchema.label = "Participant";
      // simplify the test to not depend on the real "Child" entity type
      participantSchema.additional = TestEntity.ENTITY_TYPE;

      try {
        const child1 = new TestEntity();
        child1.name = "Child One";
        const child2 = new TestEntity();
        child2.name = "Child Two";
        await TestBed.inject(EntityMapperService).saveAll([child1, child2]);

        const note1 = new Note();
        note1.childrenAttendance = [
          new AttendanceItem(undefined, undefined, child1.getId()),
        ];
        const note2 = new Note();
        note2.childrenAttendance = [
          new AttendanceItem(undefined, undefined, child2.getId()),
          new AttendanceItem(undefined, undefined, child1.getId()),
        ];
        const note3 = new Note(); // no attendance entries at all
        const note4 = new Note();
        note4.childrenAttendance = [new AttendanceItem()]; // entry without a participant
        const allNotes = [note1, note2, note3, note4];

        const filterOptions = (
          await service.generate(
            [{ id: "childrenAttendance.participant" }],
            Note,
            allNotes,
          )
        )[0] as EntityFilter<TestEntity>;

        expect(filterOptions.label).toEqual(
          "Children attendance -> Participant",
        );
        expect(filterOptions.name).toEqual("childrenAttendance.participant");

        const child1Option = filterOptions.options.find(
          (opt) => opt.key === child1.getId(),
        );
        expect(child1Option.label).toEqual(child1.name);
        expect(filter(allNotes, child1Option)).toEqual([note1, note2]);

        const child2Option = filterOptions.options.find(
          (opt) => opt.key === child2.getId(),
        );
        expect(filter(allNotes, child2Option)).toEqual([note2]);

        const emptyOption = filterOptions.options.find(
          (opt) => opt.key === EMPTY_FILTER_OPTION_KEY,
        );
        // notes without any attendance entries, or with an entry lacking a participant
        expect(filter(allNotes, emptyOption)).toEqual([note3, note4]);
      } finally {
        // restore even on a failed assertion, the schema is shared across spec files
        outerSchema.label = original.outerLabel;
        participantSchema.label = original.participantLabel;
        participantSchema.additional = original.participantAdditional;
      }
    });

    it("should create a configurable-enum filter for a property nested in an embedded array field", async () => {
      @DatabaseEntity("EmbeddedEnumTestEntity")
      class EmbeddedEnumTestEntity extends Entity {}
      const enumAdditional = Note.schema.get("category").additional;
      EmbeddedEnumTestEntity.schema.set("logEntries", {
        dataType: "schema-embed",
        isArray: true,
        label: "Log Entries",
        additional: {
          type: {
            dataType: "configurable-enum",
            label: "Type",
            additional: enumAdditional,
          },
        },
      });

      const e1 = new EmbeddedEnumTestEntity();
      e1["logEntries"] = [{ type: defaultInteractionTypes[1] }];
      const e2 = new EmbeddedEnumTestEntity();
      e2["logEntries"] = [
        { type: defaultInteractionTypes[2] },
        { type: defaultInteractionTypes[1] },
      ];
      const e3 = new EmbeddedEnumTestEntity();
      e3["logEntries"] = [];
      const allEntities = [e1, e2, e3];

      const filterOptions = (
        await service.generate(
          [{ id: "logEntries.type" }],
          EmbeddedEnumTestEntity,
          allEntities,
        )
      )[0] as ConfigurableEnumFilter<EmbeddedEnumTestEntity>;

      expect(filterOptions.label).toEqual("Log Entries -> Type");

      const option1 = filterOptions.options.find(
        (opt) => opt.key === defaultInteractionTypes[1].id,
      );
      expect(filter(allEntities, option1)).toEqual([e1, e2]);

      const emptyOption = filterOptions.options.find(
        (opt) => opt.key === EMPTY_FILTER_OPTION_KEY,
      );
      expect(filter(allEntities, emptyOption)).toEqual([e3]);
    });

    it("should create a string filter for a property nested in a single (non-array) embedded object field, using a flat dot-path query", async () => {
      @DatabaseEntity("EmbeddedObjectTestEntity")
      class EmbeddedObjectTestEntity extends Entity {}
      EmbeddedObjectTestEntity.schema.set("contact", {
        dataType: "schema-embed",
        label: "Contact",
        additional: {
          phoneType: {
            dataType: "string",
            label: "Phone Type",
          },
        },
      });

      const e1 = new EmbeddedObjectTestEntity();
      e1["contact"] = { phoneType: "mobile" };
      const e2 = new EmbeddedObjectTestEntity();
      e2["contact"] = { phoneType: "landline" };
      const e3 = new EmbeddedObjectTestEntity(); // no contact at all
      const allEntities = [e1, e2, e3];

      const filterOptions = (
        await service.generate(
          [{ id: "contact.phoneType" }],
          EmbeddedObjectTestEntity,
          allEntities,
        )
      )[0] as StringFilter<EmbeddedObjectTestEntity>;

      expect(filterOptions).toBeInstanceOf(StringFilter);
      expect(filterOptions.label).toEqual("Contact -> Phone Type");

      filterOptions.selectedOptionValues = ["mobile"];
      expect(filterOptions.getFilter()).toEqual({
        "contact.phoneType": { $regex: "mobile", $options: "i" },
      });
      expect(
        filter(allEntities, {
          key: "x",
          label: "x",
          filter: filterOptions.getFilter(),
        }),
      ).toEqual([e1]);
    });
  });

  function filter<T extends Entity>(
    data: T[],
    option: FilterSelectionOption<T>,
  ): T[] {
    return data.filter(filterService.getFilterPredicate(option.filter));
  }
});
