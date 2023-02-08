import { TestBed } from "@angular/core/testing";

import { FilterGeneratorService } from "./filter-generator.service";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import {
  BooleanFilterConfig,
  DateRangeFilterConfig,
  PrebuiltFilterConfig,
} from "./EntityListConfig";
import { School } from "../../../child-dev-project/schools/model/school";
import { Note } from "../../../child-dev-project/notes/model/note";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { Child } from "../../../child-dev-project/children/model/child";
import moment from "moment";
import { EntityConfigService } from "app/core/entity/entity-config.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { FilterService } from "../../filter/filter.service";
import { FilterSelectionOption } from "../../filter/filter-selection/filter-selection";
import { Entity } from "../../entity/model/entity";

describe("FilterGeneratorService", () => {
  let service: FilterGeneratorService;
  let filterService: FilterService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
    });
    service = TestBed.inject(FilterGeneratorService);
    filterService = TestBed.inject(FilterService);
    const entityConfigService = TestBed.inject(EntityConfigService);
    entityConfigService.addConfigAttributes(School);
    entityConfigService.addConfigAttributes(Child);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should create a boolean filter", async () => {
    const filterConfig: BooleanFilterConfig = {
      id: "privateSchool",
      true: "Private",
      false: "Government",
      all: "All",
    };
    const schema = School.schema.get("privateSchool");

    const filter = (await service.generate([filterConfig], School, []))[0];

    expect(filter.filterSettings.label).toEqual(schema.label);
    expect(filter.filterSettings.name).toEqual("privateSchool");
    expect(
      filter.filterSettings.options.map((option) => {
        return { key: option.key, label: option.label };
      })
    ).toEqual([
      { key: "all", label: "All" },
      { key: "true", label: "Private" },
      { key: "false", label: "Government" },
    ]);
  });

  it("should create a configurable enum filter", async () => {
    const interactionTypes = defaultInteractionTypes.map((it) => {
      return { key: it.id, label: it.label };
    });
    interactionTypes.push({ key: "all", label: "All" });
    const schema = Note.schema.get("category");

    const filter = (await service.generate([{ id: "category" }], Note, []))[0];

    expect(filter.filterSettings.label).toEqual(schema.label);
    expect(filter.filterSettings.name).toEqual("category");
    const comparableOptions = filter.filterSettings.options.map((option) => {
      return { key: option.key, label: option.label };
    });
    expect(comparableOptions).toEqual(
      jasmine.arrayWithExactContents(interactionTypes)
    );
  });

  it("should create a entity filter", async () => {
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
    )[0];

    expect(filterOptions.filterSettings.label).toEqual(schema.label);
    expect(filterOptions.filterSettings.name).toEqual("schoolId");
    const allRelations = [csr1, csr2, csr3, csr4];
    const allFilter = filterOptions.filterSettings.options.find(
      (opt) => opt.key === "all"
    );
    expect(allFilter.label).toEqual("All");
    expect(filter(allRelations, allFilter)).toEqual(allRelations);
    const school1Filter = filterOptions.filterSettings.options.find(
      (opt) => opt.key === school1.getId()
    );
    expect(school1Filter.label).toEqual(school1.name);
    expect(filter(allRelations, school1Filter)).toEqual([csr1, csr4]);
    const school2Filter = filterOptions.filterSettings.options.find(
      (opt) => opt.key === school2.getId()
    );
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
    )[0];

    expect(filter.filterSettings.label).toEqual(schema.label);
    expect(filter.filterSettings.name).toEqual("religion");
    const comparableOptions = filter.filterSettings.options.map((option) => {
      return { key: option.key, label: option.label };
    });
    expect(comparableOptions).toEqual(
      jasmine.arrayWithExactContents([
        { key: "", label: "All" },
        { key: "muslim", label: "muslim" },
        { key: "christian", label: "christian" },
      ])
    );
  });

  it("should use values from a prebuilt filter", async () => {
    const today = moment().format("YYYY-MM-DD");
    const prebuiltFilter = {
      id: "date",
      type: "prebuilt",
      label: "Date",
      default: "today",
      options: [
        { key: "", label: "All", filter: {} },
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
    )[0];

    expect(filterOptions.filterSettings.label).toEqual(prebuiltFilter.label);
    expect(filterOptions.filterSettings.name).toEqual(prebuiltFilter.id);
    expect(filterOptions.filterSettings.options).toEqual(
      prebuiltFilter.options
    );
    expect(filterOptions.selectedOption).toEqual(prebuiltFilter.default);

    const todayNote = new Note();
    todayNote.date = new Date();
    const yesterdayNote = new Note();
    const notes = [todayNote, yesterdayNote];
    yesterdayNote.date = moment().subtract(1, "day").toDate();
    const allFilter = filterOptions.filterSettings.options.find(
      (f) => f.key === ""
    );
    expect(filter(notes, allFilter)).toEqual(notes);
    const todayFilter = filterOptions.filterSettings.options.find(
      (f) => f.key === "today"
    );
    expect(filter(notes, todayFilter)).toEqual([todayNote]);
    const beforeFilter = filterOptions.filterSettings.options.find(
      (f) => f.key === "before"
    );
    expect(filter(notes, beforeFilter)).toEqual([yesterdayNote]);
  });

  it("should use the configuration values for the date filter", async () => {
    const dateFilter: DateRangeFilterConfig = {
      id: "date",
      label: "Date",
      options: [
        {
          startOffsets: [{ amount: 0, unit: "days" }],
          label: "Today",
        },
        {
          startOffsets: [{ amount: 2, unit: "days" }],
          label: "Since last two days",
        },
        {
          startOffsets: [{ amount: 3, unit: "weeks" }],
          label: "Since last three weeks",
        },
      ],
    };

    const generatedFilter = (await service.generate([dateFilter], Note, []))[0];

    expect(generatedFilter.filterSettings.label).toEqual(dateFilter.label);
    expect(generatedFilter.filterSettings.name).toEqual(dateFilter.id);

    const todayNote = new Note();
    todayNote.date = new Date();
    const yesterdayNote = new Note();
    const fourWeeksBackNote = new Note();
    const notes = [todayNote, yesterdayNote, fourWeeksBackNote];
    yesterdayNote.date = moment().subtract(1, "day").toDate();
    fourWeeksBackNote.date = moment().subtract(4, "week").toDate();

    const allFilter = generatedFilter.filterSettings.options.find(
      (f) => f.key === ""
    );
    expect(filter(notes, allFilter)).toEqual(notes);

    const todayFilter = generatedFilter.filterSettings.options.find(
      (f) => f.label === "Today"
    );
    expect(filter(notes, todayFilter)).toEqual([todayNote]);

    const yesterdayFilter = generatedFilter.filterSettings.options.find(
      (f) => f.label === "Since last two days"
    );
    expect(filter(notes, yesterdayFilter)).toEqual([todayNote, yesterdayNote]);

    const lastThreeWeeksFilter = generatedFilter.filterSettings.options.find(
      (f) => f.label === "Since last three weeks"
    );
    expect(filter(notes, lastThreeWeeksFilter)).toEqual([
      todayNote,
      yesterdayNote,
    ]);
  });

  function filter<T extends Entity>(
    data: T[],
    option: FilterSelectionOption<T>
  ): T[] {
    return data.filter(filterService.getFilterPredicate(option.filter));
  }
});
