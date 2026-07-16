import { ComponentFixture, TestBed } from "@angular/core/testing";

import { provideNativeDateAdapter } from "@angular/material/core";
import { MatDialog } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { Angulartics2Module } from "angulartics2";
import { SelectReportComponent } from "./select-report.component";
import { ReportEntity } from "../../report-config";

describe("SelectReportComponent", () => {
  let component: SelectReportComponent;
  let fixture: ComponentFixture<SelectReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SelectReportComponent,
        Angulartics2Module.forRoot(),
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: MatDialog, useValue: { open: vi.fn() } },
        provideNativeDateAdapter(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should select the first report if only one exists", () => {
    const report = new ReportEntity();
    fixture.componentRef.setInput("reports", [report]);
    fixture.detectChanges();

    expect(component.selectedReport()).toBe(report);
  });

  it("should display date range filter for a non-sql report", () => {
    const report = new ReportEntity();
    report.mode = "reporting";
    report.reportDefinition = [{ query: "Child:toArray[*isActive=true]" }];
    fixture.componentRef.setInput("reports", [report]);
    fixture.detectChanges();

    expect(component.selectedReport()).toBe(report);
    expect(component.isDateRangeReport()).toBe(true);
  });

  it("should hide date range filter for a sql report without date placeholders", () => {
    const report = new ReportEntity();
    report.mode = "sql";
    report.reportDefinition = [{ query: "SELECT name FROM Child" }];
    fixture.componentRef.setInput("reports", [report]);
    fixture.detectChanges();

    expect(component.isDateRangeReport()).toBe(false);
  });

  it("should display date range filter when a sql query uses $startDate/$endDate", () => {
    const report = new ReportEntity();
    report.mode = "sql";
    report.reportDefinition = [
      { query: "SELECT * FROM Child WHERE d BETWEEN $startDate AND $endDate" },
    ];
    fixture.componentRef.setInput("reports", [report]);
    fixture.detectChanges();

    expect(component.isDateRangeReport()).toBe(true);
  });

  it("should display date range filter when sql report supports it", () => {
    const report = new ReportEntity();
    report.mode = "sql";
    report.neededArgs = ["from", "to"];
    fixture.componentRef.setInput("reports", [report]);
    fixture.detectChanges();

    expect(component.selectedReport()).toBe(report);
    expect(component.isDateRangeReport()).toBe(true);
  });

  it("should hide date range filter when sql report does not have these args", () => {
    const report = new ReportEntity();
    report.mode = "sql";
    fixture.componentRef.setInput("reports", [report]);
    fixture.detectChanges();

    expect(component.selectedReport()).toBe(report);
    expect(component.isDateRangeReport()).toBe(false);
  });

  it("should reset dates before calculation when sql report is not a DateRangeReport", () => {
    const report = new ReportEntity();
    report.mode = "sql";
    fixture.componentRef.setInput("reports", [report]);
    fixture.detectChanges();
    component.fromDate.set(new Date());
    component.toDate.set(new Date());

    component.calculate();

    expect(component.selectedReport()).toBe(report);
    expect(component.isDateRangeReport()).toBe(false);
    expect(component.fromDate()).toBeUndefined();
    expect(component.toDate()).toBeUndefined();
  });

  it("should not reset dates before calculation when sql report is a DateRangeReport", () => {
    const report = new ReportEntity();
    report.mode = "sql";
    fixture.componentRef.setInput("reports", [report]);
    report.neededArgs = ["from", "to"];
    fixture.detectChanges();
    component.fromDate.set(new Date());
    component.toDate.set(new Date());

    component.calculate();

    expect(component.selectedReport()).toBe(report);
    expect(component.isDateRangeReport()).toBe(true);
    expect(component.fromDate()).toBeDefined();
    expect(component.toDate()).toBeDefined();
  });
});
