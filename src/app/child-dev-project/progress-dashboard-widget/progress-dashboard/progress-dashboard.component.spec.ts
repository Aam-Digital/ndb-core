import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ProgressDashboardComponent } from "./progress-dashboard.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { AlertService } from "../../../core/alerts/alert.service";
import { ProgressDashboardWidgetModule } from "../progress-dashboard-widget.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ProgressDashboardComponent", () => {
  let component: ProgressDashboardComponent;
  let fixture: ComponentFixture<ProgressDashboardComponent>;

  beforeEach(
    waitForAsync(() => {
      const mockEntityService = jasmine.createSpyObj("mockEntityService", [
        "load",
        "save",
      ]);
      mockEntityService.load.and.resolveTo({ title: "test", parts: [] });

      TestBed.configureTestingModule({
        imports: [ProgressDashboardWidgetModule, FontAwesomeTestingModule],
        providers: [
          { provide: EntityMapperService, useValue: mockEntityService },
          {
            provide: AlertService,
            useValue: jasmine.createSpyObj([
              "addDebug",
              "addInfo",
              "addWarning",
            ]),
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
