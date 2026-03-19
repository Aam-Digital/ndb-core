import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EditColorComponent } from "./edit-color.component";
import { setupCustomFormControlEditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";

describe("EditColorComponent", () => {
  let component: EditColorComponent;
  let fixture: ComponentFixture<EditColorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditColorComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditColorComponent);
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

  it("should update value when color picker changes", () => {
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
