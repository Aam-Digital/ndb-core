import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  DateRangeFilterPanelComponent,
  calculateDateRange,
} from "./date-range-filter-panel.component";
import { MatNativeDateModule } from "@angular/material/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { HarnessLoader } from "@angular/cdk/testing";
import { DateRange } from "@angular/material/datepicker";
import { MatCalendarHarness } from "@angular/material/datepicker/testing";
import moment from "moment";

fdescribe("DateRangeFilterPanelComponent", () => {
  let component: DateRangeFilterPanelComponent;
  let fixture: ComponentFixture<DateRangeFilterPanelComponent>;
  let loader: HarnessLoader;
  let closeSpy: jasmine.Spy;

  beforeEach(async () => {
    closeSpy = jasmine.createSpy();
    let mockedToday = moment("2023-04-08").toDate();
    jasmine.clock().mockDate(mockedToday);
    await TestBed.configureTestingModule({
      imports: [MatNativeDateModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            fromDate: moment("2023-05-01").startOf("day").toDate(),
            toDate: moment("2023-05-31").endOf("day").toDate(),
            standardDateRanges: [
              {
                startOffsets: [{ amount: -1, unit: "weeks" }],
                endOffsets: [{ amount: -1, unit: "weeks" }],
                label: $localize`:Filter label:Last week`,
              },
              {
                startOffsets: [{ amount: 1, unit: "months" }],
                endOffsets: [{ amount: 1, unit: "months" }],
                label: $localize`:Filter label:Next month`,
              },
            ],
          },
        },
        { provide: MatDialogRef, useValue: { close: closeSpy } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DateRangeFilterPanelComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should highlight the standard date range corresponding to the inputtet date", () => {
    expect(component.indexOfCorrespondingDateRange).toEqual(1);
  });

  it("should display the given dates in the calendar", async () => {
    const fromDate = moment().startOf("month");
    const toDate = moment().startOf("month").add(13, "days");
    component.selectedRangeValue = new DateRange(
      fromDate.toDate(),
      toDate.toDate()
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

  it("should return the manually selected dates", async () => {
    const calendar = await loader.getHarness(MatCalendarHarness);
    const cells = await calendar.getCells();
    await cells[7].select();
    await cells[12].select();
    const fromDate = new Date();
    const toDate = new Date();
    fromDate.setDate(8);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setDate(13);
    toDate.setHours(0, 0, 0, 0);
    let dateRange = new DateRange(fromDate, toDate);
    expect(closeSpy).toHaveBeenCalledWith({ selectedRangeValue: dateRange });
  });

  it("should return the dates selected via the preset labels", async () => {
    component.preselectRange({
      startOffsets: [{ amount: -1, unit: "months" }],
      endOffsets: [{ amount: 0, unit: "months" }],
      label: "Last and this month",
    });
    component.selectRangeAndClose(0);
    const fromDate = moment().startOf("month").subtract(1, "months").toDate();
    const toDate = moment().endOf("month").toDate();
    let dateRange = new DateRange(fromDate, toDate);
    expect(closeSpy).toHaveBeenCalledWith({
      selectedRangeValue: dateRange,
      selectedIndexOfDateRanges: "0",
    });
  });

  it("should highlight the daterange when hovering over a preset label", async () => {
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

  it("should correctly calculate date ranges for simple DateRangeFilterConfigOption inputs", () => {
    let res = calculateDateRange({
      label: $localize`:Filter label:Today`,
    });
    let fromDate = moment().startOf("day").toDate();
    let toDate = moment().endOf("day").toDate();
    expect(res).toEqual(new DateRange(fromDate, toDate));

    let mockedToday = moment("2023-06-08").toDate();
    jasmine.clock().mockDate(mockedToday);

    res = calculateDateRange({
      startOffsets: [{ amount: 0, unit: "weeks" }],
      endOffsets: [{ amount: 0, unit: "weeks" }],
      label: $localize`:Filter label:This week`,
    });
    fromDate = moment("2023-06-04").startOf("day").toDate();
    toDate = moment("2023-06-10").endOf("day").toDate();
    expect(res).toEqual(new DateRange(fromDate, toDate));

    res = calculateDateRange({
      startOffsets: [{ amount: 1, unit: "weeks" }],
      endOffsets: [{ amount: 1, unit: "weeks" }],
      label: $localize`:Filter label:Next week`,
    });
    fromDate = moment("2023-06-11").startOf("day").toDate();
    toDate = moment("2023-06-17").endOf("day").toDate();
    expect(res).toEqual(new DateRange(fromDate, toDate));
  });

  it("should correctly calculate date ranges for DateRangeFilterConfigOption inputs with several offsets", () => {
    let mockedToday = moment("2023-06-08").toDate();
    jasmine.clock().mockDate(mockedToday);
    let res = calculateDateRange({
      endOffsets: [
        { amount: -2, unit: "week" },
        { amount: 3, unit: "months" },
      ],
      label: $localize`:Filter label:From today until endOf(today minus 2 weeks) and then endOf(this date plus 3 months)`,
    });
    let fromDate = moment("2023-06-08").startOf("day").toDate();
    let toDate = moment("2023-08-26").endOf("day").toDate();
    expect(res).toEqual(new DateRange(fromDate, toDate));

    res = calculateDateRange({
      endOffsets: [
        { amount: 3, unit: "months" },
        { amount: -2, unit: "week" },
      ],
      label: $localize`:Filter label:From today until endOf(today minus 2 weeks) and then endOf(this date plus 3 months)`,
    });
    fromDate = moment("2023-06-08").startOf("day").toDate();
    toDate = moment("2023-08-31").endOf("day").toDate();
    expect(res).toEqual(new DateRange(fromDate, toDate));
  });
});
