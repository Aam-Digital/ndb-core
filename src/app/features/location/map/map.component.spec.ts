import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MapComponent } from "./map.component";
import { ConfigService } from "../../../core/config/config.service";
import * as L from "leaflet";
import { Coordinates } from "../coordinates";
import { MapConfig } from "../map-config";
import { MatDialog } from "@angular/material/dialog";
import { MapPopupConfig } from "../map-popup/map-popup.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EMPTY, of, Subject } from "rxjs";
import { GeoLocation } from "../geo-location";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("MapComponent", () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let mockDialog: any;
  const config: MapConfig = { start: [52, 13] };
  let map: L.Map;

  const TEST_LOCATION: GeoLocation = {
    locationString: "test address",
    geoLookup: { lat: 1, lon: 1, display_name: "test address" },
  };

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn(),
    };
    mockDialog.open.mockReturnValue({ afterClosed: () => EMPTY } as any);
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

  it("should not emit double clicks on the map", async () => {
    vi.useFakeTimers();
    try {
      let clicked: Coordinates;
      component.mapClick.subscribe((res) => (clicked = res));

      await vi.advanceTimersByTimeAsync(1000);
      map.fireEvent("click", { latlng: new L.LatLng(1, 1) });
      await vi.advanceTimersByTimeAsync(300);
      map.fireEvent("click", { latlng: new L.LatLng(1, 2) });
      await vi.advanceTimersByTimeAsync(400);
      expect(clicked).toEqual({ lat: 1, lon: 1 });

      map.fireEvent("click", { latlng: new L.LatLng(1, 3) });
      await vi.advanceTimersByTimeAsync(400);
      expect(clicked).toEqual({ lat: 1, lon: 3 });
    } finally {
      vi.useRealTimers();
    }
  });

  it("should center map around markers and keep zoom", () => {
    fixture.componentRef.setInput("marked", [
      { lat: 1, lon: 1 },
      { lat: 1, lon: 3 },
    ]);
    fixture.detectChanges();

    const center = map.getCenter();
    expect(center.lat).toBeCloseTo(1);
    expect(center.lng).toBeCloseTo(2);
  });

  it("should create markers for entities and emit entity when marker is clicked", async () => {
    TestEntity.schema.set("address", { dataType: "location" });
    const child = new TestEntity();
    child["address"] = TEST_LOCATION;
    fixture.componentRef.setInput("entities", [child]);
    fixture.detectChanges();

    const marker = getEntityMarkers()[0];

    // marker shows entity information when hovered
    expect(marker.getTooltip()["_content"]).toBe(child.toString());

    component.entityClick.subscribe((res) => {
      expect(res).toBe(child);
    });

    marker.fireEvent("click");
    TestEntity.schema.delete("address");
  });

  it("should open a popup with the same marker data", async () => {
    const marked = { lat: 1, lon: 1 };
    fixture.componentRef.setInput("marked", [marked]);
    fixture.detectChanges();

    await component.openMapInPopup();
    const dialogData: MapPopupConfig = vi.mocked(mockDialog.open).mock
      .lastCall[1].data;

    expect(dialogData.marked).toEqual([marked]);
  });

  it("should open a popup that allows to change the properties displayed in the map", () => {
    TestEntity.schema.set("address", { dataType: "location" });
    TestEntity.schema.set("otherAddress", { dataType: "location" });
    const child = new TestEntity();
    child["address"] = TEST_LOCATION;
    child["otherAddress"] = {
      geoLookup: { lon: 99, lat: 99, display_name: "other address" },
    } as GeoLocation;

    fixture.componentRef.setInput("entities", [child]);
    fixture.detectChanges();

    // all location properties are selected on default
    expect(component.displayedProperties()).toEqual({
      [TestEntity.ENTITY_TYPE]: ["address", "otherAddress"],
    });
    expect(getEntityMarkers()).toHaveLength(2);

    const dialogResult = { [TestEntity.ENTITY_TYPE]: ["address"] };
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(dialogResult),
    } as any);
    component.openMapPropertiesPopup();

    // only selected location property is now displayed
    expect(component.displayedProperties()).toEqual(dialogResult);
    expect(getEntityMarkers()).toHaveLength(1);

    TestEntity.schema.delete("address");
    TestEntity.schema.delete("otherAddress");
  });

  it("should only show the button to select properties if entities have been set", () => {
    fixture.componentRef.setInput("displayedProperties", {});
    fixture.detectChanges();
    expect(component.showPropertySelection).toBe(false);

    fixture.componentRef.setInput("displayedProperties", {
      [TestEntity.ENTITY_TYPE]: ["address"],
    });
    fixture.detectChanges();
    expect(component.showPropertySelection).toBe(true);

    fixture.componentRef.setInput("displayedProperties", {});
    component.showPropertySelection = false;
    fixture.componentRef.setInput("entities", [new TestEntity()]);
    fixture.detectChanges();

    expect(component.showPropertySelection).toBe(true);
  });

  it("should trigger an update for the markers, once the map popup has been closed", async () => {
    fixture.componentRef.setInput("displayedProperties", {
      [TestEntity.ENTITY_TYPE]: ["address", "otherAddress"],
    });
    fixture.detectChanges();
    const dialogClosed = new Subject<void>();
    mockDialog.open.mockReturnValue({ afterClosed: () => dialogClosed } as any);

    await component.openMapInPopup();
    const popupData = vi.mocked(mockDialog.open).mock.lastCall[1]
      .data as MapPopupConfig;
    const properties = popupData.displayedProperties;
    properties[TestEntity.ENTITY_TYPE] = ["otherAddress"];
    dialogClosed.next();

    expect(component.displayedProperties()).toEqual({
      [TestEntity.ENTITY_TYPE]: ["otherAddress"],
    });
  });

  it("should call adjustOverlappingCoordinates when two entity coordinates overlap and produce separated markers", () => {
    TestEntity.schema.set("address", { dataType: "location" });
    const School1 = new TestEntity();
    const School2 = new TestEntity();
    School1["address"] = {
      locationString: "Test place 1",
      geoLookup: { lat: 10, lon: 10, display_name: "Test place 1" },
    } as GeoLocation;
    School2["address"] = {
      locationString: "Test place 2",
      geoLookup: { lat: 10, lon: 10, display_name: "Test place 2" },
    } as GeoLocation;

    fixture.componentRef.setInput("entities", [School1, School2]);
    fixture.detectChanges();

    const markers = getEntityMarkers();
    expect(markers).toHaveLength(2);
    const marker1 = markers[0].getLatLng();
    const marker2 = markers[1].getLatLng();

    // both entities should have diff in their markers location
    expect(marker1.lat === marker2.lat && marker1.lng === marker2.lng).toBe(
      false,
    );

    TestEntity.schema.delete("address");
  });

  it("should handle string lat/lon coordinates for overlapping entity coordinates and produce markers", () => {
    TestEntity.schema.set("address", { dataType: "location" });
    const testEntity1 = new TestEntity();
    testEntity1["address"] = {
      locationString: "Test place 1",
      geoLookup: {
        lat: "52.4790412",
        lon: "13.4319106",
        display_name: "Test place 1",
      },
    } as unknown as GeoLocation;

    const testEntity2 = new TestEntity();
    testEntity2["address"] = {
      locationString: "Test place 2",
      geoLookup: {
        lat: "52.4790412",
        lon: "13.4319106",
        display_name: "Test place 2",
      },
    } as unknown as GeoLocation;

    fixture.componentRef.setInput("entities", [testEntity1, testEntity2]);
    fixture.detectChanges();

    const markers = getEntityMarkers();

    const marker1LatLng = markers[0].getLatLng();
    const marker2LatLng = markers[1].getLatLng();

    expect(markers.length).toBe(2);
    expect(
      marker1LatLng.lat === marker2LatLng.lat &&
        marker1LatLng.lng === marker2LatLng.lng,
    ).toBe(false);

    TestEntity.schema.delete("address");
  });

  function getEntityMarkers(): L.Marker[] {
    const group = component["markerClusterGroup"];
    return (
      (group
        ?.getLayers()
        .filter((layer: any) => !!layer["entity"]) as L.Marker[]) || []
    );
  }
});
