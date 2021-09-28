import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditDateComponent } from "./edit-date.component";
import { EntityDetailsModule } from "../../../entity-details/entity-details.module";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatInputModule } from "@angular/material/input";

describe("EditDateComponent", () => {
  let component: EditDateComponent;
  let fixture: ComponentFixture<EditDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EntityDetailsModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatDatepickerModule,
        MatInputModule,
      ],
      declarations: [EditDateComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDateComponent);
    component = fixture.componentInstance;
    const formControl = new FormControl();
    const formGroup = new FormGroup({});
    component.formControlName = "testControl";
    component.formControl = formControl;
    formGroup.registerControl(component.formControlName, formControl);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
