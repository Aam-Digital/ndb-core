import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ColorInputComponent } from "./color-input.component";
import { setupCustomFormControlEditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";

describe("ColorInputComponent (standalone mode)", () => {
  let component: ColorInputComponent;
  let fixture: ComponentFixture<ColorInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ColorInputComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ColorInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have a valid colorControl for a valid hex color", () => {
    component.colorControl.setValue("#ff0000");
    expect(component.colorControl.valid).toBe(true);
  });

  it("should have an invalid colorControl for a named color like 'red'", () => {
    component.colorControl.setValue("red");
    expect(component.colorControl.hasError("pattern")).toBe(true);
  });

  it("should not emit valueChange for invalid hex input", () => {
    const emittedValues: string[] = [];
    component.valueChange.subscribe((v) => emittedValues.push(v));

    component.colorControl.setValue("red");

    expect(emittedValues).toHaveLength(0);
  });

  it("should emit valueChange for valid hex input", () => {
    const emittedValues: string[] = [];
    component.valueChange.subscribe((v) => emittedValues.push(v));

    component.colorControl.setValue("#aabbcc");

    expect(emittedValues).toEqual(["#aabbcc"]);
  });

  it("should return #000000 as colorPickerValue when color is invalid", () => {
    component.colorControl.setValue("red");
    expect(component.colorPickerValue).toBe("#000000");
  });

  it("should return the valid hex value as colorPickerValue", () => {
    component.colorControl.setValue("#aabbcc");
    expect(component.colorPickerValue).toBe("#aabbcc");
  });
});

describe("ColorInputComponent (EditComponent mode)", () => {
  let component: ColorInputComponent;
  let fixture: ComponentFixture<ColorInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ColorInputComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ColorInputComponent);
    component = fixture.componentInstance;
    setupCustomFormControlEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should be valid for a valid hex color", () => {
    component.formControl.setValue("#ff0000");
    fixture.detectChanges();
    expect(component.formControl.valid).toBe(true);
  });

  it("should be valid for an empty value", () => {
    component.formControl.setValue("");
    fixture.detectChanges();
    expect(component.formControl.valid).toBe(true);

    component.formControl.setValue(null);
    fixture.detectChanges();
    expect(component.formControl.valid).toBe(true);
  });

  it("should be invalid for a named color like 'red'", () => {
    component.formControl.setValue("red");
    fixture.detectChanges();
    expect(component.formControl.hasError("invalidHex")).toBe(true);
    expect(
      component.formControl.getError("invalidHex")?.errorMessage,
    ).toBeTruthy();
  });

  it("should be invalid for an incomplete hex value", () => {
    component.formControl.setValue("#fff");
    fixture.detectChanges();
    expect(component.formControl.hasError("invalidHex")).toBe(true);
  });

  it("should be invalid for a hex value without # prefix", () => {
    component.formControl.setValue("ff0000");
    fixture.detectChanges();
    expect(component.formControl.hasError("invalidHex")).toBe(true);
  });

  it("should update formControl value when color picker changes", () => {
    component.onColorPickerChange("#00ff00");
    fixture.detectChanges();
    expect(component.formControl.value).toBe("#00ff00");
  });

  it("should return #000000 as colorPickerValue when value is invalid", () => {
    component.formControl.setValue("red");
    expect(component.colorPickerValue).toBe("#000000");
  });

  it("should return the valid hex value as colorPickerValue", () => {
    component.formControl.setValue("#aabbcc");
    expect(component.colorPickerValue).toBe("#aabbcc");
  });
});
