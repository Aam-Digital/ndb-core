import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DateRangeFilterComponent } from "./date-range-filter.component";
import { MatDialog } from "@angular/material/dialog";
import { MatNativeDateModule } from "@angular/material/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { defaultDateFilters } from "./date-range-filter-panel/date-range-filter-panel.component";
import moment from "moment";
import { DateFilter } from "../../../filter/filters/dateFilter";

describe("DateRangeFilterComponent", () => {
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

  it("should set the correct date filter when a new option is selected", () => {
    const dateFilter = new DateFilter("test", "Test", defaultDateFilters);

    dateFilter.selectedOptionValues = ["9"];
    component.filterConfig = dateFilter;
    expect(component.dateFilter.getFilter()).toEqual({});

    jasmine.clock().mockDate(moment("2023-05-18").toDate());
    dateFilter.selectedOptionValues = ["0"];
    component.filterConfig = dateFilter;
    let expectedDataFilter = {
      test: {
        $gte: "2023-05-18",
        $lte: "2023-05-18",
      },
    };
    expect(component.dateFilter.getFilter()).toEqual(expectedDataFilter);

    dateFilter.selectedOptionValues = ["1"];
    component.filterConfig = dateFilter;
    expectedDataFilter = {
      test: {
        $gte: "2023-05-14",
        $lte: "2023-05-20",
      },
    };
    expect(component.dateFilter.getFilter()).toEqual(expectedDataFilter);

    dateFilter.selectedOptionValues = [];
    component.filterConfig = dateFilter;
    expect(component.dateFilter.getFilter()).toEqual({});
    jasmine.clock().uninstall();
  });

  it("should set the correct date filter when inputting a specific date range via the URL", () => {
    let dateFilter = new DateFilter("test", "test", []);

    dateFilter.selectedOptionValues = ["1_2_3"];
    component.filterConfig = dateFilter;
    expect(component.dateFilter.getFilter()).toEqual({});

    dateFilter.selectedOptionValues = [];
    component.filterConfig = dateFilter;
    expect(component.dateFilter.getFilter()).toEqual({});

    dateFilter.selectedOptionValues = ["2022-9-18", ""];
    component.filterConfig = dateFilter;
    let testFilter: { $gte?: string; $lte?: string } = { $gte: "2022-09-18" };
    let expectedDateFilter = {
      test: testFilter,
    };
    expect(component.dateFilter.getFilter()).toEqual(expectedDateFilter);

    dateFilter.selectedOptionValues = ["", "2023-01-3"];
    component.filterConfig = dateFilter;
    testFilter = { $lte: "2023-01-03" };
    expectedDateFilter = {
      test: testFilter,
    };
    expect(component.dateFilter.getFilter()).toEqual(expectedDateFilter);

    dateFilter.selectedOptionValues = ["2022-9-18", "2023-01-3"];
    component.filterConfig = dateFilter;
    testFilter = {
      $gte: "2022-09-18",
      $lte: "2023-01-03",
    };
    expectedDateFilter = {
      test: testFilter,
    };
    expect(component.dateFilter.getFilter()).toEqual(expectedDateFilter);
  });

  it("should set the correct date filter when changing the date range manually", () => {
    component.filterConfig = new DateFilter("test", "test", []);
    component.fromDate = moment("2021-10-28").toDate();
    component.toDate = moment("2024-02-12").toDate();

    component.dateChangedManually();

    expect(component.dateFilter.selectedOptionValues).toEqual([
      "2021-10-28",
      "2024-02-12",
    ]);
    let expectedDataFilter = {
      test: {
        $gte: "2021-10-28",
        $lte: "2024-02-12",
      },
    };
    expect(component.dateFilter.getFilter()).toEqual(expectedDataFilter);
  });
});
