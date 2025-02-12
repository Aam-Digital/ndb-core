import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditUrlComponent } from "./edit-url.component";
import { setupEditComponent } from "app/core/entity/default-datatype/edit-component.spec";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { By } from "@angular/platform-browser";

describe("EditUrlComponent", () => {
  let component: EditUrlComponent;
  let fixture: ComponentFixture<EditUrlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditUrlComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditUrlComponent);
    component = fixture.componentInstance;
    setupEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should be invalid for value that is not a complete URL", () => {
    component.formControl.setValue("example");
    fixture.detectChanges();
    expect(component.formControl.hasError("invalid")).toBeTrue();
  });

  it("should be valid for empty value", () => {
    component.formControl.setValue("");
    fixture.detectChanges();
    expect(component.formControl.valid).toBeTrue();

    component.formControl.setValue(null);
    fixture.detectChanges();
    expect(component.formControl.valid).toBeTrue();
  });

  it("should be valid for url-like value", () => {
    component.formControl.setValue("https://test.com");
    fixture.detectChanges();
    expect(component.formControl.valid).toBeTrue();
  });

  it("should open link in a new tab when field is disabled and clicked", () => {
    const testUrl = "https://test.com";
    component.formControl.setValue(testUrl);
    component.formControl.disable();
    fixture.detectChanges();

    spyOn(window, "open");

    fixture.debugElement.query(By.css("mat-form-field")).nativeElement.click();

    expect(window.open).toHaveBeenCalledWith(testUrl, "_blank");
  });
});
