import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { ProgressDashboardComponent } from "./progress-dashboard.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { AlertService } from "../../../core/alerts/alert.service";
import { ProgressDashboardWidgetModule } from "../progress-dashboard-widget.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ProgressDashboardConfig } from "./progress-dashboard-config";
import { MatDialog } from "@angular/material/dialog";
import { Subject } from "rxjs";
import { take } from "rxjs/operators";

describe("ProgressDashboardComponent", () => {
  let component: ProgressDashboardComponent;
  let fixture: ComponentFixture<ProgressDashboardComponent>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  const mockDialog = jasmine.createSpyObj<MatDialog>("matDialog", ["open"]);

  beforeEach(
    waitForAsync(() => {
      mockEntityMapper = jasmine.createSpyObj("mockEntityService", [
        "load",
        "save",
      ]);
      mockEntityMapper.load.and.resolveTo({ title: "test", parts: [] } as any);
      mockEntityMapper.save.and.resolveTo();

      TestBed.configureTestingModule({
        imports: [ProgressDashboardWidgetModule, FontAwesomeTestingModule],
        providers: [
          { provide: EntityMapperService, useValue: mockEntityMapper },
          { provide: MatDialog, useValue: mockDialog },
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

  it("should load dashboard config on startup", fakeAsync(() => {
    const configID = "config-id";
    component.onInitFromDynamicConfig({ dashboardConfigId: configID });
    component.ngOnInit();
    tick();

    expect(mockEntityMapper.load).toHaveBeenCalledWith(
      ProgressDashboardConfig,
      configID
    );
  }));

  it("should create a new progress dashboard config if no configuration could be found", fakeAsync(() => {
    mockEntityMapper.load.and.rejectWith({ status: 404 });
    const configID = "config-id";

    component.onInitFromDynamicConfig({ dashboardConfigId: configID });
    component.ngOnInit();
    tick();

    expect(mockEntityMapper.save).toHaveBeenCalledWith(component.data);
  }));

  it("saves data after the dialog was closed", fakeAsync(() => {
    const closeNotifier = new Subject();
    mockDialog.open.and.returnValue({
      afterClosed: () => closeNotifier.pipe(take(1)),
    } as any);
    component.showEditComponent();
    closeNotifier.next({});
    expect(mockEntityMapper.save).toHaveBeenCalled();
  }));
});
