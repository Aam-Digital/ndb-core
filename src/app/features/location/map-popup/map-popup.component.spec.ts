import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { MapPopupComponent } from "./map-popup.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { of, Subject } from "rxjs";
import { Coordinates } from "../coordinates";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { GeoResult, GeoService } from "../geo.service";
import { ConfigService } from "../../../core/config/config.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("MapPopupComponent", () => {
  let component: MapPopupComponent;
  let fixture: ComponentFixture<MapPopupComponent>;

  let mapClick: Subject<Coordinates>;
  let mockGeoService: jasmine.SpyObj<GeoService>;

  beforeEach(async () => {
    mapClick = new Subject<Coordinates>();
    mockGeoService = jasmine.createSpyObj(["lookup", "reverseLookup"]);
    mockGeoService.lookup.and.returnValue(of([]));

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

  it("should update location if received from address search", fakeAsync(() => {
    let updatedLocations: GeoResult[];
    component.markedLocations.subscribe((res) => (updatedLocations = res));

    const newLocation: GeoResult = { lat: 1, lon: 2, display_name: "x" };
    component.updateLocation(newLocation);
    tick();
    expect(updatedLocations).toEqual([newLocation]);

    component.updateLocation(undefined);
    tick();
    expect(updatedLocations).toEqual([undefined]); // TODO: this is maybe not the best interface/logic
  }));
});
