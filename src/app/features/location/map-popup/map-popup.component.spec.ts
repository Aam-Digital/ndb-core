import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MapPopupComponent } from "./map-popup.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { of, Subject } from "rxjs";
import { Coordinates } from "../coordinates";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { OpenStreetMapsSearchResult, GeoService } from "../geo.service";
import { ConfigService } from "../../../core/config/config.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { GeoLocation, enrichGeoLocation } from "../geo-location";

describe("MapPopupComponent", () => {
  let component: MapPopupComponent;
  let fixture: ComponentFixture<MapPopupComponent>;

  let mapClick: Subject<Coordinates>;
  let mockGeoService: any;

  beforeEach(async () => {
    mapClick = new Subject<Coordinates>();
    mockGeoService = {
      lookup: vi.fn(),
      reverseLookup: vi.fn(),
      enrichGeoLocation: vi.fn((loc: GeoLocation | undefined) =>
        enrichGeoLocation(loc),
      ),
    };
    mockGeoService.reverseLookup.mockReturnValue(
      of({
        error: "Unable to geocode",
      } as any),
    );

    await TestBed.configureTestingModule({
      imports: [
        MapPopupComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { mapClick, displayedProperties: {} },
        },
        { provide: MatDialogRef, useValue: {} },
        { provide: ConfigService, useValue: { getConfig: () => undefined } },
        { provide: GeoService, useValue: mockGeoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MapPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set new location upon map clicks (if enabled)", async () => {
    vi.useFakeTimers();
    try {
      let updatedLocations: OpenStreetMapsSearchResult[];
      component.markedLocations.subscribe((res) => (updatedLocations = res));

      const mockedClick: Coordinates = { lat: 1, lon: 2 };

      mockGeoService.reverseLookup.mockReturnValue(
        of({
          lat: mockedClick.lat,
          lon: mockedClick.lon,
          display_name: `[selected on map: ${mockedClick.lat} - ${mockedClick.lon}]`,
        }),
      );

      component.mapClicked(mockedClick);
      await vi.advanceTimersByTimeAsync(0);

      const expectedAfterFirstClick: OpenStreetMapsSearchResult = {
        ...mockedClick,
        display_name: "[selected on map: 1 - 2]",
      } as OpenStreetMapsSearchResult;
      expect(updatedLocations).toEqual([expectedAfterFirstClick]);
      expect(component.selectedLocation).toEqual({
        geoLookup: expectedAfterFirstClick,
        locationString: expectedAfterFirstClick.display_name,
      });

      // expect this to be prevented when disabled
      component.data.disabled = true;
      const mockedClickOnDisabled: Coordinates = { lat: 99, lon: 99 };
      component.mapClicked(mockedClickOnDisabled);
      await vi.advanceTimersByTimeAsync(0);

      expect(updatedLocations).toEqual([expectedAfterFirstClick]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should set new location upon map clicks with reverse-lookup of address", async () => {
    vi.useFakeTimers();
    try {
      let updatedLocations: OpenStreetMapsSearchResult[];
      component.markedLocations.subscribe((res) => (updatedLocations = res));

      const mockedClick: Coordinates = { lat: 1, lon: 2 };
      const fullLocation = { display_name: "lookup result", ...mockedClick };
      mockGeoService.reverseLookup.mockReturnValue(of(fullLocation));

      component.mapClicked(mockedClick);
      await vi.advanceTimersByTimeAsync(0);

      expect(mockGeoService.reverseLookup).toHaveBeenCalledWith(mockedClick);
      expect(updatedLocations).toEqual([fullLocation]);
      expect(component.selectedLocation).toEqual({
        geoLookup: fullLocation,
        locationString: fullLocation.display_name,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("should update location if received from address search", async () => {
    vi.useFakeTimers();
    try {
      let updatedMarkedLocations: OpenStreetMapsSearchResult[];
      component.markedLocations.subscribe(
        (res) => (updatedMarkedLocations = res),
      );

      const newLocation: GeoLocation = {
        geoLookup: {
          lat: 1,
          lon: 2,
          display_name: "x",
          address: {
            road: "Main St",
            house_number: "42",
            postcode: "12345",
            city: "Berlin",
            country: "Germany",
          },
        } as OpenStreetMapsSearchResult,
        locationString: "x",
      };
      component.updateLocation(newLocation);
      await vi.advanceTimersByTimeAsync(0);
      expect(component.selectedLocation).toEqual({
        ...newLocation,
        road: "Main St",
        house_number: "42",
        postcode: "12345",
        city: "Berlin",
        country: "Germany",
      });
      expect(updatedMarkedLocations).toEqual([newLocation.geoLookup]);

      component.updateLocation(undefined);
      await vi.advanceTimersByTimeAsync(0);
      expect(component.selectedLocation).toBeUndefined();
      expect(updatedMarkedLocations).toEqual([]); // TODO: this is maybe not the best interface/logic
    } finally {
      vi.useRealTimers();
    }
  });

  it("should replace stale top-level fields when selecting a different map location", async () => {
    vi.useFakeTimers();
    try {
      let updatedMarkedLocations: OpenStreetMapsSearchResult[];
      component.markedLocations.subscribe(
        (res) => (updatedMarkedLocations = res),
      );

      // Pre-populate selectedLocation with a previous geoLookup and top-level fields
      component.selectedLocation = {
        geoLookup: {
          lat: 52,
          lon: 13,
          display_name: "Old Place",
          address: {
            road: "Old Road",
            postcode: "10001",
            city: "OldCity",
            country: "OldCountry",
          },
        } as OpenStreetMapsSearchResult,
        locationString: "Old Place",
        // top-level fields that should be replaced when a new geoLookup is selected
        road: "Old Road",
        postcode: "10001",
        city: "OldCity",
        country: "OldCountry",
      } as any;

      const mockedClick: Coordinates = { lat: 1, lon: 2 };
      const newGeo: OpenStreetMapsSearchResult = {
        lat: mockedClick.lat,
        lon: mockedClick.lon,
        display_name: "New Place",
        address: {
          road: "New Road",
          postcode: "99999",
          city: "NewCity",
          country: "NewCountry",
        },
      } as OpenStreetMapsSearchResult;

      mockGeoService.reverseLookup.mockReturnValue(of(newGeo));

      await component.mapClicked(mockedClick);
      await vi.advanceTimersByTimeAsync(0);

      // marked locations should reflect the new lookup
      expect(updatedMarkedLocations).toEqual([newGeo]);

      // selectedLocation should have top-level fields populated from the new geoLookup,
      // not retain the old ones
      expect(component.selectedLocation?.road).toBe("New Road");
      expect(component.selectedLocation?.postcode).toBe("99999");
      expect(component.selectedLocation?.city).toBe("NewCity");
      expect(component.selectedLocation?.country).toBe("NewCountry");
      expect(component.selectedLocation?.geoLookup).toEqual(newGeo);
    } finally {
      vi.useRealTimers();
    }
  });
});
