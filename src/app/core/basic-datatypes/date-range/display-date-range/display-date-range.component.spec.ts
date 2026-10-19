import { TestBed } from "@angular/core/testing";
import { CustomDatePipe } from "../../date/custom-date.pipe";
import { DateRangeValue } from "../date-range.datatype";
import { DisplayDateRangeComponent } from "./display-date-range.component";

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
});
