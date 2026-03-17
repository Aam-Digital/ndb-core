import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AddressEditComponent } from "./address-edit.component";
import { GeoResult, GeoService } from "../geo.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ConfirmationDialogService } from "../../../core/common-components/confirmation-dialog/confirmation-dialog.service";
import { of } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { GeoLocation } from "../geo-location";

describe("AddressEditComponent", () => {
  let component: AddressEditComponent;
  let fixture: ComponentFixture<AddressEditComponent>;

  let mockGeoService: any;
  let mockConfirmationDialog: any;

  beforeEach(async () => {
    mockConfirmationDialog = {
      getConfirmation: vi.fn(),
    };

    mockGeoService = {
      lookup: vi.fn(),
      reverseLookup: vi.fn(),
    };
    mockGeoService.lookup.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        AddressEditComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: GeoService, useValue: {} },
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
    component.selectedLocation = { display_name: "some value" } as any;

    vi.spyOn(component.selectedLocationChange, "emit");
    component.clearLocation();

    expect(component.selectedLocation).toBeUndefined();
    expect(component.selectedLocationChange.emit).toHaveBeenCalledWith(
      undefined,
    );
  });

  it("should set manual address string to value", async () => {
    component.updateLocationString("manual address");

    expect(component.selectedLocation.locationString).toEqual("manual address");
  });

  it("should also remove geoLocation when manual address is deleted", async () => {
    component.selectedLocation = {
      locationString: "manual address",
      geoLookup: {} as GeoResult,
    };

    component.updateLocationString("");

    expect(component.selectedLocation).toBeUndefined();
  });

  it("should update manual address with suggested address and append extra details if present", async () => {
    vi.useFakeTimers();
    try {
      const SAMPLE_GEO_RESULT: GeoResult = {
        lat: 1,
        lon: 1,
        display_name: "lookup address",
      };

      // Case 1: Extra details present
      const selectedWithExtra: GeoLocation = {
        locationString: SAMPLE_GEO_RESULT.display_name,
        geoLookup: SAMPLE_GEO_RESULT,
      };

      component.selectedLocation = {
        locationString: "manual address",
        geoLookup: undefined,
      };

      component.updateFromAddressSearch({
        location: selectedWithExtra,
        userInput: "lookup address Manual",
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(component.selectedLocation).toEqual({
        locationString: "lookup address\nManual",
        geoLookup: SAMPLE_GEO_RESULT,
      });

      // Case 2: No extra details, user input matches suggestion
      component.selectedLocation = {
        locationString: "lookup address",
        geoLookup: undefined,
      };

      component.updateFromAddressSearch({
        location: selectedWithExtra,
        userInput: "lookup address",
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(component.selectedLocation).toEqual({
        locationString: "lookup address",
        geoLookup: SAMPLE_GEO_RESULT,
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
