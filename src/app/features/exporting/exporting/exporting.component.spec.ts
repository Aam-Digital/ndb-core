import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ExportingComponent } from "./exporting.component";
import { ExportingModule } from "../exporting.module";
import { ExportService } from "../../../core/export/export-service/export.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { RouterTestingModule } from "@angular/router/testing";
import { ReportingComponentConfig } from "../../reporting/reporting/reporting-component-config";
import { RouteData } from "../../../core/view/dynamic-routing/view-config.interface";
import { MatNativeDateModule } from "@angular/material/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Angulartics2RouterlessModule } from "angulartics2/routerlessmodule";

describe("ExportingComponent", () => {
  let component: ExportingComponent;
  let fixture: ComponentFixture<ExportingComponent>;
  let mockExportService: jasmine.SpyObj<ExportService>;
  const config: RouteData<ReportingComponentConfig> = {
    config: { reports: [{ title: "Title", aggregationDefinitions: [] }] },
  };

  beforeEach(async () => {
    mockExportService = jasmine.createSpyObj(["runExportQuery"]);
    await TestBed.configureTestingModule({
      declarations: [ExportingComponent],
      imports: [
        ExportingModule,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
        MatNativeDateModule,
        RouterTestingModule,
        Angulartics2RouterlessModule.forRoot(),
      ],
      providers: [
        { provide: ExportService, useValue: mockExportService },
        {
          provide: ActivatedRoute,
          useValue: { data: new BehaviorSubject(config) },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should init the reports from the route data", () => {
    expect(component.availableReports).toBe(config.config.reports);
  });

  it("should render the result of the export service in the mat table", async () => {
    const data = [
      { First: 1, Second: 2 },
      { First: 3, Second: 4 },
    ];
    mockExportService.runExportQuery.and.resolveTo(data);
    const from = new Date();
    const to = new Date();

    await component.createExport(config.config.reports[0], from, to);

    expect(mockExportService.runExportQuery).toHaveBeenCalledWith(
      undefined,
      config.config.reports[0].aggregationDefinitions,
      from,
      to
    );
    expect(component.dataSource.data).toEqual(data);
    expect(component.columns).toEqual(["First", "Second"]);
  });
});
