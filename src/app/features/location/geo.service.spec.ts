import { TestBed } from "@angular/core/testing";

import { GeoService } from "./geo.service";
import { AnalyticsService } from "../../core/analytics/analytics.service";
import { ConfigService } from "../../core/config/config.service";
import { of, Subject } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

describe("GeoService", () => {
  let service: GeoService;
  let mockAnalytics: jasmine.SpyObj<AnalyticsService>;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let configUpdates = new Subject();
  let mockHttp: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    environment.email = "some@mail.com";
    mockHttp = jasmine.createSpyObj(["get"]);
    mockHttp.get.and.returnValue(of(undefined));
    mockConfigService = jasmine.createSpyObj(["getConfig"], { configUpdates });
    mockAnalytics = jasmine.createSpyObj(["eventTrack"]);
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
    mockConfigService.getConfig.and.returnValue({ countrycodes });
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
    const testResult: any = {
      address: {
        amenity: "Cafe",
        road: "Main St",
        house_number: "42",
        postcode: "12345",
        city: "Berlin",
      },
    };
    const formatted = service.reformatDisplayName(testResult);
    expect(formatted.display_name).toBe("Cafe, Main St 42, 12345 Berlin");
  });

  it("should format with office and city only", () => {
    const testResult: any = {
      address: {
        office: "Company HQ",
        city: "Munich",
      },
    };
    const formatted = service.reformatDisplayName(testResult);
    expect(formatted.display_name).toBe("Company HQ, Munich");
  });

  it("should handle missing address gracefully", () => {
    const testResult: any = {};
    const formatted = service.reformatDisplayName(testResult);
    expect(formatted.display_name).toBeUndefined();
  });

  it("should not include 'undefined' in the result", () => {
    const testResult: any = {
      address: {
        amenity: "Library",
        road: undefined,
        city: "Hamburg",
      },
    };
    const formatted = service.reformatDisplayName(testResult);
    expect(formatted.display_name).toBe("Library, Hamburg");
  });
});
