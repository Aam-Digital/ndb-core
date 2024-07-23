import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { GeoResult } from "../geo.service";
import { Subject } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { LocationInputComponent } from "./location-input.component";
import {
  MapPopupComponent,
  MapPopupConfig,
} from "../map-popup/map-popup.component";
import { GeoLocation } from "../location.datatype";

describe("LocationInputComponent", () => {
  let component: LocationInputComponent;
  let fixture: ComponentFixture<LocationInputComponent>;

  const SAMPLE_GEO_RESULT: GeoResult = {
    lat: 1,
    lon: 1,
    display_name: "lookup address",
  };

  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogAfterClosedSubject: Subject<GeoLocation[] | undefined>;

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj(["open"]);
    mockDialogAfterClosedSubject = new Subject();
    mockDialog.open.and.returnValue({
      afterClosed: () => mockDialogAfterClosedSubject,
    } as any);

    await TestBed.configureTestingModule({
      imports: [LocationInputComponent, MockedTestingModule.withState()],
      providers: [{ provide: MatDialog, useValue: mockDialog }],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should open map dialog and pass current location and text to address search", () => {
    component.value = {
      locationString: "manual address",
      geoLookup: SAMPLE_GEO_RESULT,
    };

    component.openMap();

    const expectedDialogData: MapPopupConfig = {
      selectedLocation: component.value,
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
      selectedLocation: undefined,
      disabled: true,
    };
    expect(mockDialog.open).toHaveBeenCalledWith(
      MapPopupComponent,
      jasmine.objectContaining({
        data: expectedDialogData,
      }),
    );
  });

  it("should update value if location is selected in Map Dialog", fakeAsync(() => {
    component.value = {
      locationString: undefined,
      geoLookup: undefined,
    };

    component.openMap();
    const selected: GeoLocation = {
      geoLookup: SAMPLE_GEO_RESULT,
      locationString: SAMPLE_GEO_RESULT.display_name,
    };
    mockDialogAfterClosedSubject.next([selected]);
    tick();

    expect(component.value).toEqual({
      locationString: SAMPLE_GEO_RESULT.display_name,
      geoLookup: SAMPLE_GEO_RESULT,
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

    expect(component.value).toEqual(undefined);
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
