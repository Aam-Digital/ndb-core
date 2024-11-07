import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { GpsService } from "./gps.service";
import { GeoService } from "./geo.service";

function mockGeolocationPosition() {
  return {
    coords: {
      latitude: 51.5074,
      longitude: -0.1278,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  };
}

describe("GpsService", () => {
  let service: GpsService;
  let geoService: jasmine.SpyObj<GeoService>;

  beforeEach(() => {
    const geoServiceSpy = jasmine.createSpyObj("GeoService", ["lookup"]);

    TestBed.configureTestingModule({
      providers: [GpsService, { provide: GeoService, useValue: geoServiceSpy }],
    });
    service = TestBed.inject(GpsService);
    geoService = TestBed.inject(GeoService) as jasmine.SpyObj<GeoService>;
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should get GPS location coordinates", async () => {
    spyOn(navigator.permissions, "query").and.returnValue(
      Promise.resolve({ state: "granted" } as PermissionStatus),
    );
    spyOn(navigator.geolocation, "getCurrentPosition").and.callFake(
      (success) => {
        success(mockGeolocationPosition() as GeolocationPosition);
      },
    );

    const result = await service.getGpsLocationCoordinates();
    expect(result).toEqual({
      latitude: 51.5074,
      longitude: -0.1278,
      accuracy: 10,
    });
  });

  it("should get GPS location address", async () => {
    service.location = { lat: 51.5074, lon: -0.1278 };
    geoService.lookup.and.returnValue(
      of([{ lat: 51.5074, lon: -0.1278, display_name: "London, UK" }]),
    );

    const result = await service.getGpsLocationAddress();
    expect(result).toBe("London, UK");
  });

  it("should get GPS location address with default value", async () => {
    service.location = { lat: 51.5074, lon: -0.1278 };
    geoService.lookup.and.returnValue(of([]));

    const result = await service.getGpsLocationAddress();
    expect(result).toBe("Lat: 51.5074, Lon: -0.1278");
  });

  it("should reject when geolocation is not supported", async () => {
    spyOn(navigator.geolocation, "getCurrentPosition").and.callFake(
      (success) => {
        success(mockGeolocationPosition() as GeolocationPosition);
      },
    );

    try {
      await service.getGpsLocationCoordinates();
    } catch (error) {
      expect(error).toBe("Geolocation is not supported by this browser.");
    }
  });
});
