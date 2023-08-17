import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImagePopupComponent } from "./image-popup.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ImagePopupComponent", () => {
  let component: ImagePopupComponent;
  let fixture: ComponentFixture<ImagePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagePopupComponent, FontAwesomeTestingModule],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImagePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
