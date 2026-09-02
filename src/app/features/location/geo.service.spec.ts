import { TestBed } from "@angular/core/testing";

import { OpenStreetMapsSearchResult, GeoService } from "./geo.service";
import { AnalyticsService } from "../../core/analytics/analytics.service";
import { ConfigService } from "../../core/config/config.service";
import { firstValueFrom, of, Subject, throwError } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import type { Mock } from "vitest";

type AnalyticsServiceMock = {
  eventTrack: Mock;
};

type ConfigServiceMock = {
  getConfig: Mock;
  configUpdates: Subject<undefined>;
};

type HttpClientMock = {
  get: Mock;
};

type SearchResult = OpenStreetMapsSearchResult & {
  address: {
    amenity?: string;
    office?: string;
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    village?: string;
    suburb?: string;
    country?: string;
  };
};

function createSearchResult(
  address: SearchResult["address"],
  display_name = "",
): SearchResult {
  return {
    display_name,
    lat: 0,
    lon: 0,
    address,
  };
}

describe("GeoService", () => {
  let service: GeoService;
  let mockAnalytics: AnalyticsServiceMock;
  let mockConfigService: ConfigServiceMock;
  const configUpdates = new Subject<undefined>();
  let mockHttp: HttpClientMock;

  beforeEach(() => {
    environment.webmaster_email = "some@mail.com";
    mockHttp = {
      get: vi.fn(),
    };
    mockHttp.get.mockReturnValue(of(undefined));
    mockConfigService = {
      getConfig: vi.fn(),
      configUpdates,
    };
    mockAnalytics = {
      eventTrack: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpClient, useValue: mockHttp },
      ],
    });
    service = TestBed.inject(GeoService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setCountrycodes(countrycodes?: string) {
    mockConfigService.getConfig.mockReturnValue({ countrycodes });
    configUpdates.next(undefined);
  }

  it("should not send a country filter when none is configured", () => {
    service.lookup("someSearch").subscribe();

    const sentParams = mockHttp.get.mock.calls[0][1].params;
    expect("countrycodes" in sentParams).toBe(false);
  });

  it("should use countrycode from config and email from app config", () => {
    const countrycodes = "de,en";
    mockConfigService.getConfig.mockReturnValue({ countrycodes });
    configUpdates.next(undefined);

    service.lookup("someSearch").subscribe();
    expect(mockHttp.get).toHaveBeenCalledWith("/nominatim/search", {
      params: {
        q: "someSearch",
        format: "json",
        countrycodes,
        email: "some@mail.com",
        addressdetails: 1,
      },
    });
  });

  it("should omit the email param when no email is configured", () => {
    environment.webmaster_email = undefined;
    // defaultOptions is evaluated in the field initializer, so build a fresh
    // instance after clearing the configured email.
    const serviceWithoutEmail = TestBed.runInInjectionContext(
      () => new GeoService(),
    );

    serviceWithoutEmail.lookup("someSearch").subscribe();

    const sentParams = mockHttp.get.mock.calls[0][1].params;
    expect("email" in sentParams).toBe(false);
  });

  it("should track requests in analytics service", () => {
    const searchTerm = "mySearchTerm";
    service.lookup(searchTerm).subscribe();
    expect(mockAnalytics.eventTrack).toHaveBeenCalledWith("lookup_executed", {
      category: "Map",
      value: searchTerm.length,
    });

    const coordinates = { lat: 1, lon: 1 };
    service.reverseLookup(coordinates).subscribe();
    expect(mockAnalytics.eventTrack).toHaveBeenCalledWith(
      "reverse_lookup_executed",
      { category: "Map" },
    );
  });

  it("should format with amenity, street, postcode and city", () => {
    setCountrycodes("de");
    const testResult = createSearchResult({
      amenity: "Cafe",
      road: "Main St",
      house_number: "42",
      postcode: "12345",
      city: "Berlin",
    });
    const formatted = service.reformatDisplayName(testResult);
    expect(formatted.display_name).toBe("Cafe, Main St 42, 12345 Berlin");
    expect(formatted.address?.road).toBe("Main St");
    expect(formatted.address?.house_number).toBe("42");
    expect(formatted.address?.postcode).toBe("12345");
    expect(formatted.address?.city).toBe("Berlin");
  });

  it("should format with office and city only", () => {
    setCountrycodes("de");
    const testResult = createSearchResult({
      office: "Company HQ",
      city: "Munich",
    });
    const formatted = service.reformatDisplayName(testResult);
    expect(formatted.display_name).toBe("Company HQ, Munich");
    expect(formatted.address?.city).toBe("Munich");
  });

  it("should handle missing address gracefully", () => {
    const testResult = {
      display_name: "",
      lat: 0,
      lon: 0,
    } as unknown as SearchResult;
    const formatted = service.reformatDisplayName(testResult);
    expect(formatted.display_name).toBe("");
  });

  it("should not include 'undefined' in the result", () => {
    setCountrycodes("de");
    const testResult = createSearchResult({
      amenity: "Library",
      city: "Hamburg",
    });
    const formatted = service.reformatDisplayName(testResult);
    expect(formatted.display_name).toBe("Library, Hamburg");
  });

  it("should use village as fallback for city when city missing", () => {
    setCountrycodes("de");
    const testResult = createSearchResult({
      road: "Village Road",
      postcode: "99999",
      village: "Smallville",
    });
    const formatted = service.reformatDisplayName(testResult);
    expect(formatted.display_name).toBe("Village Road, 99999 Smallville");
    expect(formatted.address?.city).toBe("Smallville");
  });

  it("should format as house number, street, city, postcode and country by default", () => {
    const testResult = createSearchResult(
      {
        road: "Rosemount Buildings",
        house_number: "35",
        city: "City of Edinburgh",
        postcode: "EH3 8DD",
        country: "United Kingdom",
      },
      "Rosemount Buildings, Tollcross, City of Edinburgh, Scotland, EH3 8DD, United Kingdom",
    );

    const formatted = service.reformatDisplayName(testResult);

    expect(formatted.display_name).toBe(
      "35 Rosemount Buildings, City of Edinburgh EH3 8DD, United Kingdom",
    );
  });

  it("should use the most specific place name available as the city", () => {
    // an address in a Dublin suburb carries no city, town or village at all
    const testResult = createSearchResult(
      {
        road: "Broadford Avenue",
        house_number: "63",
        suburb: "Ballinteer",
        country: "Ireland",
      },
      "63, Broadford Avenue, Broadford, Ballinteer, County Dublin, Ireland",
    );

    const formatted = service.reformatDisplayName(testResult);

    expect(formatted.display_name).toBe(
      "63 Broadford Avenue, Ballinteer, Ireland",
    );
    expect(formatted.address?.city).toBe("Ballinteer");
  });

  it("should keep the OpenStreetMap display name if it holds none of our parts", () => {
    const testResult = createSearchResult({}, "Bayern, Deutschland");

    const formatted = service.reformatDisplayName(testResult);

    expect(formatted.display_name).toBe("Bayern, Deutschland");
  });

  it("should use the German format only if the filter is Germany alone", () => {
    const address = {
      road: "Main St",
      house_number: "42",
      postcode: "12345",
      city: "Berlin",
      country: "Germany",
    };

    setCountrycodes("de");
    expect(
      service.reformatDisplayName(createSearchResult(address, "raw name"))
        .display_name,
    ).toBe("Main St 42, 12345 Berlin");

    setCountrycodes("de,gb");
    expect(
      service.reformatDisplayName(createSearchResult(address, "raw name"))
        .display_name,
    ).toBe("42 Main St, Berlin 12345, Germany");
  });

  it("should normalize address parts on lookup results for PDF templating", async () => {
    setCountrycodes("de");
    const searchTerm = "Rollbergstraße Berlin";
    const results = [
      createSearchResult({
        road: "Rollbergstraße",
        house_number: "12",
        postcode: "12053",
        village: "Berlin",
        country: "Germany",
      }),
    ];
    mockHttp.get.mockReturnValue(of(results));

    const response = await firstValueFrom(service.lookup(searchTerm));

    expect(response).toHaveLength(1);
    expect(response[0].display_name).toBe("Rollbergstraße 12, 12053 Berlin");
    expect(response[0].address?.road).toBe("Rollbergstraße");
    expect(response[0].address?.house_number).toBe("12");
    expect(response[0].address?.postcode).toBe("12053");
    expect(response[0].address?.city).toBe("Berlin");
    expect(response[0].address?.country).toBe("Germany");
  });

  it("should not reuse cached results after the country filter changed", async () => {
    vi.useFakeTimers();
    const term = "Berlin";
    mockHttp.get.mockReturnValue(of([createSearchResult({ city: "Berlin" })]));

    service.lookup(term).subscribe();
    expect(mockHttp.get).toHaveBeenCalledTimes(1);

    setCountrycodes("de");
    service.lookup(term).subscribe();
    // the queue waits out the Nominatim cooldown before the next request
    await vi.advanceTimersByTimeAsync(1000);

    expect(mockHttp.get).toHaveBeenCalledTimes(2);
  });

  it("should not cache results of a lookup that started before the filter changed", async () => {
    vi.useFakeTimers();
    const term = "Berlin";
    const pendingResponse = new Subject<SearchResult[]>();
    mockHttp.get.mockReturnValue(pendingResponse);

    service.lookup(term).subscribe();
    // the filter changes while the request is still on its way
    setCountrycodes("de");
    pendingResponse.next([createSearchResult({ city: "Berlin" })]);
    pendingResponse.complete();

    service.lookup(term).subscribe();
    await vi.advanceTimersByTimeAsync(1000);

    expect(mockHttp.get).toHaveBeenCalledTimes(2);
  });

  it("should return cached result on repeated lookup without additional HTTP request", () => {
    const term = "Berlin";
    const results = [createSearchResult({ city: "Berlin" })];
    mockHttp.get.mockReturnValue(of(results));

    service.lookup(term).subscribe();
    expect(mockHttp.get).toHaveBeenCalledTimes(1);

    service.lookup(term).subscribe();
    expect(mockHttp.get).toHaveBeenCalledTimes(1);
  });

  it("should propagate HTTP errors to subscribers so callers can show error messages", () => {
    const err = new Error("502");
    mockHttp.get.mockReturnValue(throwError(() => err));

    let caughtError: unknown;
    service.lookup("someSearch").subscribe({ error: (e) => (caughtError = e) });

    expect(caughtError).toBe(err);
  });

  it("should compose an address string from structured parts", () => {
    const parts = {
      road: "Main St",
      house_number: "42",
      postcode: "12345",
      city: "Berlin",
      country: "Germany",
    };

    expect(service.composeAddressFromParts(parts)).toBe(
      "42 Main St, Berlin 12345, Germany",
    );

    setCountrycodes("de");
    expect(service.composeAddressFromParts(parts)).toBe(
      "Main St 42, 12345 Berlin",
    );
  });

  it("should compose the same format as a lookup's display_name, so the two can match", () => {
    const address = {
      road: "Main St",
      house_number: "42",
      postcode: "12345",
      city: "Berlin",
      country: "Germany",
    };

    const lookup = service.reformatDisplayName(createSearchResult(address));
    expect(service.composeAddressFromParts(lookup.address)).toBe(
      lookup.display_name,
    );

    setCountrycodes("de");
    const germanLookup = service.reformatDisplayName(
      createSearchResult(address),
    );
    expect(service.composeAddressFromParts(germanLookup.address)).toBe(
      germanLookup.display_name,
    );
  });

  it("should compose an address string when some parts are missing", () => {
    expect(
      service.composeAddressFromParts({
        road: "Main St",
        city: "Berlin",
      }),
    ).toBe("Main St, Berlin");
  });

  it("should return an empty string when composing from no parts", () => {
    expect(service.composeAddressFromParts({})).toBe("");
    expect(service.composeAddressFromParts(undefined)).toBe("");
  });
});
