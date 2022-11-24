const customPresets = [
  "today",
  "last 7 days",
  "this week",
  "this month",
  "this year",
  "last week",
  "last month",
  "last year",
] as const;

// equivalent to "today" | "last 7 days" | … | "last year"
type CustomPreset = typeof customPresets[number];

import { Component } from "@angular/core";
import { DateAdapter } from "@angular/material/core";
import { MatDateRangePicker } from "@angular/material/datepicker";

@Component({
  selector: "app-daterange-panel",
  templateUrl: "./daterange-panel.component.html",
  styleUrls: ["./daterange-panel.component.scss"],
})
export class DaterangePanelComponent<D> {
  // list of range presets we want to provide:
  readonly customPresets = customPresets;

  constructor(
    private dateAdapter: DateAdapter<D>,
    private picker: MatDateRangePicker<D>
  ) {}

  private calculateDateRange(rangeName: CustomPreset): [start: D, end: D] {
    const today = this.today;
    const year = this.dateAdapter.getYear(today);

    switch (rangeName) {
      case "today":
        return [today, today];
      case "last 7 days": {
        const start = this.dateAdapter.addCalendarDays(today, -6);
        return [start, today];
      }
      case "this year": {
        const start = this.dateAdapter.createDate(year, 0, 1);
        const end = this.dateAdapter.createDate(year, 11, 31);
        return [start, end];
      }
      // ...
      // all other cases
      // ...
      // default:
      //   return rangeName; // exhaustiveness check
    }
  }

  private get today(): D {
    const today = this.dateAdapter.getValidDateOrNull(new Date());
    if (today === null) {
      throw new Error("date creation failed");
    }
    return today;
  }

  // called when user selects a range preset:
  selectRange(rangeName: CustomPreset): void {
    const [start, end] = this.calculateDateRange(rangeName);
    this.picker.select(start);
    this.picker.select(end);
    // this.picker.close();
  }
}
