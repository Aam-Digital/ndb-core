import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { GeoLocation, LocationDatatype } from "./location.datatype";
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
    const location: GeoLocation = {
      locationString: "test address 1b",
      geoLookup: {
        lat: 1,
        lon: 2,
        display_name: "1, test address",
      },
    };

    expect(service.transformToObjectFormat(location)).toEqual(location);
    expect(service.transformToObjectFormat(123 as any)).toBeUndefined();
  });

  it("should transform old (legacy) format to new format during loading", async () => {
    const oldLocationFormat: GeoResult = {
      lat: 1,
      lon: 2,
      display_name: "1, test address",
    };
    const newLocationFormat: GeoLocation = {
      locationString: "1, test address",
      geoLookup: {
        lat: 1,
        lon: 2,
        display_name: "1, test address",
      },
    };

    expect(service.transformToObjectFormat(oldLocationFormat as any)).toEqual(
      newLocationFormat,
    );
    expect(service.transformToObjectFormat(newLocationFormat)).toEqual(
      newLocationFormat,
    );
  });

  async function testImportMapping(
    importedValue: string,
    mockedLookup: GeoResult[],
    expectedResult: GeoLocation,
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

    await testImportMapping(importedAddress, [locationResult], {
      locationString: importedAddress,
      geoLookup: locationResult,
    });
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
      {
        locationString: importedAddress,
        geoLookup: locationResult,
      },
    );
  });

  it("should import string without lookup result when importing address that isn't found with lookup", async () => {
    const importedAddress = "21 MyStreet, MyCity";

    // TODO: when implementing #1844, extend this to import only custom address string without location object
    await testImportMapping(importedAddress, [], {
      locationString: importedAddress,
      geoLookup: undefined,
    });
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
