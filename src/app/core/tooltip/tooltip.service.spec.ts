import { TestBed } from "@angular/core/testing";

import { TooltipService } from "./tooltip.service";
import { TooltipModule } from "./tooltip.module";

describe("TooltipService", () => {
  let service: TooltipService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TooltipModule],
    });
    service = TestBed.inject(TooltipService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
