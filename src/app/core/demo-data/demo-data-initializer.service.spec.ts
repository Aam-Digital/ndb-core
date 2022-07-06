import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { DemoDataInitializerService } from "./demo-data-initializer.service";
import { DemoDataService } from "./demo-data.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { LocalSession } from "../session/session-service/local-session";
import { DatabaseUser } from "../session/session-service/local-user";
import { MatDialog } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./demo-data-generating-progress-dialog.component";
import { AppConfig } from "../app-config/app-config";
import { PouchDatabase } from "../database/pouch-database";
import { Subject } from "rxjs";
import { LoginState } from "../session/session-states/login-state.enum";
import { IAppConfig } from "../app-config/app-config.model";
import { Database } from "../database/database";
import { SessionType } from "../session/session-type";

describe("DemoDataInitializerService", () => {
  let service: DemoDataInitializerService;
  let mockDemoDataService: jasmine.SpyObj<DemoDataService>;
  let mockSessionService: jasmine.SpyObj<LocalSession>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let loginState: Subject<LoginState>;
  let demoUserDBName: string;
  let adminDBName: string;

  beforeEach(() => {
    AppConfig.settings = {
      database: { name: "test-db" },
      session_type: SessionType.mock,
    } as IAppConfig;
    demoUserDBName = `${DemoUserGeneratorService.DEFAULT_USERNAME}-${AppConfig.DB_NAME}`;
    adminDBName = `${DemoUserGeneratorService.ADMIN_USERNAME}-${AppConfig.DB_NAME}`;
    mockDemoDataService = jasmine.createSpyObj(["publishDemoData"]);
    mockDemoDataService.publishDemoData.and.resolveTo();
    mockDialog = jasmine.createSpyObj(["open"]);
    mockDialog.open.and.returnValue({ close: () => {} } as any);
    loginState = new Subject();
    mockSessionService = jasmine.createSpyObj(
      ["login", "saveUser", "getCurrentUser"],
      { loginState: loginState }
    );

    TestBed.configureTestingModule({
      providers: [
        DemoDataInitializerService,
        { provide: MatDialog, useValue: mockDialog },
        { provide: Database, useClass: PouchDatabase },
        { provide: DemoDataService, useValue: mockDemoDataService },
        { provide: LocalSession, useValue: mockSessionService },
      ],
    });
    service = TestBed.inject(DemoDataInitializerService);
  });

  afterEach(async () => {
    loginState.complete();
    const tmpDB = new PouchDatabase(undefined);
    await tmpDB.initInMemoryDB(demoUserDBName).destroy();
    await tmpDB.initInMemoryDB(adminDBName).destroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should save the default users", () => {
    service.run();

    const normalUser: DatabaseUser = {
      name: DemoUserGeneratorService.DEFAULT_USERNAME,
      roles: ["user_app"],
    };
    const adminUser: DatabaseUser = {
      name: DemoUserGeneratorService.ADMIN_USERNAME,
      roles: ["user_app", "admin_app"],
    };

    expect(mockSessionService.saveUser).toHaveBeenCalledWith(
      normalUser,
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
    expect(mockSessionService.saveUser).toHaveBeenCalledWith(
      adminUser,
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
  });

  it("it should login the default user after publishing the demo data", fakeAsync(() => {
    service.run();

    expect(mockDemoDataService.publishDemoData).toHaveBeenCalled();
    expect(mockSessionService.login).not.toHaveBeenCalled();

    tick();

    expect(mockSessionService.login).toHaveBeenCalledWith(
      DemoUserGeneratorService.DEFAULT_USERNAME,
      DemoUserGeneratorService.DEFAULT_PASSWORD
    );
  }));

  it("should show a dialog while generating demo data", fakeAsync(() => {
    const closeSpy = jasmine.createSpy();
    mockDialog.open.and.returnValue({ close: closeSpy } as any);
    service.run();

    expect(mockDialog.open).toHaveBeenCalledWith(
      DemoDataGeneratingProgressDialogComponent
    );
    expect(closeSpy).not.toHaveBeenCalled();

    tick();

    expect(closeSpy).toHaveBeenCalled();
  }));

  it("should initialize the database before publishing", () => {
    const database = TestBed.inject(Database) as PouchDatabase;
    expect(database.getPouchDB()).toBeUndefined();

    service.run();

    expect(database.getPouchDB()).toBeDefined();
    expect(database.getPouchDB().name).toBe(demoUserDBName);
  });

  it("should sync with existing demo data when another user logs in", fakeAsync(() => {
    service.run();
    const database = TestBed.inject(Database) as PouchDatabase;
    database.initInMemoryDB(demoUserDBName);
    const defaultUserDB = database.getPouchDB();

    const userDoc = { _id: "userDoc" };
    database.put(userDoc);
    tick();

    mockSessionService.getCurrentUser.and.returnValue({
      name: DemoUserGeneratorService.ADMIN_USERNAME,
      roles: [],
    });
    database.initInMemoryDB(adminDBName);
    loginState.next(LoginState.LOGGED_IN);
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
    service.run();
    tick();

    const database = TestBed.inject(Database) as PouchDatabase;
    mockSessionService.getCurrentUser.and.returnValue({
      name: DemoUserGeneratorService.ADMIN_USERNAME,
      roles: [],
    });
    database.initInMemoryDB(adminDBName);
    loginState.next(LoginState.LOGGED_IN);
    const adminUserDB = database.getPouchDB();
    tick();

    const syncedDoc = { _id: "syncedDoc" };
    adminUserDB.put(syncedDoc);
    tick();

    loginState.next(LoginState.LOGGED_OUT);

    const unsyncedDoc = { _id: "unsncedDoc" };
    adminUserDB.put(unsyncedDoc);
    tick();

    database.initInMemoryDB(demoUserDBName);
    const defaultUserDB = database.getPouchDB();
    expectAsync(defaultUserDB.get(syncedDoc._id)).toBeResolved();
    expectAsync(defaultUserDB.get(unsyncedDoc._id)).toBeRejected();
    tick();
  }));
});
