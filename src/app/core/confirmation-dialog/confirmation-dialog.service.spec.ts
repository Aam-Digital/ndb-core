import { TestBed } from "@angular/core/testing";

import { ConfirmationDialogService } from "./confirmation-dialog.service";

describe("ConfirmationDialogService", () => {
  let service: ConfirmationDialogService;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmationDialogService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
