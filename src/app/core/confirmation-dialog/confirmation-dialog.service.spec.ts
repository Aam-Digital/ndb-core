import { TestBed } from "@angular/core/testing";

import { ConfirmationDialogService } from "./confirmation-dialog.service";
import { MatDialogModule } from "@angular/material/dialog";

describe("ConfirmationDialogService", () => {
  let service: ConfirmationDialogService;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [MatDialogModule] });
    service = TestBed.inject(ConfirmationDialogService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
