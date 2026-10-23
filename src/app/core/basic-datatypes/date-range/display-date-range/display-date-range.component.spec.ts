import { TestBed } from "@angular/core/testing";
import { DatabaseEntity } from "../../../entity/database-entity.decorator";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { Entity } from "../../../entity/model/entity";
import { CustomDatePipe } from "../../date/custom-date.pipe";
import { DateRangeValue } from "../date-range.datatype";
import { DisplayDateRangeComponent } from "./display-date-range.component";

@DatabaseEntity("DisplayDateRangeTestEntity")
class DisplayDateRangeTestEntity extends Entity {
  @DatabaseField({ dataType: "date-range", anonymize: "retain-anonymized" })
  period: DateRangeValue;
}

describe("DisplayDateRangeComponent", () => {
  const start = new Date(2026, 2, 1);
  const end = new Date(2026, 4, 31);

  function render(value: DateRangeValue | undefined): string {
    const fixture = TestBed.createComponent(DisplayDateRangeComponent);
    fixture.componentRef.setInput("value", value);
    fixture.detectChanges();
    return fixture.nativeElement.textContent.replace(/\s+/g, " ").trim();
  }

  function formatted(date: Date): string {
    return TestBed.runInInjectionContext(() =>
      new CustomDatePipe().transform(date, "shortDate"),
    );
  }

  beforeEach(() => TestBed.configureTestingModule({}));

  function renderOfRecord(value: DateRangeValue, anonymized: boolean) {
    const entity = new DisplayDateRangeTestEntity();
    entity.anonymized = anonymized;
    const fixture = TestBed.createComponent(DisplayDateRangeComponent);
    fixture.componentRef.setInput("entity", entity);
    fixture.componentRef.setInput("id", "period");
    fixture.componentRef.setInput("value", value);
    fixture.detectChanges();
    return {
      text: fixture.nativeElement.textContent.replace(/\s+/g, " ").trim(),
      hasWarning: !!fixture.nativeElement.querySelector("app-fa-dynamic-icon"),
    };
  }

  it.each([
    [
      "both dates",
      { start, end },
      () => `${formatted(start)} - ${formatted(end)}`,
    ],
    ["only a start date", { start }, () => `from ${formatted(start)}`],
    ["only an end date", { end }, () => `until ${formatted(end)}`],
    ["no value", undefined, () => ""],
  ])("should show %s", (_, value, expected) => {
    expect(render(value)).toBe(expected());
  });

  it.each([
    [
      "both dates",
      { start: new Date(2026, 6, 1), end: new Date(2027, 6, 1) },
      "2026 - 2027",
    ],
    ["only a start date", { start: new Date(2026, 6, 1) }, "from 2026"],
    ["only an end date", { end: new Date(2027, 6, 1) }, "until 2027"],
  ])(
    "should show only the years and a warning for an anonymized record: %s",
    (_, value, expected) => {
      expect(renderOfRecord(value, true)).toEqual({
        text: expected,
        hasWarning: true,
      });
    },
  );

  it("should show the dates without a warning for a record that is not anonymized", () => {
    const result = renderOfRecord({ start, end }, false);

    expect(result.text).toBe(`${formatted(start)} - ${formatted(end)}`);
    expect(result.hasWarning).toBe(false);
  });
});
