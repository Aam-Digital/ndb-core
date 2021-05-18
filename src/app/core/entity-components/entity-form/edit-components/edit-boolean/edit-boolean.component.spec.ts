import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditBooleanComponent } from "./edit-boolean.component";
import { EntityDetailsModule } from "../../../entity-details/entity-details.module";
import { FormControl, FormGroup } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("EditBooleanComponent", () => {
  let component: EditBooleanComponent;
  let fixture: ComponentFixture<EditBooleanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityDetailsModule, NoopAnimationsModule],
      declarations: [EditBooleanComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditBooleanComponent);
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
