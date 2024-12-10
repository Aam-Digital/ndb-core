import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { DemoDataInitializerService } from "./demo-data-initializer.service";
import { DemoDataService } from "./demo-data.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import { MatDialog } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./demo-data-generating-progress-dialog.component";
import { LoginStateSubject, SessionType } from "../session/session-type";
import { environment } from "../../../environments/environment";
import { SessionInfo, SessionSubject } from "../session/auth/session-info";
import { LocalAuthService } from "../session/auth/local/local-auth.service";
import { SessionManagerService } from "../session/session-service/session-manager.service";
import { PouchDatabase } from "../database/pouch-database";
import { Database } from "../database/database";
import { LoginState } from "../session/session-states/login-state.enum";

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
  let httpTestingController: HttpTestingController;
  let demoUserDBName: string;
  let adminDBName: string;

  beforeEach(() => {
    environment.session_type = SessionType.mock;
    demoUserDBName = `${DemoUserGeneratorService.DEFAULT_USERNAME}-${environment.DB_NAME}`;
    adminDBName = `${DemoUserGeneratorService.ADMIN_USERNAME}-${environment.DB_NAME}`;
    mockDemoDataService = jasmine.createSpyObj(["publishDemoData"]);
    mockDemoDataService.publishDemoData.and.resolveTo();
    mockDialog = jasmine.createSpyObj(["open"]);
    mockDialog.open.and.returnValue({ close: () => {} } as any);
    mockLocalAuth = jasmine.createSpyObj(["saveUser"]);
    sessionManager = jasmine.createSpyObj(["offlineLogin"]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DemoDataInitializerService,
        LoginStateSubject,
        SessionSubject,
        { provide: MatDialog, useValue: mockDialog },
        { provide: Database, useClass: PouchDatabase },
        { provide: DemoDataService, useValue: mockDemoDataService },
        { provide: LocalAuthService, useValue: mockLocalAuth },
        { provide: SessionManagerService, useValue: sessionManager },
      ],
    });
    service = TestBed.inject(DemoDataInitializerService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(async () => {
    localStorage.clear();
    const tmpDB = new PouchDatabase();
    await tmpDB.initInMemoryDB(demoUserDBName).destroy();
    await tmpDB.initInMemoryDB(adminDBName).destroy();
    httpTestingController.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should load demo_entities.json if available", fakeAsync(() => {
    const mockEntities = {
      docs: [
        { _id: "Config:CONFIG_ENTITY", otherField: "xyz" },
        { _id: "User:USER_ENTITY", username: "demoUser", role: "admin" },
      ],
    };

    service.run();

    const req = httpTestingController.expectOne("assets/demo_entities.json");
    expect(req.request.method).toBe("GET");

    req.flush(mockEntities);

    tick();

    expect(console.log).toHaveBeenCalledWith(
      "Loaded demo_entities.json:",
      mockEntities,
    );
  }));

  it("should proceed without demo_entities.json if not available", fakeAsync(() => {
    service.run();

    const req = httpTestingController.expectOne("assets/demo_entities.json");
    expect(req.request.method).toBe("GET");

    req.error(new ErrorEvent("404 Not Found"), { status: 404 });

    tick();

    expect(console.log).toHaveBeenCalledWith(
      "No demo_entities.json found, proceeding with default demo setup.",
    );
  }));

  it("should save the default users", () => {
    service.run();

    expect(mockLocalAuth.saveUser).toHaveBeenCalledWith(normalUser);
    expect(mockLocalAuth.saveUser).toHaveBeenCalledWith(adminUser);
  });

  it("it should publish the demo data after logging in the default user", fakeAsync(() => {
    service.run();

    expect(sessionManager.offlineLogin).toHaveBeenCalledWith(normalUser);
    expect(mockDemoDataService.publishDemoData).not.toHaveBeenCalled();

    tick();

    expect(mockDemoDataService.publishDemoData).toHaveBeenCalled();
  }));

  it("should show a dialog while generating demo data", fakeAsync(() => {
    const closeSpy = jasmine.createSpy();
    mockDialog.open.and.returnValue({ close: closeSpy } as any);
    service.run();

    expect(mockDialog.open).toHaveBeenCalledWith(
      DemoDataGeneratingProgressDialogComponent,
    );
    expect(closeSpy).not.toHaveBeenCalled();

    tick();

    expect(closeSpy).toHaveBeenCalled();
  }));

  it("should sync with existing demo data when another user logs in", fakeAsync(() => {
    service.run();
    const database = TestBed.inject(Database) as PouchDatabase;
    database.initInMemoryDB(demoUserDBName);
    const defaultUserDB = database.getPouchDB();

    const userDoc = { _id: "userDoc" };
    database.put(userDoc);
    tick();

    TestBed.inject(SessionSubject).next({
      name: adminUser.name,
      id: adminUser.id,
      roles: [],
    });
    database.initInMemoryDB(adminDBName);
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
    service.run();
    tick();

    const database = TestBed.inject(Database) as PouchDatabase;
    TestBed.inject(SessionSubject).next({
      name: adminUser.name,
      id: adminUser.id,
      roles: [],
    });
    database.initInMemoryDB(adminDBName);
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

    database.initInMemoryDB(demoUserDBName);
    const defaultUserDB = database.getPouchDB();
    expectAsync(defaultUserDB.get(syncedDoc._id)).toBeResolved();
    expectAsync(defaultUserDB.get(unsyncedDoc._id)).toBeRejected();
    tick();
  }));
});
