import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MapPropertiesPopupComponent } from "./map-properties-popup.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import {
  entityRegistry,
  EntityRegistry,
} from "../../../../core/entity/database-entity.decorator";

describe("MapPropertiesPopupComponent", () => {
  let component: MapPropertiesPopupComponent;
  let fixture: ComponentFixture<MapPropertiesPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapPropertiesPopupComponent, FontAwesomeTestingModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: [] },
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: MatDialogRef, useValue: undefined },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MapPropertiesPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
