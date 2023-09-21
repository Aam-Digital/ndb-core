import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DateRangeFilterComponent } from "./date-range-filter.component";
import { MatDialog } from "@angular/material/dialog";
import { MatNativeDateModule } from "@angular/material/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { DateFilter } from "../../../filter/filters/filters";
import { defaultDateFilters } from "./date-range-filter-panel/date-range-filter-panel.component";

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

    dateFilter.selectedOption = "9";
    component.filterConfig = dateFilter;
    expect(component.dateFilter.getFilter()).toEqual({});

    jasmine.clock().mockDate(new Date("2023-05-18"));
    dateFilter.selectedOption = "0";
    component.filterConfig = dateFilter;
    let expectedDataFilter = {
      test: {
        $gte: "2023-05-18",
        $lte: "2023-05-18",
      },
    };
    expect(component.dateFilter.getFilter()).toEqual(expectedDataFilter);

    dateFilter.selectedOption = "1";
    component.filterConfig = dateFilter;
    expectedDataFilter = {
      test: {
        $gte: "2023-05-14",
        $lte: "2023-05-20",
      },
    };
    expect(component.dateFilter.getFilter()).toEqual(expectedDataFilter);

    dateFilter.selectedOption = "_";
    component.filterConfig = dateFilter;
    expect(component.dateFilter.getFilter()).toEqual({});
    jasmine.clock().uninstall();
  });

  it("should set the correct date filter when inputting a specific date range via the URL", () => {
    let dateFilter = new DateFilter("test", "test", []);

    dateFilter.selectedOption = "1_2_3";
    component.filterConfig = dateFilter;
    expect(component.dateFilter.getFilter()).toEqual({});

    dateFilter.selectedOption = "_";
    component.filterConfig = dateFilter;
    expect(component.dateFilter.getFilter()).toEqual({});

    dateFilter.selectedOption = "2022-9-18_";
    component.filterConfig = dateFilter;
    let testFilter: { $gte?: string; $lte?: string } = { $gte: "2022-09-18" };
    let expectedDateFilter = {
      test: testFilter,
    };
    expect(component.dateFilter.getFilter()).toEqual(expectedDateFilter);

    dateFilter.selectedOption = "_2023-01-3";
    component.filterConfig = dateFilter;
    testFilter = { $lte: "2023-01-03" };
    expectedDateFilter = {
      test: testFilter,
    };
    expect(component.dateFilter.getFilter()).toEqual(expectedDateFilter);

    dateFilter.selectedOption = "2022-9-18_2023-01-3";
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
    component.fromDate = new Date("2021-10-28");
    component.toDate = new Date("2024-02-12");

    component.dateChangedManually();

    expect(component.dateFilter.selectedOption).toEqual(
      "2021-10-28_2024-02-12",
    );
    let expectedDataFilter = {
      test: {
        $gte: "2021-10-28",
        $lte: "2024-02-12",
      },
    };
    expect(component.dateFilter.getFilter()).toEqual(expectedDataFilter);
  });
});
