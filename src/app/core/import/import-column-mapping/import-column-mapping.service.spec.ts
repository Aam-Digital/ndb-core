import { TestBed } from "@angular/core/testing";
import { ImportColumnMappingService } from "./import-column-mapping.service";
import { ColumnMapping } from "../column-mapping";
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

  //1st test case
  it("should map columns to their respective property names automatically", () => {
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

    service.automaticallySelectMappings(testMapping, entitySchema);

    expect(testMapping).toEqual([
      { column: "name", propertyName: "name" },
      { column: "phone", propertyName: "phone" },
      { column: "address", propertyName: "address" },
      { column: "some other remarks", propertyName: "some other remarks" },
    ]);
  });

  //2nd test case
  it("should map columns to their respective property names with different capitalization", () => {
    const testMapping: ColumnMapping[] = [
      { column: "Name" },
      { column: "Phone" },
      { column: "ADDRESS" },
      { column: "Some Other Remarks" },
    ];
    const entitySchema: EntitySchema = new Map([
      ["name", {}],
      ["phone", {}],
      ["address", {}],
      ["some other remarks", {}],
    ]);

    service.automaticallySelectMappings(testMapping, entitySchema);

    expect(testMapping).toEqual([
      { column: "Name", propertyName: "name" },
      { column: "Phone", propertyName: "phone" },
      { column: "ADDRESS", propertyName: "address" },
      { column: "Some Other Remarks", propertyName: "some other remarks" },
    ]);
  });

  //3rd test case
  it("should map columns also if they match the field label (instead of field id)", () => {
    const testMapping: ColumnMapping[] = [
      { column: "name" },
      { column: "phone number" },
      { column: "address" },
      { column: "some other remarks" },
    ];
    const entitySchema: EntitySchema = new Map([
      ["name", { label: "Full Name" }],
      ["phone", { label: "Phone Number" }],
      ["address", { label: "Address" }],
    ]);

    service.automaticallySelectMappings(testMapping, entitySchema);

    expect(testMapping).toEqual([
      { column: "name", propertyName: "name" },
      { column: "phone number", propertyName: "phone" },
      { column: "address", propertyName: "address" },
      { column: "some other remarks" },
    ]);
  });
});
