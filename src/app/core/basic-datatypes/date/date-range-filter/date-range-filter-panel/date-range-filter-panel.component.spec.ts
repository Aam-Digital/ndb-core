import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  DateRangeFilterPanelComponent,
  defaultDateFilters,
} from "./date-range-filter-panel.component";
import { vi } from "vitest";
import { DateRangeFilterConfigOption } from "../../../../entity-list/EntityListConfig";
import { calculateDateRange } from "./date-range-utils";
import { MatNativeDateModule } from "@angular/material/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { HarnessLoader } from "@angular/cdk/testing";
import { DateRange } from "@angular/material/datepicker";
import { MatCalendarHarness } from "@angular/material/datepicker/testing";
import moment from "moment";
import { EMPTY_FILTER_OPTION_KEY } from "app/core/filter/filters/filters";

import { DateFilter } from "app/core/filter/filters/dateFilter";

describe("DateRangeFilterPanelComponent", () => {
  let component: DateRangeFilterPanelComponent;
  let fixture: ComponentFixture<DateRangeFilterPanelComponent>;
  let loader: HarnessLoader;
  let dateFilter: DateFilter<any>;
  let dialogCloseSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    dateFilter = new DateFilter("test", "Test", defaultDateFilters);
    dateFilter.selectedOptionValues = ["1"];
    vi.useFakeTimers();
    vi.setSystemTime(moment("2023-04-08").toDate());
    await TestBed.configureTestingModule({
      imports: [MatNativeDateModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            selectedOptionValues: dateFilter.selectedOptionValues,
            selectedOption: defaultDateFilters[1],
            dateRange: dateFilter.getDateRange(),
            rangeOptions: defaultDateFilters,
          },
        },
        { provide: MatDialogRef, useValue: { close: (v: any) => undefined } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DateRangeFilterPanelComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    // spy on the injected dialogRef.close
    const dialogRef = TestBed.inject(MatDialogRef) as any;
    dialogCloseSpy = vi.spyOn(dialogRef, "close");
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should highlight the currently selected option", () => {
    expect(component.selectedOption()).toEqual(defaultDateFilters[1]);
  });

  it("should set selected dates on the component", () => {
    const fromDate = moment().startOf("month");
    const toDate = moment().startOf("month").add(13, "days");
    component.selectedRangeValue.set(
      new DateRange(fromDate.toDate(), toDate.toDate()),
    );
    expect(component.selectedRangeValue().start).toEqual(fromDate.toDate());
    expect(component.selectedRangeValue().end).toEqual(toDate.toDate());
  });

  it("should set the manually selected dates", async () => {
    const calendar = await loader.getHarness(MatCalendarHarness);
    const cells = await calendar.getCells();
    await cells[7].select();
    await cells[12].select();
    // component should close the dialog with selectedOptionValues for the selected dates
    expect(dialogCloseSpy).toHaveBeenCalled();
    const calledWith = dialogCloseSpy.mock.calls[0][0];
    expect(calledWith).toHaveProperty("selectedOptionValues");
    expect(calledWith.selectedOptionValues).toEqual([
      moment("2023-04-08").format("YYYY-MM-DD"),
      moment("2023-04-13").format("YYYY-MM-DD"),
    ]);
  });

  it("should set the dates selected via the preset options", async () => {
    component.selectRangeAndClose(0);
    expect(dialogCloseSpy).toHaveBeenCalledWith({
      selectedOptionValues: ["0"],
    });
  });

  it("should set the comparison range when hovering over an option", () => {
    const option: DateRangeFilterConfigOption = {
      endOffsets: [{ amount: 1, unit: "months" }],
      label: "This and the coming month",
    };

    component.preselectRange(option);

    const expectedRange = calculateDateRange(option);
    expect(component.comparisonRange()).toEqual(expectedRange);
  });

  it("should set a full comparison range when hovering over the 'all' option ", () => {
    component.preselectAllRange();

    expect(component.comparisonRange()).toEqual(
      new DateRange(new Date("1900-01-01"), new Date("2999-12-31")),
    );
  });

  it("should return empty array as filter.selectedOption when 'all' option has been chosen", async () => {
    component.selectRangeAndClose("all");
    expect(dialogCloseSpy).toHaveBeenCalledWith({ selectedOptionValues: [] });
  });

  it("should set empty option when selected", () => {
    component.selectRangeAndClose("empty");
    expect(dialogCloseSpy).toHaveBeenCalledWith({
      selectedOptionValues: [EMPTY_FILTER_OPTION_KEY],
    });
  });

  it("should correctly calculate date ranges based on the config", () => {
    let res = calculateDateRange({ label: "Today" });
    let fromDate = moment().startOf("day").toDate();
    let toDate = moment().endOf("day").toDate();
    expect(res).toEqual(new DateRange(fromDate, toDate));

    let mockedToday = moment("2023-06-08").toDate();
    vi.setSystemTime(mockedToday);

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
