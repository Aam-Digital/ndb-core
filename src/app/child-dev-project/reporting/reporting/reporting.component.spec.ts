import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { ReportingComponent } from "./reporting.component";
import { CommonModule } from "@angular/common";
import { ReportingModule } from "../reporting.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Subject } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { ReportingService, ReportRow } from "../reporting.service";
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

  it("should display the report results", fakeAsync(() => {
    const results: ReportRow[] = [
      { header: { label: "test label", result: 1 } },
    ];
    mockReportingService.calculateReport.and.resolveTo(results);
    mockRouteData.next({ aggregationDefinitions: null });
    component.calculateResults();
    tick();
    expect(component.results).toEqual(results);
  }));
});
