import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DateRangeFilterComponent } from "./date-range-filter.component";
import { MatDialog } from "@angular/material/dialog";
import { MatNativeDateModule } from "@angular/material/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DateFilter, Filter } from "../filters/filters";
import { DateRangeFilterConfigOption } from "app/core/entity-components/entity-list/EntityListConfig";
import moment from "moment";
import { DateRange } from "@angular/material/datepicker";

fdescribe("DateRangeFilterComponent", () => {
  let component: DateRangeFilterComponent<any>;
  let fixture: ComponentFixture<DateRangeFilterComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatNativeDateModule, NoopAnimationsModule],
      providers: [{ provide: MatDialog, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(DateRangeFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set the correct date filter when inputting one of the defined standard date ranges", () => {
    const standardOptions: DateRangeFilterConfigOption[] = [
      {
        startOffsets: [{ amount: 0, unit: "weeks" }],
        endOffsets: [{ amount: 0, unit: "weeks" }],
        label: $localize`:Filter label:This week`,
      },
      {
        startOffsets: [{ amount: 1, unit: "months" }],
        endOffsets: [{ amount: -1, unit: "months" }],
        label: $localize`:Filter label:Last month`,
      },
    ];
    let dateFilter = new DateFilter("test1", "test1", standardOptions);

    dateFilter.selectedOption = "9";
    component.dateRangeFilterConfig = dateFilter;
    expect(component._dateFilter.filter).toBe(undefined);

    let mockedToday = moment("2023-05-18").toDate();
    jasmine.clock().mockDate(mockedToday);
    dateFilter.selectedOption = "0";
    component.dateRangeFilterConfig = dateFilter;
    let expectedDataFilter = {
      ["test1"]: {
        $gte: "2023-05-14",
        $lte: "2023-05-20",
      },
    };
    expect(component._dateFilter.filter).toEqual(expectedDataFilter);

    mockedToday = moment("2023-01-05").toDate();
    jasmine.clock().mockDate(mockedToday);
    dateFilter.selectedOption = "1";
    component.dateRangeFilterConfig = dateFilter;
    expectedDataFilter = {
      ["test1"]: {
        $gte: "2022-12-01",
        $lte: "2022-12-31",
      },
    };
    expect(component._dateFilter.filter).toEqual(expectedDataFilter);
  });

  it("should set the correct date filter when inputting a specific date range", () => {
    let dateFilter = new DateFilter(
      "test1",
      "test1",
      new Array<DateRangeFilterConfigOption>()
    );

    dateFilter.selectedOption = "1_2_3";
    component.dateRangeFilterConfig = dateFilter;
    expect(component._dateFilter.filter).toBe(undefined);

    dateFilter.selectedOption = "a2_1";
    component.dateRangeFilterConfig = dateFilter;
    expect(component._dateFilter.filter).toBe(undefined);

    dateFilter.selectedOption = "2022-9-18_2023-01-3";
    component.dateRangeFilterConfig = dateFilter;
    let expectedDataFilter = {
      ["test1"]: {
        $gte: "2022-09-18",
        $lte: "2023-01-03",
      },
    };
    expect(component._dateFilter.filter).toEqual(expectedDataFilter);
  });

  it("should set the correct date filter when changing the date range manually", () => {
    component.dateRangeFilterConfig = new DateFilter(
      "test1",
      "test1",
      new Array<DateRangeFilterConfigOption>()
    );
    component.fromDate = new Date("2021-10-28");
    component.toDate = new Date("2024-02-12");
    component.dateChangedManually();
    expect(component._dateFilter.selectedOption).toEqual(
      "2021-10-28_2024-02-12"
    );
    let expectedDataFilter = {
      ["test1"]: {
        $gte: "2021-10-28",
        $lte: "2024-02-12",
      },
    };
    expect(component._dateFilter.filter).toEqual(expectedDataFilter);
  });

  it("should set the correct date filter according to the result of the date range panel dialogue when a date range is chosen", () => {
    component.dateRangeFilterConfig = new DateFilter(
      "test1",
      "test1",
      new Array<DateRangeFilterConfigOption>()
    );
    component.assignDateRangePanelResult({
      selectedRangeValue: new DateRange(
        new Date("2022-12-31"),
        new Date("2023-01-02")
      ),
      selectedIndexOfDateRanges: "1",
    });
    let expectedDataFilter = {
      ["test1"]: {
        $gte: "2022-12-31",
        $lte: "2023-01-02",
      },
    };
    expect(component._dateFilter.filter).toEqual(expectedDataFilter);
    expect(component._dateFilter.selectedOption).toEqual("1");
  });

  // it("should set the correct date filter according to the result of the date range panel dialogue when one the predefined standard date ranges is selected", () => {
  //   component.assignDateRangePanelResult(XXX);
  //   expect(component._dateFilter.filter).toEqual(XXX);
  //   expect(component._dateFilter.filter).toEqual(XXX);
  // });

  // it("should set the correct date filter according to the result of the date range panel dialogue when the dialogue is cancelled", () => {
  //   component.assignDateRangePanelResult(XXX);
  //   expect(component._dateFilter.filter).toEqual(XXX);
  // });
});
