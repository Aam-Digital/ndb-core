import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditNumberComponent } from "./edit-number.component";
import { UntypedFormGroup } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupEditComponent } from "../edit-component.spec";

describe("EditNumberComponent", () => {
  let component: EditNumberComponent;
  let fixture: ComponentFixture<EditNumberComponent>;
  let formGroup: UntypedFormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditNumberComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditNumberComponent);
    component = fixture.componentInstance;
    formGroup = setupEditComponent(component);
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
