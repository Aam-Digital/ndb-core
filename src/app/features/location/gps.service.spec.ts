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
  const originalPermissions = navigator.permissions;
  const originalGeolocation = navigator.geolocation;

  function setPermissions(state: PermissionState) {
    Object.defineProperty(navigator, "permissions", {
      value: {
        query: vi.fn().mockResolvedValue({ state } as PermissionStatus),
      },
      configurable: true,
    });
  }

  function setGeolocationSuccess() {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: vi.fn().mockImplementation((successCallback) => {
          successCallback(mockGeolocationPosition() as GeolocationPosition);
        }),
      },
      configurable: true,
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GpsService);
  });

  afterEach(() => {
    Object.defineProperty(navigator, "permissions", {
      value: originalPermissions,
      configurable: true,
    });
    Object.defineProperty(navigator, "geolocation", {
      value: originalGeolocation,
      configurable: true,
    });
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return coordinates if permission is granted", async () => {
    setPermissions("granted");
    setGeolocationSuccess();

    const coordinates = await service.getGpsLocationCoordinates();
    expect(coordinates).toEqual({
      lat: 51.5074,
      lon: -0.1278,
      accuracy: 5,
    });
  });

  it("should throw an error if permission is denied", async () => {
    setPermissions("denied");
    setGeolocationSuccess();

    await expect(service.getGpsLocationCoordinates()).rejects.toThrowError(
      "GPS permission denied or blocked. Please enable it in your device settings.",
    );
  });

  it("should handle error when geolocation is not supported", async () => {
    const originalGeolocation = navigator.geolocation;
    Object.defineProperty(navigator, "geolocation", {
      value: undefined,
      configurable: true,
    });

    const coordinates = await service.getGpsLocationCoordinates();

    expect(coordinates).toBeUndefined();

    Object.defineProperty(navigator, "geolocation", {
      value: originalGeolocation,
      configurable: true,
    });
  });
});
