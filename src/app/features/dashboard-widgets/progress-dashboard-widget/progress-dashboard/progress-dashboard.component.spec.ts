import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { ProgressDashboardComponent } from "./progress-dashboard.component";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { AlertService } from "../../../../core/alerts/alert.service";
import { ProgressDashboardConfig } from "./progress-dashboard-config";
import { MatDialog } from "@angular/material/dialog";
import { BehaviorSubject, NEVER, Subject } from "rxjs";
import { take } from "rxjs/operators";
import { SessionService } from "../../../../core/session/session-service/session.service";
import { SyncState } from "../../../../core/session/session-states/sync-state.enum";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";

describe("ProgressDashboardComponent", () => {
  let component: ProgressDashboardComponent;
  let fixture: ComponentFixture<ProgressDashboardComponent>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  const mockDialog = jasmine.createSpyObj<MatDialog>("matDialog", ["open"]);
  let mockSession: jasmine.SpyObj<SessionService>;
  let mockSync: BehaviorSubject<SyncState>;

  beforeEach(waitForAsync(() => {
    mockSync = new BehaviorSubject(SyncState.UNSYNCED);
    mockSession = jasmine.createSpyObj([], {
      syncState: mockSync,
      loginState: NEVER,
    });

    TestBed.configureTestingModule({
      imports: [ProgressDashboardComponent, MockedTestingModule.withState()],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: SessionService, useValue: mockSession },
        {
          provide: AlertService,
          useValue: jasmine.createSpyObj(["addDebug", "addInfo", "addWarning"]),
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    mockEntityMapper = TestBed.inject(EntityMapperService) as any;
    spyOn(mockEntityMapper, "load").and.resolveTo({
      title: "test",
      parts: [],
    } as any);
    spyOn(mockEntityMapper, "save").and.resolveTo();
    fixture = TestBed.createComponent(ProgressDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load dashboard config on startup", fakeAsync(() => {
    const configID = "config-id";
    component.dashboardConfigId = configID;
    component.ngOnInit();
    tick();

    expect(mockEntityMapper.load).toHaveBeenCalledWith(
      ProgressDashboardConfig,
      configID,
    );
  }));

  it("should retry loading the config after sync has finished", fakeAsync(() => {
    mockEntityMapper.load.and.rejectWith();
    component.dashboardConfigId = "someId";
    component.ngOnInit();
    tick();

    const config = new ProgressDashboardConfig("someId");
    mockEntityMapper.load.and.resolveTo(config);
    mockSync.next(SyncState.COMPLETED);

    expect(component.data).toEqual(config);
  }));

  it("should create a new progress dashboard config if no configuration could be found after initial sync", fakeAsync(() => {
    mockEntityMapper.load.and.rejectWith();
    mockSync.next(SyncState.COMPLETED);

    component.dashboardConfigId = "config-id";
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
