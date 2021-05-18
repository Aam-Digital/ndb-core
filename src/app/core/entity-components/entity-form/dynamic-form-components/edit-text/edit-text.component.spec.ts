import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditTextComponent } from "./edit-text.component";
import { FormControl, FormGroup } from "@angular/forms";
import { EntityDetailsModule } from "../../../entity-details/entity-details.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("EditTextComponent", () => {
  let component: EditTextComponent;
  let fixture: ComponentFixture<EditTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityDetailsModule, NoopAnimationsModule],
      declarations: [EditTextComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditTextComponent);
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
