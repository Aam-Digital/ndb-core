import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ColorInputComponent } from "./color-input.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("ColorInputComponent", () => {
  let component: ColorInputComponent;
  let fixture: ComponentFixture<ColorInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ColorInputComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ColorInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have a valid form control for a valid hex color", () => {
    component.onColorChange("#ff0000");
    expect(component.colorControl.valid).toBe(true);
  });

  it("should have an invalid form control for a named color like 'red'", () => {
    component.onColorChange("red");
    expect(component.colorControl.hasError("pattern")).toBe(true);
  });

  it("should not emit colorChange for invalid hex input", () => {
    const emittedValues: string[] = [];
    component.colorChange.subscribe((v) => emittedValues.push(v));

    component.onColorChange("red");

    expect(emittedValues).toHaveLength(0);
  });

  it("should emit colorChange for valid hex input", () => {
    const emittedValues: string[] = [];
    component.colorChange.subscribe((v) => emittedValues.push(v));

    component.onColorChange("#aabbcc");

    expect(emittedValues).toEqual(["#aabbcc"]);
  });

  it("should return #000000 as colorPickerValue when color is invalid", () => {
    component.color = "red";
    expect(component.colorPickerValue).toBe("#000000");
  });

  it("should return the valid hex value as colorPickerValue", () => {
    component.color = "#aabbcc";
    expect(component.colorPickerValue).toBe("#aabbcc");
  });
});
