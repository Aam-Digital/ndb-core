import { TestBed, waitForAsync } from "@angular/core/testing";

import { FilterGeneratorService } from "./filter-generator.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import {
  BooleanFilterConfig,
  PrebuiltFilterConfig,
} from "../../entity-list/EntityListConfig";
import { School } from "../../../child-dev-project/schools/model/school";
import { Note } from "../../../child-dev-project/notes/model/note";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { Child } from "../../../child-dev-project/children/model/child";
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
      id: "privateSchool",
      true: "Private",
      false: "Government",
      type: "boolean",
    };
    const schema = School.schema.get("privateSchool");

    const filter = (
      await service.generate([filterConfig], School, [])
    )[0] as BooleanFilter<School>;

    expect(filter.label).toEqual(schema.label);
    expect(filter.name).toEqual("privateSchool");
    expect(
      filter.options.map((option) => {
        return { key: option.key, label: option.label };
      }),
    ).toEqual([
      { key: "true", label: "Private" },
      { key: "false", label: "Government" },
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
    const school1 = new School();
    school1.name = "First School";
    const school2 = new School();
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

    const filterOptions = (
      await service.generate([{ id: "schoolId" }], ChildSchoolRelation, [])
    )[0] as EntityFilter<Child>;

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
  });

  it("should create filters with all possible options on default", async () => {
    const child1 = new Child();
    child1["religion"] = "muslim";
    const child2 = new Child();
    child2["religion"] = "christian";
    const child3 = new Child();
    child3["religion"] = "muslim";
    const schema = Child.schema.get("religion");

    const filter = (
      await service.generate([{ id: "religion" }], Child, [
        child1,
        child2,
        child3,
      ])
    )[0] as SelectableFilter<Child>;

    expect(filter.label).toEqual(schema.label);
    expect(filter.name).toEqual("religion");
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

  function filter<T extends Entity>(
    data: T[],
    option: FilterSelectionOption<T>,
  ): T[] {
    return data.filter(filterService.getFilterPredicate(option.filter));
  }
});
