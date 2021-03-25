import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { ReportingComponent, ReportRow } from "./reporting.component";
import { CommonModule } from "@angular/common";
import { ReportingModule } from "../reporting.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Subject } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { ReportingService } from "../reporting.service";
import { MatNativeDateModule } from "@angular/material/core";

describe("ReportingComponent", () => {
  let component: ReportingComponent;
  let fixture: ComponentFixture<ReportingComponent>;
  const mockRouteData = new Subject();
  let mockReportingService: jasmine.SpyObj<ReportingService>;

  beforeEach(async () => {
    mockReportingService = jasmine.createSpyObj([
      "setAggregations",
      "calculateReport",
    ]);
    await TestBed.configureTestingModule({
      declarations: [ReportingComponent],
      imports: [
        CommonModule,
        ReportingModule,
        NoopAnimationsModule,
        MatNativeDateModule,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { data: mockRouteData } },
        { provide: ReportingService, useValue: mockReportingService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should go to the next step if a config is provided", fakeAsync(() => {
    expect(component.step).toBe(0);
    mockRouteData.next({});
    tick();
    expect(component.step).toBe(1);
  }));

  it("should display the report results", fakeAsync(() => {
    const results: ReportRow[] = [{ label: "test label", result: 1 }];
    mockReportingService.calculateReport.and.resolveTo(results);
    mockRouteData.next({ aggregationDefinitions: null });
    component.calculateResults();
    tick();
    expect(component.results).toEqual(results);
  }));

  it("should go to next step when a date is selected", () => {
    component.step = 1;
    component.fromDate = new Date();
    component.toDate = new Date();
    component.datesSelected();
    expect(component.step).toBe(2);
  });
});
