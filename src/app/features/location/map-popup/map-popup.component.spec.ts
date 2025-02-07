import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { MapPopupComponent } from "./map-popup.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { of, Subject } from "rxjs";
import { Coordinates } from "../coordinates";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { GeoResult, GeoService } from "../geo.service";
import { ConfigService } from "../../../core/config/config.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { GeoLocation } from "../location.datatype";

describe("MapPopupComponent", () => {
  let component: MapPopupComponent;
  let fixture: ComponentFixture<MapPopupComponent>;

  let mapClick: Subject<Coordinates>;
  let mockGeoService: jasmine.SpyObj<GeoService>;

  beforeEach(async () => {
    mapClick = new Subject<Coordinates>();
    mockGeoService = jasmine.createSpyObj(["lookup", "reverseLookup"]);
    mockGeoService.reverseLookup.and.returnValue(
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

  it("should set new location upon map clicks (if enabled)", fakeAsync(() => {
    let updatedLocations: GeoResult[];
    component.markedLocations.subscribe((res) => (updatedLocations = res));

    const mockedClick: Coordinates = { lat: 1, lon: 2 };

    mockGeoService.reverseLookup.and.returnValue(
      of({
        lat: mockedClick.lat,
        lon: mockedClick.lon,
        display_name: `[selected on map: ${mockedClick.lat} - ${mockedClick.lon}]`,
      }),
    );

    component.mapClicked(mockedClick);
    tick();

    const expectedAfterFirstClick: GeoResult = {
      ...mockedClick,
      display_name: "[selected on map: 1 - 2]",
    };
    expect(updatedLocations).toEqual([expectedAfterFirstClick]);

    // expect this to be prevented when disabled
    component.data.disabled = true;
    const mockedClickOnDisabled: Coordinates = { lat: 99, lon: 99 };
    component.mapClicked(mockedClickOnDisabled);
    tick();

    expect(updatedLocations).toEqual([expectedAfterFirstClick]);
  }));

  it("should set new location upon map clicks with reverse-lookup of address", fakeAsync(() => {
    let updatedLocations: GeoResult[];
    component.markedLocations.subscribe((res) => (updatedLocations = res));

    const mockedClick: Coordinates = { lat: 1, lon: 2 };
    const fullLocation = { display_name: "lookup result", ...mockedClick };
    mockGeoService.reverseLookup.and.returnValue(of(fullLocation));

    component.mapClicked(mockedClick);
    tick();

    expect(mockGeoService.reverseLookup).toHaveBeenCalledWith(mockedClick);
    expect(updatedLocations).toEqual([fullLocation]);
  }));

  it("should update location if received from address search", fakeAsync(() => {
    let updatedMarkedLocations: GeoResult[];
    component.markedLocations.subscribe(
      (res) => (updatedMarkedLocations = res),
    );

    const newLocation: GeoLocation = {
      geoLookup: { lat: 1, lon: 2, display_name: "x" },
      locationString: "x",
    };
    component.updateLocation(newLocation);
    tick();
    expect(component.selectedLocation).toEqual(newLocation);
    expect(updatedMarkedLocations).toEqual([newLocation.geoLookup]);

    component.updateLocation(undefined);
    tick();
    expect(component.selectedLocation).toBeUndefined();
    expect(updatedMarkedLocations).toEqual([]); // TODO: this is maybe not the best interface/logic
  }));
});
