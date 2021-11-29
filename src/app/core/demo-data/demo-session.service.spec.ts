import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";

import { DemoSession } from "./demo-session.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";
import {
  LocalUser,
  passwordEqualsEncrypted,
} from "../session/session-service/local-user";
import { DemoDataService } from "./demo-data.service";
import { PouchDatabase } from "../database/pouch-database";
import { AppConfig } from "../app-config/app-config";
import { Database } from "../database/database";
import { LoggingService } from "../logging/logging.service";
import { SessionType } from "../session/session-type";
import { SyncState } from "../session/session-states/sync-state.enum";
import { LoginState } from "../session/session-states/login-state.enum";

describe("DemoSession", () => {
  const demoUsername = DemoUserGeneratorService.DEFAULT_USERNAME;
  const adminUsername = DemoUserGeneratorService.ADMIN_USERNAME;
  const demoPassword = DemoUserGeneratorService.DEFAULT_PASSWORD;
  let service: DemoSession;
  let mockDemoDataService: jasmine.SpyObj<DemoDataService>;

  beforeEach(
    waitForAsync(() => {
      AppConfig.settings = {
        site_name: "Aam Digital - DEV",
        session_type: SessionType.mock,
        database: {
          name: "test-db-name",
          remote_url: "https://demo.aam-digital.com/db/",
        },
      };
      mockDemoDataService = jasmine.createSpyObj(["publishDemoData"]);
      mockDemoDataService.publishDemoData.and.resolveTo();

      TestBed.configureTestingModule({
        providers: [
          { provide: DemoDataService, useValue: mockDemoDataService },
          { provide: PouchDatabase, useClass: PouchDatabase },
          { provide: Database, useExisting: PouchDatabase },
          LoggingService,
          DemoSession,
        ],
      });
      service = TestBed.inject(DemoSession);
    })
  );

  afterEach(
    waitForAsync(() => {
      const db = TestBed.inject(PouchDatabase);
      if (db.getPouchDB()) {
        db.destroy();
      }
      window.localStorage.removeItem(demoUsername);
      window.localStorage.removeItem(adminUsername);
    })
  );

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should automatically register the default users in the local storage", async () => {
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
    expect(service.loginState.value).toBe(LoginState.LOGGED_IN);
    const loggedInUser = service.getCurrentUser();
    expect(loggedInUser.name).toBe(demoUsername);
  });

  it("should initialize the demo data on first login", async () => {
    expect(mockDemoDataService.publishDemoData).toHaveBeenCalled();
  });

  it("should sync with existing demo data when another user logs in", fakeAsync(() => {
    const demoUserDBName = `${demoUsername}-${AppConfig.settings.database.name}`;
    const database = TestBed.inject(PouchDatabase);
    const userPouch = database.getPouchDB();
    expect(userPouch.name).toBe(demoUserDBName);

    mockDemoDataService.publishDemoData.calls.reset();
    const testDoc = { _id: "testDoc" };
    database.put(testDoc);
    tick();

    service.login(adminUsername, demoPassword);
    tick();

    expect(mockDemoDataService.publishDemoData).not.toHaveBeenCalled();
    const adminDBName = `${adminUsername}-${AppConfig.settings.database.name}`;
    expect(database.getPouchDB().name).toBe(adminDBName);
    expectAsync(database.get(testDoc._id)).toBeResolved();
    tick();

    userPouch.destroy();
    tick();
  }));

  it("should not  sync if current database has more documents than all the other databases", fakeAsync(() => {
    const userDoc = { _id: "userDoc" };
    const database = TestBed.inject(PouchDatabase);
    const userPouch = database.getPouchDB();
    userPouch.put(userDoc);

    const adminUserDBName = `${adminUsername}-${AppConfig.settings.database.name}`;
    const adminDB = new PouchDatabase().initInMemoryDB(adminUserDBName);
    const adminDoc1 = { _id: "adminDoc1" };
    const adminDoc2 = { _id: "adminDoc2" };
    adminDB.put(adminDoc1);
    adminDB.put(adminDoc2);
    tick();

    service.login(adminUsername, demoPassword);
    tick();

    expectAsync(database.get(adminDoc1._id)).toBeResolved();
    expectAsync(database.get(adminDoc2._id)).toBeResolved();
    expectAsync(database.get(userDoc._id)).toBeRejected();
    tick();

    userPouch.destroy();
    tick();
  }));

  it("should set sync status during demo data generation", () => {
    expect(service.syncState.value).toBe(SyncState.COMPLETED);
    console.log("checking");
  });

  it("should set sync status during sync with existing db", fakeAsync(() => {
    TestBed.inject(Database).put({ _id: "someDoc" });
    tick();

    spyOn(service.syncState, "next").and.callThrough();

    service.login(adminUsername, demoPassword);
    tick();

    expect(service.syncState.next).toHaveBeenCalledWith(SyncState.STARTED);
    expect(service.syncState.next).toHaveBeenCalledWith(SyncState.COMPLETED);
    expect(service.syncState.value).toBe(SyncState.COMPLETED);
  }));
});
