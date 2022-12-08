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

describe("MapComponent", () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  const config: MapConfig = { start: [52, 13] };
  let map: L.Map;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapComponent],
      providers: [
        { provide: ConfigService, useValue: { getConfig: () => config } },
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
    const child = new Child();
    child["address"] = { lat: 1, lon: 1 };
    component.entities = [{ entity: child, property: "address" }];

    // Look for marker where entity has been set
    let marker: L.Marker;
    map.eachLayer((layer) => {
      if (layer["entity"]) {
        marker = layer as L.Marker;
      }
    });

    // marker shows entity information when hovered
    expect(marker.getTooltip()["_content"]).toBe(child.toString());

    component.entityClick.subscribe((res) => {
      expect(res).toBe(child);
      done();
    });

    marker.fireEvent("click");
  });
});
