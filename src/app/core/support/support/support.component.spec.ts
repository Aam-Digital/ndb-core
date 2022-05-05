import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { SupportComponent } from "./support.component";
import { SupportModule } from "../support.module";
import { SessionService } from "../../session/session-service/session.service";
import { BehaviorSubject, of } from "rxjs";
import { SyncState } from "../../session/session-states/sync-state.enum";
import { SwUpdate } from "@angular/service-worker";
import { Database } from "../../database/database";
import { LOCATION_TOKEN, WINDOW_TOKEN } from "../../../utils/di-tokens";
import { TEST_USER } from "../../../utils/mocked-testing.module";
import { RemoteSession } from "../../session/session-service/remote-session";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { HttpClient } from "@angular/common/http";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { SyncedSessionService } from "../../session/session-service/synced-session.service";

describe("SupportComponent", () => {
  let component: SupportComponent;
  let fixture: ComponentFixture<SupportComponent>;
  const testUser = { name: TEST_USER, roles: [] };
  let mockSessionService: jasmine.SpyObj<SessionService>;
  const mockSW = { isEnabled: false };
  let mockDB: jasmine.SpyObj<Database>;
  const mockWindow = {
    navigator: {
      userAgent: "mock user agent",
      serviceWorker: { getRegistrations: () => [], ready: Promise.resolve() },
    },
  };
  let mockLocation: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    localStorage.clear();
    mockSessionService = jasmine.createSpyObj(["getCurrentUser"], {
      syncState: new BehaviorSubject(SyncState.UNSYNCED),
    });
    mockSessionService.getCurrentUser.and.returnValue(testUser);
    mockDB = jasmine.createSpyObj(["destroy"]);
    mockLocation = jasmine.createSpyObj(["reload"]);
    await TestBed.configureTestingModule({
      imports: [SupportModule, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: SwUpdate, useValue: mockSW },
        { provide: Database, useValue: mockDB },
        { provide: WINDOW_TOKEN, useValue: mockWindow },
        { provide: LOCATION_TOKEN, useValue: mockLocation },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SupportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

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
  });

  it("should correctly read sync and remote login status from local storage", () => {
    const lastSync = new Date("2022-01-01").toISOString();
    localStorage.setItem(SyncedSessionService.LAST_SYNC_KEY, lastSync);
    const lastRemoteLogin = new Date("2022-01-02").toISOString();
    localStorage.setItem(RemoteSession.LAST_LOGIN_KEY, lastRemoteLogin);

    component.ngOnInit();

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
    expect(mockLocation.reload).toHaveBeenCalled();
  });

  it("should display the service worker logs after they are available", fakeAsync(() => {
    const exampleLog = "example service worker log";
    spyOn(TestBed.inject(HttpClient), "get").and.returnValue(of(exampleLog));

    component.ngOnInit();
    tick();

    expect(component.swLog).toBe(exampleLog);
  }));
});
