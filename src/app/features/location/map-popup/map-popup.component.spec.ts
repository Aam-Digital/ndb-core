import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MapPopupComponent } from "./map-popup.component";
import { LocationModule } from "../location.module";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ConfigService } from "../../../core/config/config.service";

describe("MapPopupComponent", () => {
  let component: MapPopupComponent;
  let fixture: ComponentFixture<MapPopupComponent>;
  const coordinates = { lat: 1, lon: 1 };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationModule],
      providers: [
        EntitySchemaService,
        { provide: MAT_DIALOG_DATA, useValue: { coordinates } },
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

  it("should use coordinates from dialog data", () => {
    expect(component.coordinates).toEqual(coordinates);
  });

  it("should update coordinates on map clicks", () => {
    component.select({ lat: 1, lon: 2 });

    expect(component.coordinates).toEqual({ lat: 1, lon: 2 });
  });

  it("should update coordinates when disabled", () => {
    component.disabled = true;
    component.select({ lat: 1, lon: 2 });

    expect(component.coordinates).toEqual(coordinates);
  });
});
