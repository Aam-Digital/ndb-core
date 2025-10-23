import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupCustomFormControlEditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { EditNumberComponent } from "./edit-number.component";

describe("EditNumberComponent", () => {
  let component: EditNumberComponent;
  let fixture: ComponentFixture<EditNumberComponent>;
  let formGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditNumberComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EditNumberComponent);
    component = fixture.componentInstance;
    formGroup = setupCustomFormControlEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should only allow valid numbers", () => {
    component.formControl.setValue("one" as any);
    expect(formGroup).not.toBeValidForm();

    component.formControl.setValue("1" as any);
    expect(formGroup).toBeValidForm();
  });

  it("should allow decimal numbers", () => {
    component.formControl.setValue(1.1);
    expect(formGroup).toBeValidForm();
  });
});
