import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  waitForAsync,
} from "@angular/core/testing";

import { ProgressDashboardComponent } from "./progress-dashboard.component";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { AlertService } from "../../../core/alerts/alert.service";
import { ProgressDashboardWidgetModule } from "../progress-dashboard-widget.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { MatDialog } from "@angular/material/dialog";
import { Subject } from "rxjs";
import { take } from "rxjs/operators";

describe("ProgressDashboardComponent", () => {
  let component: ProgressDashboardComponent;
  let fixture: ComponentFixture<ProgressDashboardComponent>;
  const mockDialog = jasmine.createSpyObj<MatDialog>("matDialog", ["open"]);
  let mockEntityService: jasmine.SpyObj<any>;

  beforeEach(
    waitForAsync(() => {
      mockEntityService = jasmine.createSpyObj("mockEntityService", [
        "load",
        "save",
      ]);
      mockEntityService.load.and.resolveTo({ title: "test", parts: [] });
      mockEntityService.save.and.resolveTo();

      TestBed.configureTestingModule({
        imports: [ProgressDashboardWidgetModule, FontAwesomeTestingModule],
        providers: [
          { provide: EntityMapperService, useValue: mockEntityService },
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

  it("saves data after the dialog was closed", fakeAsync(() => {
    const closeNotifier = new Subject();
    mockDialog.open.and.returnValue({
      afterClosed: () => closeNotifier.pipe(take(1)),
    } as any);
    component.showEditComponent();
    closeNotifier.next({});
    expect(mockEntityService.save).toHaveBeenCalled();
  }));
});
