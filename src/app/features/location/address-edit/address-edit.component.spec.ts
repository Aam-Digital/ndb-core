import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AddressEditComponent } from "./address-edit.component";
import { OpenStreetMapsSearchResult, GeoService } from "../geo.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ConfirmationDialogService } from "../../../core/common-components/confirmation-dialog/confirmation-dialog.service";
import { of } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { GeoLocation, enrichGeoLocation } from "../geo-location";
import type { Mock } from "vitest";

type GeoServiceMock = Pick<GeoService, "lookup" | "reverseLookup"> & {
  lookup: Mock;
  reverseLookup: Mock;
};

type ConfirmationDialogMock = Pick<
  ConfirmationDialogService,
  "getConfirmation"
> & {
  getConfirmation: Mock;
};

describe("AddressEditComponent", () => {
  let component: AddressEditComponent;
  let fixture: ComponentFixture<AddressEditComponent>;

  let mockGeoService: any;
  let mockConfirmationDialog: ConfirmationDialogMock;

  beforeEach(async () => {
    mockConfirmationDialog = {
      getConfirmation: vi.fn(),
    };

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
        return [street, postcodeCity, loc.country]
          .filter((x) => !!x)
          .join(", ");
      }),
    };
    mockGeoService.lookup.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        AddressEditComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: GeoService, useValue: mockGeoService },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddressEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should clear selected location when clicking 'Remove'", async () => {
    fixture.componentRef.setInput("selectedLocation", {
      locationString: "some value",
    });
    component.clearLocation();

    expect(component.selectedLocation()).toBeUndefined();
  });

  it("should set manual address string to value", async () => {
    component.updateLocationString("manual address");

    expect(component.selectedLocation()?.locationString).toEqual(
      "manual address",
    );
  });

  it("should preserve top-level address parts when editing the manual address", async () => {
    fixture.componentRef.setInput("selectedLocation", {
      locationString: "lookup address",
      geoLookup: {
        lat: 1,
        lon: 1,
        display_name: "lookup address",
        address: {
          road: "Main St",
          house_number: "42",
          postcode: "12345",
          city: "Berlin",
          country: "Germany",
        },
      } as OpenStreetMapsSearchResult,
      road: "Main St",
      house_number: "42",
      postcode: "12345",
      city: "Berlin",
      country: "Germany",
    });

    component.updateLocationString("manual address line");

    expect(component.selectedLocation()).toEqual({
      locationString: "manual address line",
      geoLookup: {
        lat: 1,
        lon: 1,
        display_name: "lookup address",
        address: {
          road: "Main St",
          house_number: "42",
          postcode: "12345",
          city: "Berlin",
          country: "Germany",
        },
      } as OpenStreetMapsSearchResult,
      road: "Main St",
      house_number: "42",
      postcode: "12345",
      city: "Berlin",
      country: "Germany",
    });
  });

  it("should also remove geoLocation when manual address is deleted", async () => {
    fixture.componentRef.setInput("selectedLocation", {
      locationString: "manual address",
      geoLookup: {} as OpenStreetMapsSearchResult,
    });

    component.updateLocationString("");

    expect(component.selectedLocation()).toBeUndefined();
  });

  it("should update manual address with suggested address and append extra details if present", async () => {
    vi.useFakeTimers();
    try {
      const SAMPLE_GEO_RESULT: OpenStreetMapsSearchResult = {
        lat: 1,
        lon: 1,
        display_name: "lookup address",
        address: {},
      } as OpenStreetMapsSearchResult;

      // Case 1: Extra details present
      const selectedWithExtra: GeoLocation = {
        locationString: SAMPLE_GEO_RESULT.display_name,
        geoLookup: {
          ...SAMPLE_GEO_RESULT,
          address: {
            road: "Main St",
            house_number: "42",
            postcode: "12345",
            city: "Berlin",
            country: "Germany",
          },
        } as OpenStreetMapsSearchResult,
        road: "Main St",
        house_number: "42",
        postcode: "12345",
        city: "Berlin",
        country: "Germany",
      };

      fixture.componentRef.setInput("selectedLocation", {
        locationString: "manual address",
        geoLookup: undefined,
      });

      component.updateFromAddressSearch({
        location: selectedWithExtra,
        userInput: "lookup address Manual",
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(component.selectedLocation()).toEqual({
        locationString: "lookup address\nManual",
        geoLookup: {
          ...SAMPLE_GEO_RESULT,
          address: {
            road: "Main St",
            house_number: "42",
            postcode: "12345",
            city: "Berlin",
            country: "Germany",
          },
        } as OpenStreetMapsSearchResult,
        road: "Main St",
        house_number: "42",
        postcode: "12345",
        city: "Berlin",
        country: "Germany",
      });

      // Case 2: No extra details, user input matches suggestion
      fixture.componentRef.setInput("selectedLocation", {
        locationString: "lookup address",
        geoLookup: undefined,
      });

      component.updateFromAddressSearch({
        location: selectedWithExtra,
        userInput: "lookup address",
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(component.selectedLocation()).toEqual({
        locationString: "lookup address",
        geoLookup: {
          ...SAMPLE_GEO_RESULT,
          address: {
            road: "Main St",
            house_number: "42",
            postcode: "12345",
            city: "Berlin",
            country: "Germany",
          },
        } as OpenStreetMapsSearchResult,
        road: "Main St",
        house_number: "42",
        postcode: "12345",
        city: "Berlin",
        country: "Germany",
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("should update a single address part while preserving siblings and locationString", async () => {
    fixture.componentRef.setInput("selectedLocation", {
      locationString: "Main St 42, 12345 Berlin, Germany",
      road: "Main St",
      house_number: "42",
      postcode: "12345",
      city: "Berlin",
      country: "Germany",
    });

    component.updateAddressPart("city", "Tempelhof");

    expect(component.selectedLocation()).toEqual({
      locationString: "Main St 42, 12345 Berlin, Germany",
      road: "Main St",
      house_number: "42",
      postcode: "12345",
      city: "Tempelhof",
      country: "Germany",
    });
  });

  it("should report parts as matching when no location is selected", () => {
    expect(component.partsMatchText()).toBe(true);
  });

  it("should report parts as matching the text when unedited", () => {
    fixture.componentRef.setInput("selectedLocation", {
      locationString: "Main St 42, 12345 Berlin, Germany",
      road: "Main St",
      house_number: "42",
      postcode: "12345",
      city: "Berlin",
      country: "Germany",
    });

    expect(component.partsMatchText()).toBe(true);
  });

  it("should report parts as not matching the text after editing a part", () => {
    fixture.componentRef.setInput("selectedLocation", {
      locationString: "Main St 42, 12345 Berlin, Germany",
      road: "Main St",
      house_number: "42",
      postcode: "12345",
      city: "Berlin",
      country: "Germany",
    });

    component.updateAddressPart("city", "Tempelhof");

    expect(component.partsMatchText()).toBe(false);
  });
});
