import { TestBed } from "@angular/core/testing";

import { GeoResult, GeoService } from "./geo.service";
import { AnalyticsService } from "../../core/analytics/analytics.service";
import { ConfigService } from "../../core/config/config.service";
import { of, Subject, throwError } from "rxjs";
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

type SearchResult = GeoResult & {
  address: {
    amenity?: string;
    office?: string;
    road?: string;
    house_number?: string;
    postcode?: number;
    city?: string;
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
    environment.email = "some@mail.com";
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
      postcode: 12345,
      city: "Berlin",
    });
    const formatted = service.reformatDisplayName(testResult);
    expect(formatted.display_name).toBe("Cafe, Main St 42, 12345 Berlin");
  });

  it("should format with office and city only", () => {
    const testResult = createSearchResult({
      office: "Company HQ",
      city: "Munich",
    });
    const formatted = service.reformatDisplayName(testResult);
    expect(formatted.display_name).toBe("Company HQ, Munich");
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
});
