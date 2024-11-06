import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { GpsService } from "./gps.service";
import { GeoService } from "./geo.service";

describe("GpsService", () => {
  let service: GpsService;
  let geoService: jasmine.SpyObj<GeoService>;

  beforeEach(() => {
    const geoServiceSpy = jasmine.createSpyObj("GeoService", ["lookup"]);

    TestBed.configureTestingModule({
      providers: [
        GpsService,
        { provide: GeoService, useValue: geoServiceSpy }
      ]
    });
    service = TestBed.inject(GpsService);
    geoService = TestBed.inject(GeoService) as jasmine.SpyObj<GeoService>;
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("getGpsLocationCoordinates", () => {
    it("should resolve with location coordinates if geolocation is available", async () => {
      spyOn(navigator.geolocation, "getCurrentPosition").and.callFake((successCallback) => successCallback({
        coords: {
          latitude: 51.5074,
          longitude: -0.1278,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({})
        },
        timestamp: Date.now(),
        toJSON: () => ({})
      }));
      const result = await service.getGpsLocationCoordinates();
      expect(result).toEqual({
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 10
      });
    });

    it("should reject if geolocation fails with an error", async () => {
      spyOn(navigator.geolocation, "getCurrentPosition").and.callFake((_, errorCallback) => {
        return errorCallback({
          message: "User denied geolocation",
          code: 0,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        });
      });

      await expectAsync(service.getGpsLocationCoordinates()).toBeRejectedWith("Geolocation error: User denied geolocation");
    });

    it("should reject if geolocation is not supported", async () => {
      spyOnProperty(navigator, "geolocation").and.returnValue(undefined);

      await expectAsync(service.getGpsLocationCoordinates()).toBeRejectedWith("Geolocation is not supported by this browser.");
    });
  });

  describe("getGpsLocationAddress", () => {
    it("should return the address from geoService lookup if location is available", async () => {
      service.location = { lat: 51.5074, lon: -0.1278 };
      geoService.lookup.and.returnValue(of([{ display_name: "London, UK", lat: 51.5074, lon: -0.1278 }]));

      const address = await service.getGpsLocationAddress();
      expect(address).toBe("London, UK");
      expect(geoService.lookup).toHaveBeenCalledWith("51.5074, -0.1278");
    });

    it("should return lat/lon if no results are found in geoService lookup", async () => {
      service.location = { lat: 51.5074, lon: -0.1278 };
      geoService.lookup.and.returnValue(of([]));

      const address = await service.getGpsLocationAddress();
      expect(address).toBe("Lat: 51.5074, Lon: -0.1278");
      expect(geoService.lookup).toHaveBeenCalledWith("51.5074, -0.1278");
    });

    it("should not call geoService lookup if location is null", async () => {
      service.location = null;
      const address = await service.getGpsLocationAddress();
      expect(geoService.lookup).not.toHaveBeenCalled();
      expect(address).toBeUndefined();
    });
  });

  describe("handleGpsLocationPosition", () => {
    it("should update location and return position data", () => {
      const position: GeolocationPosition = {
        coords: {
          latitude: 51.5074,
          longitude: -0.1278,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({})
        },
        timestamp: Date.now(),
        toJSON: () => ({})
      };

      const result = service.handleGpsLocationPosition(position);
      expect(service.location).toEqual({ lat: 51.5074, lon: -0.1278 });
      expect(result).toEqual({
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 10
      });
    });
  });
});
