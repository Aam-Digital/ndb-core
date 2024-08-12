import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { MapComponent } from "./map.component";
import { ConfigService } from "../../../core/config/config.service";
import * as L from "leaflet";
import { Coordinates } from "../coordinates";
import { Child } from "../../../child-dev-project/children/model/child";
import { MapConfig } from "../map-config";
import { MatDialog } from "@angular/material/dialog";
import { MapPopupConfig } from "../map-popup/map-popup.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EMPTY, of, Subject } from "rxjs";
import { GeoLocation } from "../location.datatype";

describe("MapComponent", () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  const config: MapConfig = { start: [52, 13] };
  let map: L.Map;

  const TEST_LOCATION: GeoLocation = {
    locationString: "test address",
    geoLookup: { lat: 1, lon: 1, display_name: "test address" },
  };

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj(["open"]);
    mockDialog.open.and.returnValue({ afterClosed: () => EMPTY } as any);
    await TestBed.configureTestingModule({
      imports: [MapComponent, FontAwesomeTestingModule],
      providers: [
        { provide: ConfigService, useValue: { getConfig: () => config } },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    map = component["map"];
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should create map centered at start position from config", () => {
    expect(map.getCenter()).toEqual(new L.LatLng(...config.start));
  });

  it("should not emit double clicks on the map", fakeAsync(() => {
    let clicked: Coordinates;
    component.mapClick.subscribe((res) => (clicked = res));

    tick(1000);
    map.fireEvent("click", { latlng: new L.LatLng(1, 1) });
    tick(300);
    map.fireEvent("click", { latlng: new L.LatLng(1, 2) });
    tick(400);
    expect(clicked).toBeUndefined();

    map.fireEvent("click", { latlng: new L.LatLng(1, 3) });
    tick(400);
    expect(clicked).toEqual({ lat: 1, lon: 3 });
  }));

  it("should center map around markers and keep zoom", () => {
    component.marked = [
      { lat: 1, lon: 1 },
      { lat: 1, lon: 3 },
    ];

    const center = map.getCenter();
    expect(center.lat).toBeCloseTo(1);
    expect(center.lng).toBeCloseTo(2);
  });

  it("should create markers for entities and emit entity when marker is clicked", (done) => {
    Child.schema.set("address", { dataType: "location" });
    const child = new Child();
    child["address"] = TEST_LOCATION;
    component.entities = [child];

    const marker = getEntityMarkers()[0];

    // marker shows entity information when hovered
    expect(marker.getTooltip()["_content"]).toBe(child.toString());

    component.entityClick.subscribe((res) => {
      expect(res).toBe(child);
      done();
    });

    marker.fireEvent("click");
    Child.schema.delete("address");
  });

  it("should open a popup with the same marker data", async () => {
    const marked = { lat: 1, lon: 1 };
    component.marked = [marked];

    await component.openMapInPopup();
    const dialogData: MapPopupConfig =
      mockDialog.open.calls.mostRecent().args[1].data;

    expect(dialogData.marked).toEqual([marked]);
  });

  it("should open a popup that allows to change the properties displayed in the map", () => {
    const emitSpy = spyOn(component.displayedPropertiesChange, "emit");
    Child.schema.set("address", { dataType: "location" });
    Child.schema.set("otherAddress", { dataType: "location" });
    const child = new Child();
    child["address"] = TEST_LOCATION;
    child["otherAddress"] = {
      geoLookup: { lon: 99, lat: 99, display_name: "other address" },
    } as GeoLocation;

    component.entities = [child];

    // all location properties are selected on default
    expect(emitSpy).toHaveBeenCalledWith({
      [Child.ENTITY_TYPE]: ["address", "otherAddress"],
    });
    expect(getEntityMarkers()).toHaveSize(2);

    const dialogResult = { [Child.ENTITY_TYPE]: ["address"] };
    mockDialog.open.and.returnValue({
      afterClosed: () => of(dialogResult),
    } as any);
    component.openMapPropertiesPopup();

    // only selected location property is now displayed
    expect(emitSpy).toHaveBeenCalledWith(dialogResult);
    expect(getEntityMarkers()).toHaveSize(1);

    Child.schema.delete("address");
    Child.schema.delete("otherAddress");
  });

  it("should only show the button to select properties if entities have been set", () => {
    component.displayedProperties = {};
    expect(component.showPropertySelection).toBeFalse();

    component.displayedProperties = { [Child.ENTITY_TYPE]: ["address"] };
    expect(component.showPropertySelection).toBeTrue();

    component.displayedProperties = {};
    component.showPropertySelection = false;
    component.entities = [new Child()];

    expect(component.showPropertySelection).toBeTrue();
  });

  it("should trigger an update for the markers, once the map popup has been closed", async () => {
    component.displayedProperties = {
      [Child.ENTITY_TYPE]: ["address", "otherAddress"],
    };
    const dialogClosed = new Subject<void>();
    mockDialog.open.and.returnValue({ afterClosed: () => dialogClosed } as any);
    const emitSpy = spyOn(component.displayedPropertiesChange, "emit");

    await component.openMapInPopup();
    const popupData = mockDialog.open.calls.mostRecent().args[1]
      .data as MapPopupConfig;
    const properties = popupData.displayedProperties;
    properties[Child.ENTITY_TYPE] = ["otherAddress"];
    dialogClosed.next();

    expect(emitSpy).toHaveBeenCalledWith({
      [Child.ENTITY_TYPE]: ["otherAddress"],
    });
  });

  function getEntityMarkers(): L.Marker[] {
    const markers: L.Marker[] = [];
    map.eachLayer((layer) => {
      if (layer["entity"]) {
        markers.push(layer as L.Marker);
      }
    });
    return markers;
  }
});
