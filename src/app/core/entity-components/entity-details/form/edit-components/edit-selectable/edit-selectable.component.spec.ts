import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditSelectableComponent } from "./edit-selectable.component";
import { EntityDetailsModule } from "../../../entity-details.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FormControl, FormGroup } from "@angular/forms";

describe("EditSelectableComponent", () => {
  let component: EditSelectableComponent;
  let fixture: ComponentFixture<EditSelectableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityDetailsModule, NoopAnimationsModule],
      declarations: [EditSelectableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSelectableComponent);
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
