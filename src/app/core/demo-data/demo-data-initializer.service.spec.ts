import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { DemoDataInitializerService } from "./demo-data-initializer.service";
import { DemoDataService } from "./demo-data.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { MatDialog } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./demo-data-generating-progress-dialog.component";
import {
  LoginStateSubject,
  SessionType,
  SyncStateSubject,
} from "../session/session-type";
import { environment } from "../../../environments/environment";
import { SessionInfo, SessionSubject } from "../session/auth/session-info";
import { LocalAuthService } from "../session/auth/local/local-auth.service";
import { SessionManagerService } from "../session/session-service/session-manager.service";
import { PouchDatabase } from "../database/pouchdb/pouch-database";
import { LoginState } from "../session/session-states/login-state.enum";
import { DatabaseResolverService } from "../database/database-resolver.service";
import { MemoryPouchDatabase } from "../database/pouchdb/memory-pouch-database";
import { Entity } from "../entity/model/entity";

describe("DemoDataInitializerService", () => {
  const normalUser: SessionInfo = {
    name: DemoUserGeneratorService.DEFAULT_USERNAME,
    id: DemoUserGeneratorService.DEFAULT_USERNAME,
    entityId: "User:demo",
    roles: ["user_app"],
  };
  const adminUser: SessionInfo = {
    name: DemoUserGeneratorService.ADMIN_USERNAME,
    id: DemoUserGeneratorService.ADMIN_USERNAME,
    entityId: "User:demo-admin",
    roles: ["user_app", "admin_app"],
  };
  let service: DemoDataInitializerService;
  let mockDemoDataService: jasmine.SpyObj<DemoDataService>;
  let mockLocalAuth: jasmine.SpyObj<LocalAuthService>;
  let sessionManager: jasmine.SpyObj<SessionManagerService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let demoUserDBName: string;
  let adminDBName: string;

  let database: PouchDatabase;
  let syncStateSubject: SyncStateSubject;

  beforeEach(() => {
    syncStateSubject = new SyncStateSubject();
    environment.session_type = SessionType.mock;
    demoUserDBName = `${DemoUserGeneratorService.DEFAULT_USERNAME}-${Entity.DATABASE}`;
    adminDBName = `${DemoUserGeneratorService.ADMIN_USERNAME}-${Entity.DATABASE}`;
    mockDemoDataService = jasmine.createSpyObj(["publishDemoData"]);
    mockDemoDataService.publishDemoData.and.resolveTo();
    mockDialog = jasmine.createSpyObj(["open"]);
    mockDialog.open.and.returnValue({
      close: () => {},
    } as any);
    mockLocalAuth = jasmine.createSpyObj(["saveUser"]);
    sessionManager = jasmine.createSpyObj(["offlineLogin"]);
    database = new MemoryPouchDatabase(demoUserDBName, syncStateSubject);

    TestBed.configureTestingModule({
      providers: [
        DemoDataInitializerService,
        LoginStateSubject,
        SessionSubject,
        { provide: MatDialog, useValue: mockDialog },
        {
          provide: DatabaseResolverService,
          useValue: { getDatabase: () => database },
        },
        { provide: DemoDataService, useValue: mockDemoDataService },
        { provide: LocalAuthService, useValue: mockLocalAuth },
        { provide: SessionManagerService, useValue: sessionManager },
      ],
    });
    service = TestBed.inject(DemoDataInitializerService);
  });

  afterEach(async () => {
    localStorage.clear();

    const tmpDB = new PouchDatabase(demoUserDBName, syncStateSubject);
    tmpDB.init();
    await tmpDB.destroy();

    const tmpDB2 = new PouchDatabase(adminDBName, syncStateSubject);
    tmpDB2.init();
    await tmpDB2.destroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should save the default users", () => {
    service.logInDemoUser();

    expect(mockLocalAuth.saveUser).toHaveBeenCalledWith(normalUser);
    expect(mockLocalAuth.saveUser).toHaveBeenCalledWith(adminUser);
  });

  it("it should publish the demo data after logging in the default user", fakeAsync(() => {
    spyOn(database, "isEmpty").and.resolveTo(true);
    service.logInDemoUser();

    expect(sessionManager.offlineLogin).toHaveBeenCalledWith(adminUser);
    expect(mockDemoDataService.publishDemoData).not.toHaveBeenCalled();
    tick();

    service.generateDemoData();
    tick();

    expect(mockDemoDataService.publishDemoData).toHaveBeenCalled();
  }));

  it("should show a dialog while generating demo data", fakeAsync(() => {
    const closeSpy = jasmine.createSpy();
    mockDialog.open.and.returnValue({ close: closeSpy } as any);
    service.generateDemoData();

    expect(mockDialog.open).toHaveBeenCalledWith(
      DemoDataGeneratingProgressDialogComponent,
    );
    expect(closeSpy).not.toHaveBeenCalled();

    tick();

    expect(closeSpy).toHaveBeenCalled();
  }));

  it("should sync with existing demo data when another user logs in", fakeAsync(() => {
    service.logInDemoUser();
    database.init(demoUserDBName);
    const defaultUserDB = database.getPouchDB();

    const userDoc = { _id: "userDoc" };
    database.put(userDoc);
    tick();

    TestBed.inject(SessionSubject).next({
      name: adminUser.name,
      id: adminUser.id,
      roles: [],
    });
    database.init(adminDBName);
    TestBed.inject(LoginStateSubject).next(LoginState.LOGGED_IN);
    tick();

    expectAsync(database.get(userDoc._id)).toBeResolved();
    tick();

    const adminDoc1 = { _id: "adminDoc1" };
    const adminDoc2 = { _id: "adminDoc2" };
    database.put(adminDoc1);
    database.put(adminDoc2);
    tick();

    expect(database.getPouchDB().name).toBe(adminDBName);
    expectAsync(database.get(adminDoc1._id)).toBeResolved();
    expectAsync(database.get(adminDoc2._id)).toBeResolved();
    expectAsync(defaultUserDB.get(adminDoc1._id)).toBeResolved();
    expectAsync(defaultUserDB.get(adminDoc2._id)).toBeResolved();
    expectAsync(defaultUserDB.get(userDoc._id)).toBeResolved();
    tick();
  }));

  it("should stop syncing after logout", fakeAsync(() => {
    service.logInDemoUser();
    tick();

    TestBed.inject(SessionSubject).next({
      name: adminUser.name,
      id: adminUser.id,
      roles: [],
    });
    database.init(adminDBName);
    TestBed.inject(LoginStateSubject).next(LoginState.LOGGED_IN);
    const adminUserDB = database.getPouchDB();
    tick();

    const syncedDoc = { _id: "syncedDoc" };
    adminUserDB.put(syncedDoc);
    tick();

    TestBed.inject(LoginStateSubject).next(LoginState.LOGGED_OUT);

    const unsyncedDoc = { _id: "unsyncedDoc" };
    adminUserDB.put(unsyncedDoc);
    tick();

    database.init(demoUserDBName);
    const defaultUserDB = database.getPouchDB();
    expectAsync(defaultUserDB.get(syncedDoc._id)).toBeResolved();
    expectAsync(defaultUserDB.get(unsyncedDoc._id)).toBeRejected();
    tick();
  }));
});
