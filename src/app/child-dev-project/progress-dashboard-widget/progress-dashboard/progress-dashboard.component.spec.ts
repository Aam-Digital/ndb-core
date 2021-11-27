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
import { SessionService } from "../../../core/session/session-service/session.service";
import { BehaviorSubject } from "rxjs";
import { SyncState } from "../../../core/session/session-states/sync-state.enum";

describe("ProgressDashboardComponent", () => {
  let component: ProgressDashboardComponent;
  let fixture: ComponentFixture<ProgressDashboardComponent>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockSyncState: BehaviorSubject<SyncState>;

  beforeEach(
    waitForAsync(() => {
      mockEntityMapper = jasmine.createSpyObj("mockEntityService", [
        "load",
        "save",
      ]);
      mockEntityMapper.load.and.resolveTo({ title: "test", parts: [] } as any);
      mockSyncState = new BehaviorSubject<SyncState>(SyncState.UNSYNCED);
      const mockSession = jasmine.createSpyObj<SessionService>([], {
        syncState: mockSyncState,
      });

      TestBed.configureTestingModule({
        imports: [ProgressDashboardWidgetModule, FontAwesomeTestingModule],
        providers: [
          { provide: EntityMapperService, useValue: mockEntityMapper },
          { provide: SessionService, useValue: mockSession },
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

  it("should retry loading the dashboard config after the sync is completed", fakeAsync(() => {
    const configID = "config-id";
    component.onInitFromDynamicConfig({ dashboardConfigId: configID });
    mockEntityMapper.load.and.returnValues(
      Promise.reject(),
      Promise.resolve(new ProgressDashboardConfig())
    );
    component.ngOnInit();
    tick();

    mockEntityMapper.load.calls.reset();
    mockSyncState.next(SyncState.STARTED);
    tick();

    expect(mockEntityMapper.load).not.toHaveBeenCalled();
    mockSyncState.next(SyncState.COMPLETED);
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
    mockSyncState.next(SyncState.COMPLETED);
    tick();

    expect(mockEntityMapper.save).toHaveBeenCalledWith(component.data);
  }));
});
