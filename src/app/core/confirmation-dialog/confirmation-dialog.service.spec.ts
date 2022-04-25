import { TestBed } from "@angular/core/testing";

import { ConfirmationDialogService } from "./confirmation-dialog.service";
import { ConfirmationDialogModule } from "./confirmation-dialog.module";

describe("ConfirmationDialogService", () => {
  let service: ConfirmationDialogService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConfirmationDialogModule],
    });
    service = TestBed.inject(ConfirmationDialogService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
