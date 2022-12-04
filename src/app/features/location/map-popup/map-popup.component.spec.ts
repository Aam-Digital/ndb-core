import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MapPopupComponent } from "./map-popup.component";
import { LocationModule } from "../location.module";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

describe("MapPopupComponent", () => {
  let component: MapPopupComponent;
  let fixture: ComponentFixture<MapPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationModule],
      providers: [
        EntitySchemaService,
        { provide: MAT_DIALOG_DATA, useValue: { lat: 1, lon: 1 } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MapPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
