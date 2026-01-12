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
import { FilterSelectionOption, SelectableFilter } from "../filters/filters";
import { Entity } from "../../entity/model/entity";
import { DateFilter } from "../filters/dateFilter";
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
    const filterConfig: BooleanFilterConfig = {
      id: "test",
      true: "On",
      false: "Off",
      type: "boolean",
    };
    const fieldSchema: EntitySchemaField = {
      dataType: "boolean",
      label: "test Property",
    };
    TestEntity.schema.set("test", fieldSchema);

    const filter = (
      await service.generate([filterConfig], TestEntity, [])
    )[0] as BooleanFilter<TestEntity>;

    expect(filter.label).toEqual(fieldSchema.label);
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
      jasmine.objectContaining({ key: it.id, label: it.label }),
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
    expect(comparableOptions).toEqual(
      jasmine.arrayWithExactContents(interactionTypes),
    );

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
    expect(comparableOptions).toEqual(
      jasmine.arrayWithExactContents(interactionTypes),
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
    expect(comparableOptions).toEqual(
      jasmine.arrayWithExactContents(interactionTypes),
    );

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
    const child1 = new TestEntity();
    child1["other"] = "muslim";
    const child2 = new TestEntity();
    child2["other"] = "christian";
    const child3 = new TestEntity();
    child3["other"] = "muslim";
    const schema = TestEntity.schema.get("other");

    const filter = (
      await service.generate([{ id: "other" }], TestEntity, [
        child1,
        child2,
        child3,
      ])
    )[0] as SelectableFilter<TestEntity>;

    expect(filter.label).toEqual(schema.label);
    expect(filter.name).toEqual("other");
    const comparableOptions = filter.options.map((option) => {
      return { key: option.key, label: option.label };
    });
    expect(comparableOptions).toEqual(
      jasmine.arrayWithExactContents([
        { key: "muslim", label: "muslim" },
        { key: "christian", label: "christian" },
      ]),
    );
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
    const schema = {
      id: "enumField",
      dataType: "configurable-enum",
      additional: "TestEnum",
      label: "Enum Field",
    };
    TestEntity.schema.set("enumField", schema);

    spyOn(
      TestBed.inject(FilterGeneratorService)["enumService"],
      "getEnumValues",
    ).and.returnValue([
      { id: "A", label: "A" },
      { id: "B", label: "B" },
    ]);

    // Create entities with various "empty" values
    const e1 = new TestEntity(); // undefined
    const e2 = new TestEntity();
    e2["enumField"] = null;
    const e3 = new TestEntity();
    e3["enumField"] = "";
    const e4 = new TestEntity();
    e4["enumField"] = { id: undefined };
    const e5 = new TestEntity();
    e5["enumField"] = { id: null };
    const e6 = new TestEntity();
    e6["enumField"] = { id: "" };
    const e7 = new TestEntity();
    e7["enumField"] = { id: "A" }; // valid

    const data = [e1, e2, e3, e4, e5, e6, e7];

    const filter = (
      await service.generate([{ id: "enumField" }], TestEntity, data)
    )[0] as ConfigurableEnumFilter<TestEntity>;

    const emptyOption = filter.options.find((opt) => opt.key === null);
    expect(emptyOption).toBeTruthy();

    const filtered = filterService.getFilterPredicate(emptyOption.filter);
    expect(data.filter(filtered)).toEqual([e1, e2, e3, e4, e5, e6]);
  });

  it("should handle array values (multi-select fields) and show invalid options correctly", async () => {
    const schema = {
      id: "tags",
      dataType: "configurable-enum",
      additional: "TestEnum",
      label: "Tags",
      isArray: true,
    };
    TestEntity.schema.set("tags", schema);

    spyOn(
      TestBed.inject(FilterGeneratorService)["enumService"],
      "getEnumValues",
    ).and.returnValue([
      { id: "VALID_A", label: "Valid A" },
      { id: "VALID_B", label: "Valid B" },
    ]);

    // Create entities with array values containing invalid enum IDs
    const e1 = new TestEntity();
    e1["tags"] = [
      { id: "VALID_A", label: "Valid A" },
      { id: "INVALID_X", label: "Invalid X" },
    ];
    const e2 = new TestEntity();
    e2["tags"] = [{ id: "INVALID_Y", label: "Invalid Y" }];

    const data = [e1, e2];

    const filter = (
      await service.generate([{ id: "tags" }], TestEntity, data)
    )[0] as ConfigurableEnumFilter<TestEntity>;

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
    expect(data.filter(filteredByInvalidX)).toEqual([e1]);
  });

  function filter<T extends Entity>(
    data: T[],
    option: FilterSelectionOption<T>,
  ): T[] {
    return data.filter(filterService.getFilterPredicate(option.filter));
  }
});
