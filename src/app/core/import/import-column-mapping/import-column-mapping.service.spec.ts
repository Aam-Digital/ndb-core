import { TestBed } from "@angular/core/testing";

import { ImportColumnMappingService } from "./import-column-mapping.service";
import { ColumnMapping } from "../column-mapping";

fdescribe("ImportColumnMappingService", () => {
  let service: ImportColumnMappingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportColumnMappingService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should map all columns to 'name' automatically", () => {
    // setup
    const testMapping: ColumnMapping[] = [
      { column: "columnA" },
      { column: "columnB" },
    ];

    // run
    service.automaticallySelectMappings(testMapping);

    // check
    expect(testMapping).toEqual([
      { column: "columnA", propertyName: "name" },
      { column: "columnB", propertyName: "name" },
    ]);
  });
});
