import { TestBed } from "@angular/core/testing";

import { FilterService } from "./filter.service";
import { defaultInteractionTypes } from "../config/default-config/default-interaction-types";
import { DataFilter } from "../entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { Note } from "../../child-dev-project/notes/model/note";
import {
  ConfigService,
  createTestingConfigService,
} from "../config/config.service";

describe("FilterService", () => {
  let service: FilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ConfigService, useValue: createTestingConfigService() },
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
      ({ id }) => id === "GUARDIAN_TALK"
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
});
