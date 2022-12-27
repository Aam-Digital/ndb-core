import { TestBed } from "@angular/core/testing";

import { ComingSoonDialogService } from "./coming-soon-dialog.service";
import { MatLegacyDialogModule as MatDialogModule } from "@angular/material/legacy-dialog";

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
