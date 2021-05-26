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

describe("EditPercentageComponent", () => {
  let component: EditPercentageComponent;
  let fixture: ComponentFixture<EditPercentageComponent>;

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
    const formControl = new FormControl();
    new FormGroup({ testProperty: formControl });
    component.onInitFromDynamicConfig({
      formControl: formControl,
      propertySchema: {},
      formFieldConfig: { id: "testProperty" },
    });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should only allow valid percentage values", () => {
    component.formControl.setValue(101);
    expect(component.formControl.invalid).toBeTrue();

    component.formControl.setValue(100);
    expect(component.formControl.valid).toBeTrue();

    component.formControl.setValue(10);
    expect(component.formControl.valid).toBeTrue();

    component.formControl.setValue(0);
    expect(component.formControl.valid).toBeTrue();

    component.formControl.setValue(-1);
    expect(component.formControl.invalid).toBeTrue();

    component.formControl.setValue("one" as any);
    expect(component.formControl.invalid).toBeTrue();
  });

  it("should keep existing validators", () => {
    component.formControl.setValue(null);
    expect(component.formControl.valid).toBeTrue();

    const control = new FormControl(0, [Validators.required]);
    new FormGroup({ testProperty: control });
    component.onInitFromDynamicConfig({
      formControl: control,
      propertySchema: {},
      formFieldConfig: { id: "testProperty" },
    });

    component.formControl.setValue(null);
    expect(component.formControl.invalid).toBeTrue();
  });
});
