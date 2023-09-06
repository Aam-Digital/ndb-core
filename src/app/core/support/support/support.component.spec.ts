import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { SupportComponent } from "./support.component";
import { SessionService } from "../../session/session-service/session.service";
import { BehaviorSubject, of } from "rxjs";
import { SyncState } from "../../session/session-states/sync-state.enum";
import { SwUpdate } from "@angular/service-worker";
import { LOCATION_TOKEN, WINDOW_TOKEN } from "../../../utils/di-tokens";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { HttpClient } from "@angular/common/http";
import { SessionManagerService } from "../../session/session-service/session-manager.service";
import { MatDialogModule } from "@angular/material/dialog";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { PouchDatabase } from "../../database/pouch-database";
import { BackupService } from "../../../features/admin/services/backup.service";
import { DownloadService } from "../../export/download-service/download.service";
import { AuthService } from "../../session/auth/auth.service";
import { TEST_USER } from "../../../utils/mock-local-session";

describe("SupportComponent", () => {
  let component: SupportComponent;
  let fixture: ComponentFixture<SupportComponent>;
  const testUser = { name: TEST_USER, roles: [] };
  let mockSessionService: jasmine.SpyObj<SessionService>;
  const mockSW = { isEnabled: false };
  let mockDB: jasmine.SpyObj<PouchDatabase>;
  const mockWindow = {
    navigator: {
      userAgent: "mock user agent",
      serviceWorker: { getRegistrations: () => [], ready: Promise.resolve() },
    },
  };
  let mockLocation: any;

  beforeEach(async () => {
    localStorage.clear();
    mockSessionService = jasmine.createSpyObj(["getCurrentUser"], {
      syncState: new BehaviorSubject(SyncState.UNSYNCED),
    });
    mockSessionService.getCurrentUser.and.returnValue(testUser);
    mockDB = jasmine.createSpyObj(["destroy", "getPouchDB"]);
    mockDB.getPouchDB.and.returnValue({
      info: () => Promise.resolve({ doc_count: 1, update_seq: 2 }),
    } as any);
    mockLocation = {};
    await TestBed.configureTestingModule({
      imports: [
        SupportComponent,
        MatDialogModule,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: SwUpdate, useValue: mockSW },
        { provide: PouchDatabase, useValue: mockDB },
        { provide: WINDOW_TOKEN, useValue: mockWindow },
        { provide: LOCATION_TOKEN, useValue: mockLocation },
        { provide: BackupService, useValue: null },
        { provide: DownloadService, useValue: null },
      ],
    }).compileComponents();
  });

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(SupportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize application information", () => {
    expect(component.currentUser).toBe(testUser);
    expect(component.currentSyncState).toBe("unsynced");
    expect(component.lastSync).toBe("never");
    expect(component.lastRemoteLogin).toBe("never");
    expect(component.swStatus).toBe("not enabled");
    expect(component.userAgent).toBe("mock user agent");
    expect(component.dbInfo).toBe("1 (update sequence 2)");
  });

  it("should correctly read sync and remote login status from local storage", async () => {
    const lastSync = new Date("2022-01-01").toISOString();
    localStorage.setItem(SessionManagerService.LAST_SYNC_KEY, lastSync);
    const lastRemoteLogin = new Date("2022-01-02").toISOString();
    localStorage.setItem(AuthService.LAST_AUTH_KEY, lastRemoteLogin);

    await component.ngOnInit();

    expect(component.lastSync).toBe(lastSync);
    expect(component.lastRemoteLogin).toBe(lastRemoteLogin);
    localStorage.clear();
  });

  it("should reset the application after confirmation", async () => {
    const confirmationDialog = TestBed.inject(ConfirmationDialogService);
    spyOn(confirmationDialog, "getConfirmation").and.returnValue({
      afterClosed: () => of(true),
    } as any);
    localStorage.setItem("someItem", "someValue");
    const unregisterSpy = jasmine.createSpy();
    mockWindow.navigator.serviceWorker.getRegistrations = () => [
      { unregister: unregisterSpy },
    ];

    await component.resetApplication();

    expect(mockDB.destroy).toHaveBeenCalled();
    expect(unregisterSpy).toHaveBeenCalled();
    expect(localStorage.getItem("someItem")).toBeNull();
    expect(mockLocation.pathname).toBe("");
  });

  it("should display the service worker logs after they are available", fakeAsync(() => {
    const exampleLog = "example service worker log";
    spyOn(TestBed.inject(HttpClient), "get").and.returnValue(of(exampleLog));

    component.ngOnInit();
    tick();

    expect(component.swLog).toBe(exampleLog);
  }));
});
