import { TestBed, waitForAsync } from "@angular/core/testing";
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
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { FilterService } from "../filter.service";
import {
  EMPTY_FILTER_OPTION_KEY,
  FilterSelectionOption,
  SelectableFilter,
} from "../filters/filters";
import { Entity } from "../../entity/model/entity";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { DateFilter } from "../filters/dateFilter";
import { StringFilter } from "../filters/stringFilter";
import { BooleanFilter } from "../filters/booleanFilter";
import { ConfigurableEnumFilter } from "../filters/configurableEnumFilter";
import { EntityFilter } from "../filters/entityFilter";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { PLACEHOLDERS } from "../../entity/schema/entity-schema-field";
import { CurrentUserSubject } from "app/core/session/current-user-subject";
import { expectArrayWithExactContents } from "../../../utils/test-utils/array-test-utils";

describe("FilterGeneratorService", () => {
  let service: FilterGeneratorService;
  let filterService: FilterService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
    });
    service = TestBed.inject(FilterGeneratorService);
    filterService = TestBed.inject(FilterService);
  }));

  it("should be created", () => {
    expect(service).toBeTruthy();
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
    expect(comparableOptions).toHaveLength(interactionTypes.length);
    expect(comparableOptions).toEqual(expect.arrayContaining(interactionTypes));

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
    expect(comparableOptions).toHaveLength(interactionTypes.length);
    expect(comparableOptions).toEqual(expect.arrayContaining(interactionTypes));

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
    expect(comparableOptions).toHaveLength(interactionTypes.length);
    expect(comparableOptions).toEqual(expect.arrayContaining(interactionTypes));

    const note = new Note();
    note["otherEnum"] = [
      defaultInteractionTypes[1],
      defaultInteractionTypes[2],
    ];

    expect(filter([note], filterOptions.options[1])).toEqual([note]);
    expect(filter([note], filterOptions.options[2])).toEqual([note]);
    expect(filter([note], filterOptions.options[3])).toEqual([]);

    Note.schema.delete("otherEnum");
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
    schema.additional = TestEntity.ENTITY_TYPE;

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

    schema.additional = originalSchemaAdditional;
  });

  it("should create filters with all possible options on default", async () => {
    const fieldSchema: EntitySchemaField = {
      dataType: "number",
      label: "Rating",
    };
    TestEntity.schema.set("rating", fieldSchema);

    const child1 = new TestEntity();
    child1["rating"] = 1;
    const child2 = new TestEntity();
    child2["rating"] = 5;
    const child3 = new TestEntity();
    child3["rating"] = 1;

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
    ]);

    TestEntity.schema.delete("rating");
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
    const fieldSchema: EntitySchemaField = {
      dataType: "string",
      label: "Free Text Field",
    };
    TestEntity.schema.set("freeText", fieldSchema);

    const filter = (
      await service.generate([{ id: "freeText" }], TestEntity, [])
    )[0];

    expect(filter).toBeInstanceOf(StringFilter);
    expect(filter.name).toBe("freeText");
    expect(filter.label).toBe(fieldSchema.label);

    TestEntity.schema.delete("freeText");
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
    const fieldSchema: EntitySchemaField = {
      dataType: "number",
      label: "Rating",
    };
    TestEntity.schema.set("rating", fieldSchema);

    const e1 = new TestEntity();
    e1["rating"] = 3;
    const e2 = new TestEntity();
    e2["rating"] = "" as any;
    const e3 = new TestEntity();
    e3["rating"] = null as any;
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

    TestEntity.schema.delete("rating");
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

    schema.additional = originalSchemaAdditional;
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

  function filter<T extends Entity>(
    data: T[],
    option: FilterSelectionOption<T>,
  ): T[] {
    return data.filter(filterService.getFilterPredicate(option.filter));
  }
});
