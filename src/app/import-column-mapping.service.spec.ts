import { TestBed } from "@angular/core/testing";

import { ImportColumnMappingService } from "./import-column-mapping.service";

describe("ImportColumnMappingService", () => {
  let service: ImportColumnMappingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportColumnMappingService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
