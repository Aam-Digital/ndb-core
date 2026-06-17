import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { GeoLocation, enrichGeoLocation } from "./geo-location";
import { OpenStreetMapsSearchResult, GeoService } from "./geo.service";
import { LocationDatatype } from "./location.datatype";
import { EntitySchemaField } from "../../core/entity/schema/entity-schema-field";

describe("Schema data type: location", () => {
  let service: LocationDatatype;
  let mockGeoService: any;

  beforeEach(() => {
    mockGeoService = {
      lookup: vi.fn(),
      enrichGeoLocation: vi.fn((loc: GeoLocation | undefined) =>
        enrichGeoLocation(loc),
      ),
    };

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
        address: {},
      } as OpenStreetMapsSearchResult,
    };

    expect(service.transformToObjectFormat(location)).toEqual(location);
    expect(service.transformToObjectFormat(123 as any)).toBeUndefined();
  });

  it("should transform old (legacy) format to new format during loading", async () => {
    const oldLocationFormat: OpenStreetMapsSearchResult = {
      lat: 1,
      lon: 2,
      display_name: "1, test address",
      address: {},
    } as OpenStreetMapsSearchResult;
    const newLocationFormat: GeoLocation = {
      locationString: "1, test address",
      geoLookup: {
        lat: 1,
        lon: 2,
        display_name: "1, test address",
        address: {},
      } as OpenStreetMapsSearchResult,
      road: undefined,
      house_number: undefined,
      postcode: undefined,
      city: undefined,
      country: undefined,
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
    mockedLookup: OpenStreetMapsSearchResult[],
    expectedResult: GeoLocation,
  ) {
    mockGeoService.lookup.mockReturnValue(of(mockedLookup));

    const actualResult = await service.importMapFunction(importedValue);

    expect(mockGeoService.lookup).toHaveBeenCalledWith(importedValue);
    expect(actualResult).toEqual(expectedResult);
  }

  it("should import lookup location data when importing address string", async () => {
    const importedAddress = "21 MyStreet, MyCity";
    const locationResult: OpenStreetMapsSearchResult = {
      lat: 1,
      lon: 2,
      display_name: importedAddress,
      address: {
        road: "MyStreet",
        house_number: "21",
        postcode: "12345",
        city: "MyCity",
        country: "Germany",
      },
    } as OpenStreetMapsSearchResult;

    await testImportMapping(importedAddress, [locationResult], {
      locationString: importedAddress,
      geoLookup: locationResult,
      road: "MyStreet",
      house_number: "21",
      postcode: "12345",
      city: "MyCity",
      country: "Germany",
    });
  });

  it("should import first lookup location when importing address string resulting in multiple results", async () => {
    const importedAddress = "21 MyStreet, MyCity";
    const locationResult: OpenStreetMapsSearchResult = {
      lat: 1,
      lon: 2,
      display_name: importedAddress,
      address: {
        road: "MyStreet",
        house_number: "21",
        postcode: "12345",
        city: "MyCity",
      },
    } as OpenStreetMapsSearchResult;

    await testImportMapping(
      importedAddress,
      [locationResult, { display_name: "other result", lat: 0, lon: 0 }],
      {
        locationString: importedAddress,
        geoLookup: locationResult,
        road: "MyStreet",
        house_number: "21",
        postcode: "12345",
        city: "MyCity",
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

  it("should fall back to text-only location when lookup throws (e.g. API throttling)", async () => {
    mockGeoService.lookup.mockReturnValue(
      throwError(() => new Error("502 rate limit")),
    );

    const result = await service.importMapFunction("some address");

    expect(result).toEqual({
      locationString: "some address",
      geoLookup: undefined,
    });
  });

  it("should skip geo lookup and only set locationString when skipAddressLookup is true", async () => {
    const importedAddress = "21 MyStreet, MyCity";

    const result = await service.importMapFunction(importedAddress, undefined, {
      skipAddressLookup: true,
    });

    expect(mockGeoService.lookup).not.toHaveBeenCalled();
    expect(result).toEqual({
      locationString: importedAddress,
      geoLookup: undefined,
    });
  });

  it("should handle special migration cases when transforming from database to object format", async () => {
    // catch special migrations:
    // WHEN value is `{ geoLookup: {  } }` (without locationString) then do not migrate value but do set locationString = value.geoLookup.display_name
    // WHEN value is `{ geoLookup { geoLookup: { ... } } }` (double geoLookup) then flatten to single geoLookup and set locationString = value.geoLookup.display_name

    const location1: GeoLocation = {
      geoLookup: {
        lat: 1,
        lon: 2,
        display_name: "1, test address",
        address: {},
      } as OpenStreetMapsSearchResult,
    };
    const expected1: GeoLocation = {
      locationString: "1, test address",
      geoLookup: {
        lat: 1,
        lon: 2,
        display_name: "1, test address",
        address: {},
      } as OpenStreetMapsSearchResult,
      road: undefined,
      house_number: undefined,
      postcode: undefined,
      city: undefined,
      country: undefined,
    };
    expect(service.transformToObjectFormat(location1)).toEqual(expected1);

    const location2: any = {
      geoLookup: {
        geoLookup: {
          lat: 1,
          lon: 2,
          display_name: "2, test address",
          address: {},
        },
      },
    };
    const expected2: GeoLocation = {
      locationString: "2, test address",
      geoLookup: {
        lat: 1,
        lon: 2,
        display_name: "2, test address",
        address: {},
      } as OpenStreetMapsSearchResult,
      road: undefined,
      house_number: undefined,
      postcode: undefined,
      city: undefined,
      country: undefined,
    };
    expect(service.transformToObjectFormat(location2)).toEqual(expected2);
  });

  it("should preserve top-level address parts when loading already enriched locations", () => {
    const location: GeoLocation = {
      locationString: "21 MyStreet, MyCity",
      geoLookup: {
        lat: 1,
        lon: 2,
        display_name: "21 MyStreet, MyCity",
        address: {
          road: "MyStreet",
          house_number: "21",
          postcode: "12345",
          city: "MyCity",
          country: "Germany",
        },
      } as OpenStreetMapsSearchResult,
      road: "MyStreet",
      house_number: "21",
      postcode: "12345",
      city: "MyCity",
      country: "Germany",
    };

    expect(service.transformToObjectFormat(location)).toEqual(location);
  });

  it("should not return any export columns when the field has no label", () => {
    expect(
      service.getExportColumns({ id: "address" } as EntitySchemaField),
    ).toEqual([]);
  });

  it("should export the display name plus separate columns for each address part", () => {
    const schemaField = {
      id: "address",
      label: "Address",
    } as EntitySchemaField;
    const columns = service.getExportColumns(schemaField);

    expect(columns.map((c) => c.keySuffix)).toEqual([
      "",
      "_street",
      "_house_number",
      "_postcode",
      "_city",
    ]);
    expect(columns[0].label).toBe("Address");
    expect(columns.slice(1).every((c) => c.label.startsWith("Address"))).toBe(
      true,
    );

    const value: GeoLocation = {
      locationString: "Impact Hub, Rollbergstraße 28A, 12053 Berlin",
      road: "Rollbergstraße",
      house_number: "28A",
      postcode: "12053",
      city: "Berlin",
    };

    expect(columns[0].resolveValue(value, schemaField)).toBe(value);
    expect(columns[1].resolveValue(value, schemaField)).toBe("Rollbergstraße");
    expect(columns[2].resolveValue(value, schemaField)).toBe("28A");
    expect(columns[3].resolveValue(value, schemaField)).toBe("12053");
    expect(columns[4].resolveValue(value, schemaField)).toBe("Berlin");
  });

  it("should export the address parts that transformToObjectFormat flattens from geoLookup", () => {
    const schemaField = {
      id: "address",
      label: "Address",
    } as EntitySchemaField;
    const columns = service.getExportColumns(schemaField);

    // raw value as stored before enrichment: only geoLookup.address is populated,
    // postcode is numeric and the city is a "village"
    const value = service.transformToObjectFormat({
      locationString: "Impact Hub, Rollbergstraße 28A, 12053 Berlin",
      geoLookup: {
        address: {
          road: "Rollbergstraße",
          house_number: "28A",
          postcode: 12053,
          village: "Berlin",
        },
      } as unknown as OpenStreetMapsSearchResult,
    });

    expect(columns[1].resolveValue(value, schemaField)).toBe("Rollbergstraße");
    expect(columns[2].resolveValue(value, schemaField)).toBe("28A");
    expect(columns[3].resolveValue(value, schemaField)).toBe("12053");
    expect(columns[4].resolveValue(value, schemaField)).toBe("Berlin");
  });

  it("should resolve missing address parts to undefined", () => {
    const schemaField = {
      id: "address",
      label: "Address",
    } as EntitySchemaField;
    const partColumns = service.getExportColumns(schemaField).slice(1);

    for (const column of partColumns) {
      expect(column.resolveValue(undefined, schemaField)).toBeUndefined();
      expect(
        column.resolveValue({ locationString: "x" }, schemaField),
      ).toBeUndefined();
    }
  });
});
