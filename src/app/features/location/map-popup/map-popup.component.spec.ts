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
import { ConfirmationDialogService } from "../../../core/common-components/confirmation-dialog/confirmation-dialog.service";

describe("MapPopupComponent", () => {
  let component: MapPopupComponent;
  let fixture: ComponentFixture<MapPopupComponent>;

  let mapClick: Subject<Coordinates>;
  let mockGeoService: any;
  let mockConfirmationDialog: { getConfirmation: any };

  beforeEach(async () => {
    mapClick = new Subject<Coordinates>();
    mockGeoService = {
      lookup: vi.fn(),
      reverseLookup: vi.fn(),
      enrichGeoLocation: vi.fn((loc: GeoLocation | undefined) =>
        enrichGeoLocation(loc),
      ),
      composeAddressFromParts: vi.fn((loc: GeoLocation | undefined) => {
        if (!loc) return "";
        const street = [loc.road, loc.house_number].filter(Boolean).join(" ");
        const postcodeCity = [loc.postcode, loc.city].filter(Boolean).join(" ");
        return [street, postcodeCity].filter((x) => !!x).join(", ");
      }),
    };
    mockGeoService.reverseLookup.mockReturnValue(
      of({
        error: "Unable to geocode",
      } as any),
    );
    mockConfirmationDialog = {
      getConfirmation: vi.fn(),
    };

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
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: ConfigService, useValue: { getConfig: () => undefined } },
        { provide: GeoService, useValue: mockGeoService },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
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

  it("should adopt the new location (text + parts) on map click when the user confirms the update", async () => {
    let updatedMarkedLocations: OpenStreetMapsSearchResult[];
    component.markedLocations.subscribe(
      (res) => (updatedMarkedLocations = res),
    );

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
      road: "Old Road",
      postcode: "10001",
      city: "OldCity",
      country: "OldCountry",
    };

    const newGeo: OpenStreetMapsSearchResult = {
      lat: 1,
      lon: 2,
      display_name: "New Place",
      address: {
        road: "New Road",
        postcode: "99999",
        city: "NewCity",
        country: "NewCountry",
      },
    } as OpenStreetMapsSearchResult;

    mockGeoService.reverseLookup.mockReturnValue(of(newGeo));
    mockConfirmationDialog.getConfirmation.mockResolvedValue("update");

    await component.mapClicked({ lat: 1, lon: 2 });

    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalled();
    expect(updatedMarkedLocations).toEqual([newGeo]);
    expect(component.selectedLocation?.geoLookup).toEqual(newGeo);
    expect(component.selectedLocation?.locationString).toBe("New Place");
    expect(component.selectedLocation?.road).toBe("New Road");
    expect(component.selectedLocation?.postcode).toBe("99999");
    expect(component.selectedLocation?.city).toBe("NewCity");
    expect(component.selectedLocation?.country).toBe("NewCountry");
  });

  it("should move only the pin on map click when the user keeps the current address", async () => {
    let updatedMarkedLocations: OpenStreetMapsSearchResult[];
    component.markedLocations.subscribe(
      (res) => (updatedMarkedLocations = res),
    );

    component.selectedLocation = {
      geoLookup: {
        lat: 52,
        lon: 13,
        display_name: "Old Place",
      } as OpenStreetMapsSearchResult,
      locationString: "My custom text",
      road: "Old Road",
      house_number: "1",
      postcode: "10001",
      city: "OldCity",
      country: "OldCountry",
    };

    const newGeo: OpenStreetMapsSearchResult = {
      lat: 1,
      lon: 2,
      display_name: "New Place",
      address: {
        road: "New Road",
        postcode: "99999",
        city: "NewCity",
        country: "NewCountry",
      },
    } as OpenStreetMapsSearchResult;

    mockGeoService.reverseLookup.mockReturnValue(of(newGeo));
    mockConfirmationDialog.getConfirmation.mockResolvedValue("keep");

    await component.mapClicked({ lat: 1, lon: 2 });

    // pin moved to the new lookup...
    expect(component.selectedLocation?.geoLookup).toEqual(newGeo);
    expect(updatedMarkedLocations).toEqual([newGeo]);
    // ...but text and structured parts are preserved exactly
    expect(component.selectedLocation?.locationString).toBe("My custom text");
    expect(component.selectedLocation?.road).toBe("Old Road");
    expect(component.selectedLocation?.house_number).toBe("1");
    expect(component.selectedLocation?.postcode).toBe("10001");
    expect(component.selectedLocation?.city).toBe("OldCity");
    expect(component.selectedLocation?.country).toBe("OldCountry");
  });

  it("should adopt the new location without asking when there is no existing address", async () => {
    component.selectedLocation = undefined as unknown as GeoLocation;
    const newGeo: OpenStreetMapsSearchResult = {
      lat: 1,
      lon: 2,
      display_name: "Fresh Place",
    } as OpenStreetMapsSearchResult;
    mockGeoService.reverseLookup.mockReturnValue(of(newGeo));

    await component.mapClicked({ lat: 1, lon: 2 });

    expect(mockConfirmationDialog.getConfirmation).not.toHaveBeenCalled();
    expect(component.selectedLocation?.geoLookup).toEqual(newGeo);
    expect(component.selectedLocation?.locationString).toBe("Fresh Place");
  });
});
