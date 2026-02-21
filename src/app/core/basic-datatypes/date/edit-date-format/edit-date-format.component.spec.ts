import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditDateFormatComponent } from "./edit-date-format.component";
import { FormControl } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";

describe("EditDateFormatComponent", () => {
  let component: EditDateFormatComponent;
  let fixture: ComponentFixture<EditDateFormatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDateFormatComponent, MatFormFieldModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EditDateFormatComponent);
    component = fixture.componentInstance;
    component.ngControl = {
      control: new FormControl(""),
    } as any;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should include custom format in options when set", () => {
    const customFormat = "mm-dd-yyyy";
    component.formControl.setValue(customFormat);
    fixture.detectChanges();
    expect(component.formatOptions()).toContain(customFormat);
    expect(component.formatOptions().length).toBe(
      component.predefinedFormats.length + 1,
    );
  });
});
