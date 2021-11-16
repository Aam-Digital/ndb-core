import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditAgeComponent } from "./edit-age.component";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatNativeDateModule } from "@angular/material/core";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { MatInputModule } from "@angular/material/input";
import { TypedFormControl } from "../edit-component";

describe("EditAgeComponent", () => {
  let component: EditAgeComponent;
  let fixture: ComponentFixture<EditAgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatFormFieldModule,
        MatDatepickerModule,
        FontAwesomeModule,
        ReactiveFormsModule,
        MatNativeDateModule,
        FontAwesomeTestingModule,
        MatInputModule,
      ],
      declarations: [EditAgeComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAgeComponent);
    component = fixture.componentInstance;
    const formControl = new FormControl();
    const formGroup = new FormGroup({});
    component.formControlName = "testControl";
    component.formControl = formControl as TypedFormControl<Date>;
    formGroup.registerControl(component.formControlName, formControl);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
