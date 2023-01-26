import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MapPropertiesPopupComponent } from "./map-properties-popup.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("MapPropertiesPopupComponent", () => {
  let component: MapPropertiesPopupComponent;
  let fixture: ComponentFixture<MapPropertiesPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapPropertiesPopupComponent, FontAwesomeTestingModule],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: [] }],
    }).compileComponents();

    fixture = TestBed.createComponent(MapPropertiesPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
