import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditPercentageComponent } from "./edit-percentage.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FORM_CONTROL_NAME, setupEditComponent } from "../edit-component.spec";

describe("EditPercentageComponent", () => {
  let component: EditPercentageComponent;
  let fixture: ComponentFixture<EditPercentageComponent>;
  let formGroup: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      declarations: [EditPercentageComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditPercentageComponent);
    component = fixture.componentInstance;
    formGroup = setupEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should only allow valid percentage values", () => {
    component.formControl.setValue(101);
    expect(formGroup.invalid).toBeTrue();

    component.formControl.setValue(100);
    expect(formGroup.valid).toBeTrue();

    component.formControl.setValue(10);
    expect(formGroup.valid).toBeTrue();

    component.formControl.setValue(0);
    expect(formGroup.valid).toBeTrue();

    component.formControl.setValue(-1);
    expect(formGroup.invalid)
      .withContext("disallow negative values")
      .toBeTrue();

    component.formControl.setValue("one" as any);
    expect(formGroup.invalid)
      .withContext("disallow values that are not a number")
      .toBeTrue();
  });

  it("should keep existing validators", () => {
    component.formControl.setValue(null);
    expect(formGroup.valid).toBeTrue();

    const control = new FormControl(0, [Validators.required]);
    formGroup.setControl(FORM_CONTROL_NAME, control);
    component.onInitFromDynamicConfig({
      formControl: control,
      propertySchema: {},
      formFieldConfig: { id: FORM_CONTROL_NAME },
    });

    component.formControl.setValue(null);
    expect(formGroup.invalid).toBeTrue();
  });

  it("should allow decimal values", () => {
    component.formControl.setValue(10.5);
    expect(formGroup.valid).toBeTrue();
  });
});
