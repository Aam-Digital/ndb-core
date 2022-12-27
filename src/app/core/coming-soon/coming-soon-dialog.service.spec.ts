import { TestBed } from "@angular/core/testing";

import { ComingSoonDialogService } from "./coming-soon-dialog.service";
import { MatDialogModule } from "@angular/material/dialog";

describe("ComingSoonDialogService", () => {
  let service: ComingSoonDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatDialogModule],
    });
    service = TestBed.inject(ComingSoonDialogService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
