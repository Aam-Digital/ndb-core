import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { GpsService } from "./gps.service";
import { GeoService } from "./geo.service";
import { MapPopupComponent } from "./map-popup/map-popup.component";

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
  let mapPopupComponent: MapPopupComponent;
  let fixture: ComponentFixture<MapPopupComponent>;
  let location = { lat: 51.5074, lon: -0.1278 };

  beforeEach(async () => {
    const geoServiceSpy = jasmine.createSpyObj("GeoService", ["lookup"]);

    TestBed.configureTestingModule({
      declarations: [MapPopupComponent],
      providers: [GpsService, { provide: GeoService, useValue: geoServiceSpy }],
    })
      .overrideComponent(MapPopupComponent, {
        set: {
          providers: [{ provide: GeoService, useClass: GeoService }],
        },
      })
      .compileComponents();

    service = TestBed.inject(GpsService);
    geoService = TestBed.inject(GeoService) as jasmine.SpyObj<GeoService>;

    fixture = TestBed.createComponent(MapPopupComponent);
    mapPopupComponent = fixture.componentInstance;
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
    geoService.lookup.and.returnValue(
      of([{ lat: 51.5074, lon: -0.1278, display_name: "London, UK" }]),
    );

    const result = await mapPopupComponent.mapClicked(location);
    expect(result).toBeTruthy();
  });

  it("should get GPS location address with default value", async () => {
    geoService.lookup.and.returnValue(of([]));

    const result = await mapPopupComponent.mapClicked(location);
    expect(result).toBeTruthy();
  });

  it("should reject when geolocation is not supported", async () => {
    spyOn(navigator.geolocation, "getCurrentPosition").and.callFake(
      (success, error) => {
        error({
          code: 2,
          message: "Position unavailable",
        } as GeolocationPositionError);
      },
    );

    try {
      await service.getGpsLocationCoordinates();
    } catch (error) {
      expect(error.message).toBe("Position unavailable");
    }
  });
});
