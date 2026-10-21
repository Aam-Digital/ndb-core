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

  function typeInto(selector: string, text: string): HTMLInputElement {
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector(selector);
    input.value = text;
    input.dispatchEvent(new Event("input"));
    fixture.detectChanges();
    return input;
  }

  it("should report a typed text that is not a date as an error of the field, keeping the text", () => {
    typeInto("input[matStartDate]", "3/1/2026");
    const endInput = typeInto("input[matEndDate]", "not a date");

    expect(endInput.value).toBe("not a date");
    expect(component.formControl.value).toEqual({ start });
    expect(
      component.formControl.errors?.dateRangeInput.errorMessage,
    ).toBeTruthy();
  });

  it("should accept the field again once the typed text is a date", () => {
    typeInto("input[matStartDate]", "3/1/2026");
    typeInto("input[matEndDate]", "not a date");
    typeInto("input[matEndDate]", "5/31/2026");

    expect(component.formControl.valid).toBe(true);
    expect(component.formControl.value).toEqual({ start, end });
  });

  it("should not keep a text that is not a date as an error of the field once the component is gone", () => {
    typeInto("input[matEndDate]", "not a date");
    const control = component.formControl;

    // e.g. the field is hidden by a display condition while the form stays open
    fixture.destroy();
    control.setValue({ start, end });

    expect(control.valid).toBe(true);
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
