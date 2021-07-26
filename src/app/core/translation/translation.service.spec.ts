import { TestBed } from "@angular/core/testing";

import { TranslationService } from "./translation.service";
import { TranslationModule } from "./translation.module";

describe("TranslationServiceService", () => {
  let service: TranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslationModule],
    });
    service = TestBed.inject(TranslationService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
