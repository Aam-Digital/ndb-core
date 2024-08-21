import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { SupportComponent } from "./support.component";
import { BehaviorSubject, of } from "rxjs";
import { SwUpdate } from "@angular/service-worker";
import { LOCATION_TOKEN, WINDOW_TOKEN } from "../../../utils/di-tokens";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { MatDialogModule } from "@angular/material/dialog";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { PouchDatabase } from "../../database/pouch-database";
import { BackupService } from "../../admin/backup/backup.service";
import { DownloadService } from "../../export/download-service/download.service";
import { SyncService } from "../../database/sync.service";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { SyncStateSubject } from "../../session/session-type";
import { Entity } from "../../entity/model/entity";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { SessionInfo, SessionSubject } from "../../session/auth/session-info";
import { TEST_USER } from "../../user/demo-user-generator.service";

class MockDeleteRequest {
  onsuccess: () => {};
  constructor() {
    setTimeout(() => this.onsuccess());
  }
}

describe("SupportComponent", () => {
  let component: SupportComponent;
  let fixture: ComponentFixture<SupportComponent>;
  const testUser: SessionInfo = { name: TEST_USER, id: TEST_USER, roles: [] };
  const userEntity = new Entity(TEST_USER);
  const mockSW = { isEnabled: false };
  let mockDB: jasmine.SpyObj<PouchDatabase>;
  const mockWindow = {
    navigator: {
      userAgent: "mock user agent",
      serviceWorker: { getRegistrations: () => [], ready: Promise.resolve() },
    },
    indexedDB: {
      databases: jasmine.createSpy(),
      deleteDatabase: jasmine
        .createSpy()
        .and.callFake(() => new MockDeleteRequest()),
    },
  };
  let mockLocation: any;

  beforeEach(async () => {
    localStorage.clear();
    mockDB = jasmine.createSpyObj(["destroy", "getPouchDB"]);
    mockDB.getPouchDB.and.returnValue({
      info: () => Promise.resolve({ doc_count: 1, update_seq: 2 }),
    } as any);
    mockLocation = {};
    await TestBed.configureTestingModule({
    imports: [SupportComponent,
        MatDialogModule,
        NoopAnimationsModule],
    providers: [
        {
            provide: SessionSubject,
            useValue: new BehaviorSubject(testUser),
        },
        {
            provide: CurrentUserSubject,
            useValue: new BehaviorSubject(userEntity),
        },
        { provide: SwUpdate, useValue: mockSW },
        { provide: PouchDatabase, useValue: mockDB },
        { provide: WINDOW_TOKEN, useValue: mockWindow },
        { provide: LOCATION_TOKEN, useValue: mockLocation },
        { provide: BackupService, useValue: null },
        { provide: DownloadService, useValue: null },
        SyncStateSubject,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
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
    expect(component.sessionInfo).toBe(testUser);
    expect(component.currentUser).toBe(userEntity);
    expect(component.currentSyncState).toBe("unsynced");
    expect(component.lastSync).toBe("never");
    expect(component.lastRemoteLogin).toBe("never");
    expect(component.swStatus).toBe("not enabled");
    expect(component.userAgent).toBe("mock user agent");
    expect(component.dbInfo).toBe("1 (update sequence 2)");
  });

  it("should correctly read sync and remote login status from local storage", async () => {
    const lastSync = new Date("2022-01-01").toISOString();
    localStorage.setItem(SyncService.LAST_SYNC_KEY, lastSync);
    const lastRemoteLogin = new Date("2022-01-02").toISOString();
    localStorage.setItem(KeycloakAuthService.LAST_AUTH_KEY, lastRemoteLogin);

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
    mockWindow.indexedDB.databases.and.resolveTo([
      { name: "db1" },
      { name: "db2" },
    ]);

    await component.resetApplication();

    expect(unregisterSpy).toHaveBeenCalled();
    expect(localStorage.getItem("someItem")).toBeNull();
    expect(mockLocation.pathname).toBe("");
    expect(mockWindow.indexedDB.deleteDatabase).toHaveBeenCalledWith("db1");
    expect(mockWindow.indexedDB.deleteDatabase).toHaveBeenCalledWith("db2");
  });

  it("should display the service worker logs after they are available", fakeAsync(() => {
    const exampleLog = "example service worker log";
    spyOn(TestBed.inject(HttpClient), "get").and.returnValue(of(exampleLog));

    component.ngOnInit();
    tick();

    expect(component.swLog).toBe(exampleLog);
  }));
});
