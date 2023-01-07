import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SelectReportComponent } from "./select-report.component";

describe("SelectReportComponent", () => {
  let component: SelectReportComponent;
  let fixture: ComponentFixture<SelectReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectReportComponent],
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
    const report = { title: "someReport", aggregationDefinitions: [] };
    component.reports = [report];

    component.ngOnChanges({ reports: undefined });

    expect(component.selectedReport).toBe(report);
  });
});
