import { TestBed } from "@angular/core/testing";
import { GpsService } from "./gps.service";

function mockGeolocationPosition() {
  return {
    coords: {
      latitude: 51.5074,
      longitude: -0.1278,
      accuracy: 5,
    },
  };
}

describe("GpsService", () => {
  let service: GpsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GpsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("getGpsLocationCoordinates", () => {
    it("should return coordinates if permission is granted", async () => {
      spyOn(navigator.permissions, "query").and.returnValue(
        Promise.resolve({ state: "granted" } as PermissionStatus),
      );

      spyOn(navigator.geolocation, "getCurrentPosition").and.callFake(
        (successCallback) => {
          successCallback(mockGeolocationPosition() as GeolocationPosition);
        },
      );

      const coordinates = await service.getGpsLocationCoordinates();
      expect(coordinates).toEqual({
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 5,
      });
    });

    it("should throw an error if permission is denied", async () => {
      spyOn(navigator.permissions, "query").and.returnValue(
        Promise.resolve({ state: "denied" } as PermissionStatus),
      );

      await expectAsync(
        service.getGpsLocationCoordinates(),
      ).toBeRejectedWithError(
        "GPS permission denied or blocked. Please enable it in your device settings.",
      );
    });

    it("should handle error when geolocation is not supported", async () => {
      spyOnProperty(navigator, "geolocation").and.returnValue(undefined);

      const coordinates = await service.getGpsLocationCoordinates();

      expect(coordinates).toBeUndefined();
    });
  });

  describe("handleGpsLocationPosition", () => {
    it("should extract coordinates from GeolocationPosition", () => {
      const result = service.handleGpsLocationPosition(
        mockGeolocationPosition() as GeolocationPosition,
      );
      expect(result).toEqual({
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 5,
      });
    });
  });
});
