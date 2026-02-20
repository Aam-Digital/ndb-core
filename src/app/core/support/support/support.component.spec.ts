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
import { WINDOW_TOKEN } from "../../../utils/di-tokens";
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { MatDialogModule } from "@angular/material/dialog";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { PouchDatabase } from "../../database/pouchdb/pouch-database";
import { BackupService } from "../../admin/backup/backup.service";
import { DownloadService } from "../../export/download-service/download.service";
import { KeycloakAuthService } from "../../session/auth/keycloak/keycloak-auth.service";
import { SyncStateSubject } from "../../session/session-type";
import { Entity } from "../../entity/model/entity";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { SessionInfo, SessionSubject } from "../../session/auth/session-info";
import { TEST_USER } from "../../user/demo-user-generator.service";
import { SyncedPouchDatabase } from "../../database/pouchdb/synced-pouch-database";
import { DatabaseResolverService } from "../../database/database-resolver.service";

describe("SupportComponent", () => {
  let component: SupportComponent;
  let fixture: ComponentFixture<SupportComponent>;
  const testUser: SessionInfo = { name: TEST_USER, id: TEST_USER, roles: [] };
  const userEntity = new Entity(TEST_USER);
  const mockSW = { isEnabled: false };
  let mockDB: Partial<SyncedPouchDatabase>;
  const mockWindow = {
    navigator: {
      userAgent: "mock user agent",
      serviceWorker: { getRegistrations: () => [], ready: Promise.resolve() },
    },
  };

  beforeEach(async () => {
    localStorage.clear();
    const testDbName = TEST_USER + "-" + Entity.DATABASE;
    mockDB = Object.create(SyncedPouchDatabase.prototype);
    Object.defineProperty(mockDB, "LAST_SYNC_KEY", {
      value: SyncedPouchDatabase.LAST_SYNC_KEY_PREFIX + testDbName,
    });
    mockDB.getPouchDB = jasmine.createSpy("getPouchDB").and.returnValue({
      info: () => Promise.resolve({ doc_count: 1, update_seq: 2 }),
    } as any);
    mockDB.destroy = jasmine.createSpy("destroy");

    await TestBed.configureTestingModule({
      imports: [SupportComponent, MatDialogModule, NoopAnimationsModule],
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
        {
          provide: BackupService,
          useValue: jasmine.createSpyObj(["resetApplication"]),
        },
        { provide: DownloadService, useValue: null },
        {
          provide: DatabaseResolverService,
          useValue: { getDatabase: () => mockDB },
        },
        SyncStateSubject,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
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
    localStorage.setItem(mockDB.LAST_SYNC_KEY, lastSync);
    const lastRemoteLogin = new Date("2022-01-02").toISOString();
    localStorage.setItem(KeycloakAuthService.LAST_AUTH_KEY, lastRemoteLogin);

    await component.ngOnInit();

    expect(component.lastSync).toBe(lastSync);
    expect(component.lastRemoteLogin).toBe(lastRemoteLogin);
    localStorage.clear();
  });

  it("should display the service worker logs after they are available", fakeAsync(() => {
    const exampleLog = "example service worker log";
    spyOn(TestBed.inject(HttpClient), "get").and.returnValue(of(exampleLog));

    component.ngOnInit();
    tick();

    expect(component.swLog).toBe(exampleLog);
  }));
});
