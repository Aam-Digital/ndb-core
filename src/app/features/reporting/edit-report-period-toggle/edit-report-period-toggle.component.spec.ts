import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { UntypedFormGroup } from "@angular/forms";
import { setupCustomFormControlEditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { EditReportPeriodToggleComponent } from "./edit-report-period-toggle.component";

describe("EditReportPeriodToggleComponent", () => {
  let component: EditReportPeriodToggleComponent;
  let fixture: ComponentFixture<EditReportPeriodToggleComponent>;
  let formGroup: UntypedFormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditReportPeriodToggleComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditReportPeriodToggleComponent);
    component = fixture.componentInstance;
    formGroup = setupCustomFormControlEditComponent(
      component,
      "transformations",
      {},
      fixture,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("is unchecked when no transformations are set", () => {
    expect(component.checked()).toBe(false);
  });

  it("writes the report-period transformation into the bound control when toggled on and clears it when off", () => {
    component.setChecked(true);
    expect(formGroup.get("transformations").value).toEqual({
      startDate: ["SQL_FROM_DATE"],
      endDate: ["SQL_TO_DATE"],
    });
    expect(component.checked()).toBe(true);

    component.setChecked(false);
    expect(formGroup.get("transformations").value).toEqual({});
    expect(component.checked()).toBe(false);
  });

  it("reflects an externally set transformations value as checked", () => {
    formGroup.get("transformations").setValue({ startDate: ["SQL_FROM_DATE"] });
    fixture.detectChanges();
    expect(component.checked()).toBe(true);
  });

  it("is unchecked for a report that only has non-period transformations", () => {
    formGroup.get("transformations").setValue({ custom: ["X"] });
    fixture.detectChanges();
    expect(component.checked()).toBe(false);
  });

  it("adds the report period without dropping other transformation keys", () => {
    formGroup.get("transformations").setValue({ custom: ["X"] });
    fixture.detectChanges();

    component.setChecked(true);
    expect(formGroup.get("transformations").value).toEqual({
      custom: ["X"],
      startDate: ["SQL_FROM_DATE"],
      endDate: ["SQL_TO_DATE"],
    });
  });

  it("removes only the period keys and preserves others when toggled off", () => {
    formGroup.get("transformations").setValue({
      custom: ["X"],
      startDate: ["SQL_FROM_DATE"],
      endDate: ["SQL_TO_DATE"],
    });
    fixture.detectChanges();

    component.setChecked(false);
    expect(formGroup.get("transformations").value).toEqual({ custom: ["X"] });
  });
});
