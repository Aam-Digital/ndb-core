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
    country?: string;
  };
};

function createSearchResult(address: SearchResult["address"]): SearchResult {
  return {
    display_name: "",
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

  it("should be created", () => {
    expect(service).toBeTruthy();
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
    const testResult = createSearchResult({
      amenity: "Library",
      city: "Hamburg",
    });
    const formatted = service.reformatDisplayName(testResult);
    expect(formatted.display_name).toBe("Library, Hamburg");
  });

  it("should use village as fallback for city when city missing", () => {
    const testResult = createSearchResult({
      road: "Village Road",
      postcode: "99999",
      village: "Smallville",
    });
    const formatted = service.reformatDisplayName(testResult);
    expect(formatted.display_name).toBe("Village Road, 99999 Smallville");
    expect(formatted.address?.city).toBe("Smallville");
  });

  it("should normalize address parts on lookup results for PDF templating", async () => {
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
    expect(
      service.composeAddressFromParts({
        road: "Main St",
        house_number: "42",
        postcode: "12345",
        city: "Berlin",
        country: "Germany",
      }),
    ).toBe("Main St 42, 12345 Berlin, Germany");
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
