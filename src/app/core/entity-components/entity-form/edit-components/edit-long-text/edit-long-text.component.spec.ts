import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditLongTextComponent } from "./edit-long-text.component";
import { EntityDetailsModule } from "../../../entity-details/entity-details.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FormControl, FormGroup } from "@angular/forms";

describe("EditLongTextComponent", () => {
  let component: EditLongTextComponent;
  let fixture: ComponentFixture<EditLongTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityDetailsModule, NoopAnimationsModule],
      declarations: [EditLongTextComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditLongTextComponent);
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
