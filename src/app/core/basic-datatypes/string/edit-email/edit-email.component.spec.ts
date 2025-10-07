import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupCustomFormControlEditComponent } from "app/core/entity/default-datatype/edit-component.spec";
import { EditEmailComponent } from "./edit-email.component";

describe("EditEmailComponent", () => {
  let component: EditEmailComponent;
  let fixture: ComponentFixture<EditEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditEmailComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EditEmailComponent);
    component = fixture.componentInstance;

    setupCustomFormControlEditComponent(component);

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should validate a proper email as valid", () => {
    component.formControl.setValue("test@example.com");
    fixture.detectChanges();

    expect(component.formControl.valid).toBeTrue();
    expect(component.formControl.hasError("email")).toBeFalse();
  });

  it("should mark invalid email as invalid", () => {
    component.formControl.setValue("invalid-email");
    fixture.detectChanges();

    expect(component.formControl.valid).toBeFalse();
    expect(component.formControl.hasError("email")).toBeTrue();
  });
});
