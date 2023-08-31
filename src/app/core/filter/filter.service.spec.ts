import { TestBed } from "@angular/core/testing";

import { FilterService } from "./filter.service";
import { defaultInteractionTypes } from "../config/default-config/default-interaction-types";
import { DataFilter } from "../common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { Note } from "../../child-dev-project/notes/model/note";
import { ConfigurableEnumService } from "../basic-datatypes/configurable-enum/configurable-enum.service";
import { createTestingConfigurableEnumService } from "../basic-datatypes/configurable-enum/configurable-enum-testing";

describe("FilterService", () => {
  let service: FilterService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: ConfigurableEnumService,
          useValue: createTestingConfigurableEnumService(),
        },
      ],
    });
    service = TestBed.inject(FilterService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
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

  it("should support patching with date values", () => {
    const filter = { date: "2022-02-03" } as DataFilter<Note>;
    const predicate = service.getFilterPredicate(filter);
    const note = new Note();

    expect(predicate(note)).toBeFalse();

    service.alignEntityWithFilter(note, filter);

    expect(note.date).toBeInstanceOf(Date);
    expect(predicate(note)).toBeTrue();
  });

  it("should support filtering dates with day granularity", () => {
    const n1 = Note.create(new Date("2022-01-01"));
    const n2 = Note.create(new Date("2022-01-02"));
    const n3 = Note.create(new Date("2022-01-03"));
    const n4 = Note.create(new Date("2022-01-04"));
    const n5 = Note.create(new Date("2022-01-05"));
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
});
