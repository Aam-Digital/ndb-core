import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { LocationDatatype } from "./location.datatype";
import { GeoResult, GeoService } from "./geo.service";

describe("Schema data type: location", () => {
  let service: LocationDatatype;
  let mockGeoService: jasmine.SpyObj<GeoService>;

  beforeEach(() => {
    mockGeoService = jasmine.createSpyObj(["lookup"]);

    TestBed.configureTestingModule({
      providers: [
        { provide: GeoService, useValue: mockGeoService },
        LocationDatatype,
      ],
    });

    service = TestBed.inject(LocationDatatype);
  });

  it("should only return Geo objects when transforming from database to object format", async () => {
    const mockGeoResult: GeoResult = {
      lat: 1,
      lon: 2,
      display_name: "test address",
    };
    expect(service.transformToObjectFormat(mockGeoResult)).toEqual(
      mockGeoResult,
    );
    expect(service.transformToObjectFormat(123 as any)).toBeUndefined();
  });

  async function testImportMapping(
    importedValue: string,
    mockedLookup: GeoResult[],
    expectedResult,
  ) {
    mockGeoService.lookup.and.returnValue(of(mockedLookup));

    const actualResult = await service.importMapFunction(importedValue);

    expect(mockGeoService.lookup).toHaveBeenCalledWith(importedValue);
    expect(actualResult).toEqual(expectedResult);
  }

  it("should import lookup location data when importing address string", async () => {
    const importedAddress = "21 MyStreet, MyCity";
    const locationResult: GeoResult = {
      lat: 1,
      lon: 2,
      display_name: importedAddress,
    };

    await testImportMapping(importedAddress, [locationResult], locationResult);
  });

  it("should import first lookup location when importing address string resulting in multiple results", async () => {
    const importedAddress = "21 MyStreet, MyCity";
    const locationResult: GeoResult = {
      lat: 1,
      lon: 2,
      display_name: importedAddress,
    };

    await testImportMapping(
      importedAddress,
      [locationResult, { display_name: "other result", lat: 0, lon: 0 }],
      locationResult,
    );
  });

  it("should import nothing when importing address that isn't found with lookup", async () => {
    const importedAddress = "21 MyStreet, MyCity";

    // TODO: when implementing #1844, extend this to import only custom address string without location object
    await testImportMapping(importedAddress, [], undefined);
  });

  it("should not lookup empty address when importing", async () => {
    const res1 = await service.importMapFunction(undefined);
    expect(res1).toBeUndefined();
    expect(mockGeoService.lookup).not.toHaveBeenCalled();

    const res2 = await service.importMapFunction("");
    expect(res2).toBeUndefined();
    expect(mockGeoService.lookup).not.toHaveBeenCalled();
  });
});
