import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ColorInputComponent } from "./color-input.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ColorInputComponent", () => {
  let component: ColorInputComponent;
  let fixture: ComponentFixture<ColorInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorInputComponent, FontAwesomeTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ColorInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
