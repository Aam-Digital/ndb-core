import { TestBed } from "@angular/core/testing";

import { TranslationService } from "./translation.service";
import { TranslationModule } from "./translation.module";
import { LOCALE_ID } from "@angular/core";

describe("TranslationServiceService", () => {
  let service: TranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslationModule],
      providers: [{ provide: LOCALE_ID, useValue: "en-US" }],
    });
    service = TestBed.inject(TranslationService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return the default locale if nothing is specified", () => {
    expect(service.currentLocale()).toBe("en-US");
  });

  it("should return the current region code", () => {
    expect(service.currentRegionCode()).toBe("us");
  });
});
