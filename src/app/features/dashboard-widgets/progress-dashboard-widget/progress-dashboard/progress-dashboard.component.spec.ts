import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ProgressDashboardComponent } from "./progress-dashboard.component";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { AlertService } from "../../../../core/alerts/alert.service";
import { ProgressDashboardConfig } from "./progress-dashboard-config";
import { MatDialog } from "@angular/material/dialog";
import { Observable, Subject } from "rxjs";
import { take } from "rxjs/operators";
import { SyncState } from "../../../../core/session/session-states/sync-state.enum";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { SyncStateSubject } from "../../../../core/session/session-type";
import type { Mock } from "vitest";

type MatDialogMock = {
  open: Mock;
};

type EntityMapperMock = Pick<EntityMapperService, "load" | "save">;

type DialogRefMock = {
  afterClosed: () => Observable<unknown>;
};

describe("ProgressDashboardComponent", () => {
  let component: ProgressDashboardComponent;
  let fixture: ComponentFixture<ProgressDashboardComponent>;
  let mockEntityMapper: EntityMapperMock;
  let loadSpy: ReturnType<typeof vi.spyOn>;
  const mockDialog: MatDialogMock = {
    open: vi.fn().mockName("matDialog.open"),
  };
  let mockSync: SyncStateSubject;

  beforeEach(waitForAsync(() => {
    mockSync = new SyncStateSubject();

    TestBed.configureTestingModule({
      imports: [ProgressDashboardComponent, MockedTestingModule.withState()],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: SyncStateSubject, useValue: mockSync },
        {
          provide: AlertService,
          useValue: {
            addDebug: vi.fn(),
            addInfo: vi.fn(),
            addWarning: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    mockEntityMapper = TestBed.inject(EntityMapperService);
    loadSpy = vi.spyOn(mockEntityMapper, "load").mockResolvedValue({
      title: "test",
      parts: [],
    } as ProgressDashboardConfig);
    vi.spyOn(mockEntityMapper, "save").mockResolvedValue(undefined);
    fixture = TestBed.createComponent(ProgressDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load dashboard config on startup", async () => {
    vi.useFakeTimers();
    try {
      const configID = "config-id";
      component.dashboardConfigId = configID;
      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockEntityMapper.load).toHaveBeenCalledWith(
        ProgressDashboardConfig,
        configID,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should retry loading the config after sync has finished", async () => {
    vi.useFakeTimers();
    try {
      loadSpy.mockRejectedValue(new Error());
      component.dashboardConfigId = "someId";
      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(0);

      const config = new ProgressDashboardConfig("someId");
      loadSpy.mockResolvedValue(config);
      mockSync.next(SyncState.COMPLETED);

      expect(component.data).toEqual(config);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should create a new progress dashboard config if no configuration could be found after initial sync", async () => {
    vi.useFakeTimers();
    try {
      loadSpy.mockRejectedValue(new Error());
      mockSync.next(SyncState.COMPLETED);

      component.dashboardConfigId = "config-id";
      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockEntityMapper.save).toHaveBeenCalledWith(component.data);
    } finally {
      vi.useRealTimers();
    }
  });

  it("saves data after the dialog was closed", async () => {
    const closeNotifier = new Subject<unknown>();
    mockDialog.open.mockReturnValue({
      afterClosed: () => closeNotifier.pipe(take(1)),
    } satisfies DialogRefMock);
    component.showEditComponent();
    closeNotifier.next({});
    expect(mockEntityMapper.save).toHaveBeenCalled();
  });
});
