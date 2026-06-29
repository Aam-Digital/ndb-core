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

  it("writes the report-period transformation when toggled on and clears it when off", () => {
    component.setChecked(true);
    expect(component.value).toEqual({
      startDate: ["SQL_FROM_DATE"],
      endDate: ["SQL_TO_DATE"],
    });
    expect(component.checked()).toBe(true);

    component.setChecked(false);
    expect(component.value).toEqual({});
    expect(component.checked()).toBe(false);
  });

  it("reflects an externally set transformations value as checked", () => {
    formGroup.get("transformations").setValue({ startDate: ["SQL_FROM_DATE"] });
    fixture.detectChanges();
    expect(component.checked()).toBe(true);
  });
});
