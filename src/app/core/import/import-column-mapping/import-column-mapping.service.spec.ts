import { TestBed } from "@angular/core/testing";

import { ImportColumnMappingService } from "./import-column-mapping.service";
import { ColumnMapping } from "../column-mapping";
import { Child } from "app/child-dev-project/children/model/child";
import { School } from "app/child-dev-project/schools/model/school";
import { EntitySchema } from "app/core/entity/schema/entity-schema";

describe("ImportColumnMappingService", () => {
  let service: ImportColumnMappingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportColumnMappingService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should map columns to their respective property names automatically", () => {
    // setup
    const testMapping: ColumnMapping[] = [
      { column: "name" },
      { column: "phone" },
      { column: "address" },
      { column: "some other remarks" },
    ];
    const entitySchema: EntitySchema = new Map([
      ["name", {}],
      ["phone", {}],
      ["address", {}],
      ["some other remarks", {}],
    ]);

    // run
    service.automaticallySelectMappings(testMapping, entitySchema);

    // check
    expect(testMapping).toEqual([
      { column: "name", propertyName: "name" },
      { column: "phone", propertyName: "phone" },
      { column: "address", propertyName: "address" },
      { column: "some other remarks" },
    ]);
  });

  // TODO: test case for different capitalization, etc.
});

fdescribe("ImportColumnMappingService", () => {
  let service: ImportColumnMappingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportColumnMappingService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should map columns to their respective property names automatically", () => {
    // setup
    const testMapping: ColumnMapping[] = [
      { column: "name" },
      { column: "phone" },
      { column: "address" },
      { column: "some other remarks" },
    ];
    const entitySchema: EntitySchema = new Map([
      ["name", {}],
      ["phone", {}],
      ["address", {}],
      ["some other remarks", {}],
    ]);

    // run
    service.automaticallySelectMappings(testMapping, entitySchema);

    // check
    expect(testMapping).toEqual([
      { column: "name", propertyName: "NAME" },
      { column: "phone", propertyName: "PHONE NUMBER" },
      { column: "address", propertyName: "ADDRESS" },
      { column: "some other remarks", propertyName: "SOME OTHER REMARKS" },
    ]);
  });
});

describe("ImportColumnMappingService", () => {
  let service: ImportColumnMappingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportColumnMappingService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should map columns to their respective property names automatically", () => {
    // setup
    const testMapping: ColumnMapping[] = [
      { column: "name" },
      { column: "phone" },
      { column: "address" },
      { column: "some other remarks" },
    ];
    const entitySchema: EntitySchema = new Map([
      ["name", {}],
      ["phone", {}],
      ["address", {}],
      ["some other remarks", {}],
    ]);

    // run
    service.automaticallySelectMappings(testMapping, entitySchema);

    // check
    expect(testMapping).toEqual([
      { column: "name", propertyName: "name" },
      { column: "phone", propertyName: "phone" },
      { column: "address", propertyName: "address" },
      { column: "some other remarks", propertyName: "some other remarks" },
    ]);
  });
});
