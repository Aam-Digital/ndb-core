import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  calculateDateRange,
  DateRangeFilterPanelComponent,
  defaultDateFilters,
} from "./date-range-filter-panel.component";
import { MatNativeDateModule } from "@angular/material/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { HarnessLoader } from "@angular/cdk/testing";
import { DateRange } from "@angular/material/datepicker";
import { MatCalendarHarness } from "@angular/material/datepicker/testing";
import moment from "moment";

import { DateFilter } from "../../../../filter/filters/dateFilter";

describe("DateRangeFilterPanelComponent", () => {
  let component: DateRangeFilterPanelComponent;
  let fixture: ComponentFixture<DateRangeFilterPanelComponent>;
  let loader: HarnessLoader;
  let dateFilter: DateFilter<any>;

  beforeEach(async () => {
    dateFilter = new DateFilter("test", "Test", defaultDateFilters);
    dateFilter.selectedOptionsKeys = ["1"];
    jasmine.clock().mockDate(moment("2023-04-08").toDate());
    await TestBed.configureTestingModule({
      imports: [MatNativeDateModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dateFilter },
        { provide: MatDialogRef, useValue: { close: () => undefined } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DateRangeFilterPanelComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => jasmine.clock().uninstall());

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should highlight the currently selected option", () => {
    expect(component.selectedOption).toEqual(defaultDateFilters[1]);
  });

  it("should display selected dates in the calendar", async () => {
    const fromDate = moment().startOf("month");
    const toDate = moment().startOf("month").add(13, "days");
    component.selectedRangeValue = new DateRange(
      fromDate.toDate(),
      toDate.toDate(),
    );
    fixture.detectChanges();
    const calendar = await loader.getHarness(MatCalendarHarness);
    const cells = await calendar.getCells();
    for (let i = 0; i < cells.length; i++) {
      if (i <= 13) {
        await expectAsync(cells[i].isInRange()).toBeResolvedTo(true);
      } else {
        await expectAsync(cells[i].isInRange()).toBeResolvedTo(false);
      }
    }
  });

  it("should set the manually selected dates", async () => {
    const calendar = await loader.getHarness(MatCalendarHarness);
    const cells = await calendar.getCells();
    await cells[7].select();
    await cells[12].select();

    const filterRange = dateFilter.getDateRange();
    expect(filterRange.start).toEqual(moment("2023-04-08").toDate());
    expect(filterRange.end).toEqual(moment("2023-04-13").toDate());
  });

  it("should set the dates selected via the preset options", async () => {
    component.selectRangeAndClose(0);

    const filterRange = dateFilter.getDateRange();
    expect(filterRange.start).toEqual(
      moment("2023-04-08").startOf("day").toDate(),
    );
    expect(filterRange.end).toEqual(moment("2023-04-08").endOf("day").toDate());
    expect(dateFilter.selectedOptionsKeys).toEqual(["0"]);
  });

  it("should highlight the date range when hovering over a option", async () => {
    const calendar = await loader.getHarness(MatCalendarHarness);
    const cells = await calendar.getCells();
    component.preselectRange({
      endOffsets: [{ amount: 1, unit: "months" }],
      label: "This and the coming month",
    });
    const currentDayOfMonth = new Date().getDate();
    for (let i = 0; i < cells.length; i++) {
      if (i < currentDayOfMonth - 1) {
        await expectAsync(cells[i].isInComparisonRange()).toBeResolvedTo(false);
      } else {
        await expectAsync(cells[i].isInComparisonRange()).toBeResolvedTo(true);
      }
    }
  });

  it("should highlight the whole month when hovering over the 'all' option ", async () => {
    const calendar = await loader.getHarness(MatCalendarHarness);
    const cells = await calendar.getCells();
    component.preselectAllRange();
    for (let cell of cells) {
      await expectAsync(cell.isInComparisonRange()).toBeResolvedTo(true);
    }
  });

  it("should return empty array as filter.selectedOption when 'all' option has been chosen", async () => {
    component.selectRangeAndClose("all");
    expect(dateFilter.selectedOptionsKeys).toEqual([]);
  });

  it("should correctly calculate date ranges based on the config", () => {
    let res = calculateDateRange({ label: "Today" });
    let fromDate = moment().startOf("day").toDate();
    let toDate = moment().endOf("day").toDate();
    expect(res).toEqual(new DateRange(fromDate, toDate));

    let mockedToday = moment("2023-06-08").toDate();
    jasmine.clock().mockDate(mockedToday);

    res = calculateDateRange({
      startOffsets: [{ amount: 0, unit: "weeks" }],
      endOffsets: [{ amount: 0, unit: "weeks" }],
      label: "This week",
    });
    fromDate = moment("2023-06-04").startOf("day").toDate();
    toDate = moment("2023-06-10").endOf("day").toDate();
    expect(res).toEqual(new DateRange(fromDate, toDate));

    res = calculateDateRange({
      startOffsets: [{ amount: 1, unit: "weeks" }],
      endOffsets: [{ amount: 1, unit: "weeks" }],
      label: "Next week",
    });
    fromDate = moment("2023-06-11").startOf("day").toDate();
    toDate = moment("2023-06-17").endOf("day").toDate();
    expect(res).toEqual(new DateRange(fromDate, toDate));

    res = calculateDateRange({
      endOffsets: [
        { amount: -2, unit: "week" },
        { amount: 3, unit: "months" },
      ],
      label:
        "From today until endOf(today minus 2 weeks) and then endOf(this date plus 3 months)",
    });
    fromDate = moment("2023-06-08").startOf("day").toDate();
    toDate = moment("2023-08-26").endOf("day").toDate();
    expect(res).toEqual(new DateRange(fromDate, toDate));

    res = calculateDateRange({
      endOffsets: [
        { amount: 3, unit: "months" },
        { amount: -2, unit: "week" },
      ],
      label:
        "From today until endOf(today minus 2 weeks) and then endOf(this date plus 3 months)",
    });
    fromDate = moment("2023-06-08").startOf("day").toDate();
    toDate = moment("2023-08-31").endOf("day").toDate();
    expect(res).toEqual(new DateRange(fromDate, toDate));
  });
});
