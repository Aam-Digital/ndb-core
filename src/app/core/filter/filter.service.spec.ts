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
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { TestEntity } from "../../utils/test-utils/TestEntity";

describe("FilterService", () => {
  let service: FilterService;

  let mockEnumService: any;

  beforeEach(() => {
    mockEnumService = {
      getEnumValues: vi.fn(),
    };
    mockEnumService.getEnumValues.mockReturnValue(defaultInteractionTypes);

    TestBed.configureTestingModule({
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
    const [childrenOption] = new EntityFilter<Note>("children", "Children", [
      child,
    ]).options;
    const note = new Note();
    service.alignEntityWithFilter(note, childrenOption.filter);
    expect(note.children).toEqual([child.getId()]);

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

  it("should support patching with date values", () => {
    const filter = { date: "2022-02-03" } as DataFilter<Note>;
    const predicate = service.getFilterPredicate(filter);
    const note = new Note();

    expect(predicate(note)).toBe(false);

    service.alignEntityWithFilter(note, filter);

    expect(note.date).toBeInstanceOf(Date);
    expect(predicate(note)).toBe(true);
  });

  it("should support patching with array values", () => {
    const child = new TestEntity();
    const filter = {
      children: { $elemMatch: { $eq: child.getId() } },
    } as DataFilter<Note>;
    const note = new Note();

    service.alignEntityWithFilter(note, filter);

    expect(note.children).toEqual([child.getId()]);
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
});
