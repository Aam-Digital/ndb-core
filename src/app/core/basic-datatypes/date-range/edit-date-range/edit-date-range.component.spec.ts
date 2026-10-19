import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { provideNativeDateAdapter } from "@angular/material/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupCustomFormControlEditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import {
  EditDateRangeComponent,
  endNotBeforeStart,
} from "./edit-date-range.component";

describe("EditDateRangeComponent", () => {
  let component: EditDateRangeComponent;
  let fixture: ComponentFixture<EditDateRangeComponent>;

  const start = new Date(2026, 2, 1);
  const end = new Date(2026, 4, 31);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDateRangeComponent, NoopAnimationsModule],
      providers: [provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(EditDateRangeComponent);
    component = fixture.componentInstance;
    setupCustomFormControlEditComponent(component, "period", {}, fixture);
    fixture.detectChanges();
  });

  it("should show a value that is set on the form control in the picker", () => {
    component.formControl.setValue({ start, end });

    expect(component.range.value).toEqual({ start, end });
  });

  it.each([
    ["both dates", { start, end }, { start, end }],
    ["only the start date", { start, end: null }, { start }],
    ["only the end date", { start: null, end }, { end }],
    ["no date", { start: null, end: null }, null],
  ])(
    "should set the value of the form control if the picker has %s",
    (_, pickerValue, expected) => {
      component.range.setValue(pickerValue);

      expect(component.formControl.value).toEqual(expected);
      expect(component.formControl.dirty).toBe(true);
    },
  );

  it("should not reset an input that is still being typed when the value is set from the picker", () => {
    component.range.controls.start.setValue(start);
    // a half-typed end date is not a valid date yet, so it stays empty
    component.range.controls.end.setValue(null);

    expect(component.range.value).toEqual({ start, end: null });
  });

  it("should mark the field as invalid if the end date is before the start date", () => {
    component.range.setValue({ start: end, end: start });

    expect(component.formControl.errors?.dateRange.errorMessage).toBeTruthy();
  });

  it.each([
    ["no value", null, true],
    ["only a start date", { start }, true],
    ["only an end date", { end }, true],
    ["the end date after the start date", { start, end }, true],
    ["the same day", { start, end: start }, true],
    ["the end date before the start date", { start: end, end: start }, false],
  ])("validator: %s", (_, value, valid) => {
    expect(endNotBeforeStart(new FormControl(value)) === null).toBe(valid);
  });
});
