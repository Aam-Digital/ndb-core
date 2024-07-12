import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { GeoResult, GeoService } from "../geo.service";
import { of, Subject } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { LocationInputComponent } from "./location-input.component";
import {
  MapPopupComponent,
  MapPopupConfig,
} from "../map-popup/map-popup.component";
import { ConfirmationDialogService } from "../../../core/common-components/confirmation-dialog/confirmation-dialog.service";

describe("LocationInputComponent", () => {
  let component: LocationInputComponent;
  let fixture: ComponentFixture<LocationInputComponent>;

  const SAMPLE_GEO_RESULT: GeoResult = {
    lat: 1,
    lon: 1,
    display_name: "lookup address",
  };

  let mockGeoService: jasmine.SpyObj<GeoService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogAfterClosedSubject: Subject<GeoResult[] | undefined>;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(async () => {
    mockGeoService = jasmine.createSpyObj(["lookup", "reverseLookup"]);
    mockGeoService.lookup.and.returnValue(of([]));

    mockDialog = jasmine.createSpyObj(["open"]);
    mockDialogAfterClosedSubject = new Subject();
    mockDialog.open.and.returnValue({
      afterClosed: () => mockDialogAfterClosedSubject,
    } as any);

    mockConfirmationDialog = jasmine.createSpyObj(["getConfirmation"]);

    await TestBed.configureTestingModule({
      imports: [LocationInputComponent, MockedTestingModule.withState()],
      providers: [
        { provide: GeoService, useValue: mockGeoService },
        { provide: MatDialog, useValue: mockDialog },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set manual address string to value", async () => {
    component.updateLocationString("manual address");

    expect(component.value.locationString).toEqual("manual address");
  });

  it("should also remove geoLocation when manual address is deleted", async () => {
    component.value = {
      locationString: "manual address",
      geoLookup: {} as GeoResult,
    };

    component.updateLocationString("");

    expect(component.value.locationString).toEqual("");
    expect(component.value.geoLookup).toBeUndefined();
  });

  it("should open map dialog and pass current location and text to address search", () => {
    component.value = {
      locationString: "manual address",
      geoLookup: SAMPLE_GEO_RESULT,
    };

    component.openMap();

    const expectedDialogData: MapPopupConfig = {
      marked: [SAMPLE_GEO_RESULT],
      initialSearchText: "manual address",
      disabled: false,
    };
    expect(mockDialog.open).toHaveBeenCalledWith(
      MapPopupComponent,
      jasmine.objectContaining({
        data: expectedDialogData,
      }),
    );
  });

  it("should open map dialog as 'disabled' if control is disabled", () => {
    component.disabled = true;
    component.openMap();

    const expectedDialogData: MapPopupConfig = {
      marked: [undefined],
      initialSearchText: undefined,
      disabled: true,
    };
    expect(mockDialog.open).toHaveBeenCalledWith(
      MapPopupComponent,
      jasmine.objectContaining({
        data: expectedDialogData,
      }),
    );
  });

  it("should update value if location is selected in Map Dialog and set empty manual address", fakeAsync(() => {
    component.value = {
      locationString: undefined,
      geoLookup: undefined,
    };

    component.openMap();
    const selected: GeoResult = { lat: 99, lon: 99, display_name: "selected" };
    mockDialogAfterClosedSubject.next([selected]);
    tick();

    expect(component.value).toEqual({
      locationString: selected.display_name,
      geoLookup: selected,
    });
  }));

  it("should offer to update manual address after location was selected in Map Dialog", fakeAsync(() => {
    component.value = {
      locationString: "manual address",
      geoLookup: undefined,
    };

    mockConfirmationDialog.getConfirmation.and.resolveTo(false);
    component.openMap();
    const selected: GeoResult = { lat: 99, lon: 99, display_name: "selected" };
    mockDialogAfterClosedSubject.next([selected]);
    tick();
    expect(component.value).toEqual({
      locationString: "manual address",
      geoLookup: selected,
    });

    // test user confirms
    component.value = {
      locationString: "manual address",
      geoLookup: undefined,
    };
    mockConfirmationDialog.getConfirmation.and.resolveTo(true);
    component.openMap();
    mockDialogAfterClosedSubject.next([selected]);
    tick();
    expect(component.value).toEqual({
      locationString: selected.display_name,
      geoLookup: selected,
    });
  }));

  it("should update value if location is removed in Map Dialog", fakeAsync(() => {
    component.value = {
      locationString: SAMPLE_GEO_RESULT.display_name,
      geoLookup: SAMPLE_GEO_RESULT,
    };

    component.openMap();
    mockDialogAfterClosedSubject.next([undefined]);
    tick();

    expect(component.value).toEqual({
      locationString: "",
      geoLookup: undefined,
    });
  }));

  it("should ask if custom manual address shall be deleted if location removed in Map Dialog", fakeAsync(() => {
    component.value = {
      locationString: "manual address",
      geoLookup: SAMPLE_GEO_RESULT,
    };

    mockConfirmationDialog.getConfirmation.and.resolveTo(false);
    component.openMap();
    mockDialogAfterClosedSubject.next([undefined]);
    tick();
    expect(component.value).toEqual({
      locationString: "manual address",
      geoLookup: undefined,
    });
    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalled();

    // test user confirms
    component.value = {
      locationString: "manual address",
      geoLookup: SAMPLE_GEO_RESULT,
    };

    mockConfirmationDialog.getConfirmation.calls.reset();
    mockConfirmationDialog.getConfirmation.and.resolveTo(true);
    component.openMap();
    mockDialogAfterClosedSubject.next([undefined]);
    tick();
    expect(component.value).toEqual({
      locationString: "",
      geoLookup: undefined,
    });
    expect(mockConfirmationDialog.getConfirmation).toHaveBeenCalled();
  }));

  it("should not change value if Map Dialog was dismissed without selecting new location", fakeAsync(() => {
    const existingValue = {
      locationString: "manual address",
      geoLookup: SAMPLE_GEO_RESULT,
    };
    component.value = existingValue;

    component.openMap();
    // close without return value (explicit return value is always an array)
    mockDialogAfterClosedSubject.next(undefined);
    tick();

    expect(component.value).toEqual(existingValue);
  }));
});
