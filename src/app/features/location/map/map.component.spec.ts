import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { MapComponent } from "./map.component";
import { UiConfig } from "../../../core/ui/ui-config";
import { ConfigService } from "../../../core/config/config.service";
import * as L from "leaflet";
import { Coordinates } from "../coordinates";

describe("MapComponent", () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  const config: UiConfig = { map: { start: [52, 13] } };
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
    expect(map.getCenter()).toEqual(new L.LatLng(...config.map.start));
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
});
