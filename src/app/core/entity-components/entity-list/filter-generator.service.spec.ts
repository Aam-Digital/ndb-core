import { TestBed } from "@angular/core/testing";

import { FilterGeneratorService } from "./filter-generator.service";
import { ConfigService } from "../../config/config.service";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { LoggingService } from "../../logging/logging.service";
import { BooleanFilterConfig, PrebuiltFilterConfig } from "./EntityListConfig";
import { School } from "../../../child-dev-project/schools/model/school";
import { Note } from "../../../child-dev-project/notes/model/note";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { Child } from "../../../child-dev-project/children/model/child";
import moment from "moment";
import { InteractionType } from "../../../child-dev-project/notes/model/interaction-type.interface";

describe("FilterGeneratorService", () => {
  let service: FilterGeneratorService;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    mockConfigService = jasmine.createSpyObj(["getConfig"]);
    mockEntityMapper = jasmine.createSpyObj(["loadType"]);
    TestBed.configureTestingModule({
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
        LoggingService,
      ],
    });
    service = TestBed.inject(FilterGeneratorService);
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
      { key: "", label: "All" },
      { key: "true", label: "Private" },
      { key: "false", label: "Government" },
    ]);
  });

  it("should create a configurable enum filter", async () => {
    mockConfigService.getConfig.and.returnValue(defaultInteractionTypes);
    const interactionTypes = defaultInteractionTypes.map((it) => {
      return { key: it.id, label: it.label };
    });
    interactionTypes.push({ key: "", label: "All" });
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

  it("should only include values that are present in data", async () => {
    mockConfigService.getConfig.and.returnValue(defaultInteractionTypes);

    function createNoteWithCategory(interactionType: InteractionType) {
      const note = new Note();
      note.category = interactionType;
      return note;
    }

    const testData = [
      createNoteWithCategory(defaultInteractionTypes[1]),
      createNoteWithCategory(defaultInteractionTypes[3]),
    ];

    const generatedFilter = (
      await service.generate([{ id: "category" }], Note, testData, true)
    )[0];

    expect(generatedFilter.filterSettings.options.map((o) => o.key)).toEqual([
      "", // "All" option
      defaultInteractionTypes[1].id,
      defaultInteractionTypes[3].id,
    ]);
  });

  it("should create a entity filter", async () => {
    const school1 = new School();
    school1.name = "First School";
    const school2 = new School();
    school2.name = "Second School";
    mockEntityMapper.loadType.and.resolveTo([school1, school2]);
    const csr1 = new ChildSchoolRelation();
    csr1.schoolId = school1.getId();
    const csr2 = new ChildSchoolRelation();
    csr2.schoolId = school2.getId();
    const csr3 = new ChildSchoolRelation();
    csr3.schoolId = school2.getId();
    const csr4 = new ChildSchoolRelation();
    csr4.schoolId = school1.getId();
    const schema = ChildSchoolRelation.schema.get("schoolId");

    const filter = (
      await service.generate([{ id: "schoolId" }], ChildSchoolRelation, [])
    )[0];

    expect(filter.filterSettings.label).toEqual(schema.label);
    expect(filter.filterSettings.name).toEqual("schoolId");
    const allRelations = [csr1, csr2, csr3, csr4];
    const allFilter = filter.filterSettings.options.find(
      (opt) => opt.key === ""
    );
    expect(allFilter.label).toEqual("All");
    expect(allRelations.filter(allFilter.filterFun)).toEqual(allRelations);
    const school1Filter = filter.filterSettings.options.find(
      (opt) => opt.key === school1.getId()
    );
    expect(school1Filter.label).toEqual(school1.name);
    expect(allRelations.filter(school1Filter.filterFun)).toEqual([csr1, csr4]);
    const school2Filter = filter.filterSettings.options.find(
      (opt) => opt.key === school2.getId()
    );
    expect(school2Filter.label).toEqual(school2.name);
    expect(allRelations.filter(school2Filter.filterFun)).toEqual([csr2, csr3]);
  });

  it("should create filters with all possible options on default", async () => {
    const child1 = new Child();
    child1.religion = "muslim";
    const child2 = new Child();
    child2.religion = "christian";
    const child3 = new Child();
    child3.religion = "muslim";
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
    const prebuiltFilter: PrebuiltFilterConfig<Note> = {
      id: "date",
      type: "prebuilt",
      label: "Date",
      default: "today",
      options: [
        { key: "", label: "All", filterFun: () => true },
        {
          key: "today",
          label: "Today",
          filterFun: (note) => moment().isSame(note.date, "day"),
        },
        {
          key: "before",
          label: "Before today",
          filterFun: (note) => moment().isAfter(note.date, "day"),
        },
      ],
    };

    const filter = (await service.generate([prebuiltFilter], Note, []))[0];

    expect(filter.filterSettings.label).toEqual(prebuiltFilter.label);
    expect(filter.filterSettings.name).toEqual(prebuiltFilter.id);
    expect(filter.filterSettings.options).toEqual(prebuiltFilter.options);
    expect(filter.selectedOption).toEqual(prebuiltFilter.default);

    const todayNote = new Note();
    todayNote.date = new Date();
    const yesterdayNote = new Note();
    const notes = [todayNote, yesterdayNote];
    yesterdayNote.date = moment().subtract(1, "day").toDate();
    const allFilter = filter.filterSettings.options.find((f) => f.key === "");
    expect(notes.filter(allFilter.filterFun)).toEqual(notes);
    const todayFilter = filter.filterSettings.options.find(
      (f) => f.key === "today"
    );
    expect(notes.filter(todayFilter.filterFun)).toEqual([todayNote]);
    const beforeFilter = filter.filterSettings.options.find(
      (f) => f.key === "before"
    );
    expect(notes.filter(beforeFilter.filterFun)).toEqual([yesterdayNote]);
  });
});
