import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { DemoModeService } from "./demo-mode.service";
import { SessionService } from "../session/session-service/session.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import {
  LocalUser,
  passwordEqualsEncrypted,
} from "../session/session-service/local-user";
import { DemoDataService } from "./demo-data.service";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./demo-data-generating-progress-dialog.component";
import { Subject } from "rxjs";
import { LoginState } from "../session/session-states/login-state.enum";
import { PouchDatabase } from "../database/pouch-database";
import { AppConfig } from "../app-config/app-config";
import { SessionType } from "../session/session-type";
import { Database } from "../database/database";

describe("DemoModeService", () => {
  const demoUsername = DemoUserGeneratorService.DEFAULT_USERNAME;
  const adminUsername = DemoUserGeneratorService.ADMIN_USERNAME;
  const demoPassword = DemoUserGeneratorService.DEFAULT_PASSWORD;
  let service: DemoModeService;
  let mockLoginState: Subject<LoginState>;
  let mockSession: jasmine.SpyObj<SessionService>;
  let mockDemoDataService: jasmine.SpyObj<DemoDataService>;
  let dialogRef: MatDialogRef<DemoDataGeneratingProgressDialogComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockPouchDB: jasmine.SpyObj<PouchDatabase>;

  beforeEach(() => {
    mockLoginState = new Subject<LoginState>();
    mockSession = jasmine.createSpyObj(["login", "getCurrentUser"], {
      loginState: mockLoginState,
    });
    mockDemoDataService = jasmine.createSpyObj(["publishDemoData"]);
    dialogRef = {
      close: jasmine.createSpy(),
      disableClose: false,
    } as any;
    mockDialog = jasmine.createSpyObj(["open"]);
    mockDialog.open.and.returnValue(dialogRef);
    AppConfig.settings = {
      site_name: "Aam Digital - DEV",
      session_type: SessionType.mock,
      database: {
        name: "test-db-name",
        remote_url: "https://demo.aam-digital.com/db/",
      },
    };
    mockPouchDB = jasmine.createSpyObj(["initInMemoryDB", "getPouchDB"]);

    TestBed.configureTestingModule({
      providers: [
        { provide: SessionService, useValue: mockSession },
        { provide: DemoDataService, useValue: mockDemoDataService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Database, useValue: mockPouchDB },
        DemoModeService,
      ],
    });
    service = TestBed.inject(DemoModeService);
  });

  afterEach(() => {
    mockLoginState.complete();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should automatically register the default users in the local storage", () => {
    service.start();

    const demoUser: LocalUser = JSON.parse(
      window.localStorage.getItem(demoUsername)
    );
    expect(demoUser.name).toBe(demoUsername);
    expect(
      passwordEqualsEncrypted(demoPassword, demoUser.encryptedPassword)
    ).toBeTrue();

    const demoAdmin: LocalUser = JSON.parse(
      window.localStorage.getItem(adminUsername)
    );
    expect(demoAdmin.name).toBe(adminUsername);
    expect(
      passwordEqualsEncrypted(demoPassword, demoAdmin.encryptedPassword)
    ).toBeTrue();
  });

  it("should automatically login the default user", () => {
    service.start();

    expect(mockSession.login).toHaveBeenCalledWith(demoUsername, demoPassword);
  });

  it("should initialize the demo data on first login", async () => {
    await service.start();

    expect(mockDemoDataService.publishDemoData).toHaveBeenCalled();
  });

  it("should show a un-closable progress dialog while generating demo data", fakeAsync(() => {
    service.start();

    expect(mockDialog.open).toHaveBeenCalledWith(
      DemoDataGeneratingProgressDialogComponent
    );
    expect(dialogRef.disableClose).toBeTrue();

    tick();
    expect(dialogRef.close).toHaveBeenCalled();
  }));

  it("should sync with existing demo data if another user is logged in", fakeAsync(() => {
    service.start();
    tick();

    mockDemoDataService.publishDemoData.calls.reset();
    const demoUserDBName = `${demoUsername}-${AppConfig.settings.database.name}`;
    const testDoc = { _id: "testDoc" };
    const demoUserDB = new PouchDatabase().initInMemoryDB(demoUserDBName);
    demoUserDB.put(testDoc);
    tick();

    mockSession.getCurrentUser.and.returnValue({ name: adminUsername } as any);
    const adminPouch = jasmine.createSpyObj<PouchDB.Database>(["sync", "info"]);
    mockPouchDB.getPouchDB.and.returnValue(adminPouch);
    adminPouch.info.and.resolveTo({ doc_count: 0 } as any);
    mockLoginState.next(LoginState.LOGGED_IN);
    tick();

    expect(mockDemoDataService.publishDemoData).not.toHaveBeenCalled();
    expect(mockPouchDB.getPouchDB).toHaveBeenCalled();
    const syncedPouch = adminPouch.sync.calls.mostRecent()
      .args[0] as PouchDB.Database;
    expect(syncedPouch.name).toBe(demoUserDBName);
    expect(adminPouch.sync).toHaveBeenCalledWith(syncedPouch, {
      batch_size: 500,
    });
    expect(adminPouch.sync).toHaveBeenCalledWith(syncedPouch, {
      live: true,
      retry: true,
    });

    demoUserDB.destroy();
    tick();
  }));

  it("should only sync if a database with more docs than the current one exists", fakeAsync(() => {
    service.start();
    tick();

    const testDoc = { _id: "testDoc" };
    const anotherDoc = { _id: "anotherDoc" };
    const demoUserDBName = `${demoUsername}-${AppConfig.settings.database.name}`;
    const demoUserDB = new PouchDatabase().initInMemoryDB(demoUserDBName);
    demoUserDB.put(testDoc);
    const adminUserDBName = `${adminUsername}-${AppConfig.settings.database.name}`;
    const adminDB = new PouchDatabase().initInMemoryDB(adminUserDBName);
    adminDB.put(testDoc);
    adminDB.put(anotherDoc);
    tick();
    spyOn(adminDB.getPouchDB(), "sync");
    mockPouchDB.getPouchDB.and.returnValue(adminDB.getPouchDB());

    mockSession.getCurrentUser.and.returnValue({ name: adminUsername } as any);
    mockLoginState.next(LoginState.LOGGED_IN);
    tick();

    const newDB = mockPouchDB.getPouchDB();
    expect(newDB.sync).not.toHaveBeenCalled();
    expectAsync(newDB.get(testDoc._id)).toBeResolved();
    expectAsync(newDB.get(anotherDoc._id)).toBeResolved();
    tick();

    demoUserDB.destroy();
    adminDB.destroy();
    tick();
  }));
});
