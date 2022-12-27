import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MapPopupComponent } from "./map-popup.component";
import { LocationModule } from "../location.module";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from "@angular/material/legacy-dialog";
import { ConfigService } from "../../../core/config/config.service";
import { Subject } from "rxjs";
import { Coordinates } from "../coordinates";

describe("MapPopupComponent", () => {
  let component: MapPopupComponent;
  let fixture: ComponentFixture<MapPopupComponent>;
  const mapClick = new Subject<Coordinates>();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationModule],
      providers: [
        EntitySchemaService,
        { provide: MAT_DIALOG_DATA, useValue: { mapClick } },
        { provide: ConfigService, useValue: { getConfig: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MapPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should publish coordinates on map clicks", () => {
    let coordinates: Coordinates;
    mapClick.subscribe((res) => (coordinates = res));

    component.mapClicked({ lat: 1, lon: 2 });

    expect(coordinates).toEqual({ lat: 1, lon: 2 });
  });

  it("should not update coordinates when disabled", () => {
    let coordinates: Coordinates;
    mapClick.subscribe((res) => (coordinates = res));

    component.data.disabled = true;
    component.mapClicked({ lat: 1, lon: 2 });

    expect(coordinates).toBeUndefined();
  });
});
