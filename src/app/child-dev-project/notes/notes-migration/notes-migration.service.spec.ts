import { TestBed } from "@angular/core/testing";

import { NotesMigrationService } from "./notes-migration.service";

describe("NotesMigrationService", () => {
  let service: NotesMigrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotesMigrationService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
