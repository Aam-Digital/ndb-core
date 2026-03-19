import { TestBed } from "@angular/core/testing";

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
import { LoginState } from "../session/session-states/login-state.enum";
import { DatabaseResolverService } from "../database/database-resolver.service";
import { MemoryPouchDatabase } from "../database/pouchdb/memory-pouch-database";
import { Entity } from "../entity/model/entity";
import type { Mock } from "vitest";

type DemoDataServiceMock = Pick<DemoDataService, "publishDemoData"> & {
  publishDemoData: Mock;
};

type DialogRefMock = {
  close: Mock;
};

type MatDialogMock = Pick<MatDialog, "open"> & {
  open: Mock;
};

type LocalAuthServiceMock = Pick<LocalAuthService, "saveUser"> & {
  saveUser: Mock;
};

type SessionManagerMock = Pick<SessionManagerService, "offlineLogin"> & {
  offlineLogin: Mock;
};

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
  let mockDemoDataService: DemoDataServiceMock;
  let mockLocalAuth: LocalAuthServiceMock;
  let sessionManager: SessionManagerMock;
  let mockDialog: MatDialogMock;
  let demoUserDBName: string;
  let adminDBName: string;

  let database: MemoryPouchDatabase;
  let syncStateSubject: SyncStateSubject;

  beforeEach(() => {
    syncStateSubject = new SyncStateSubject();
    environment.session_type = SessionType.mock;
    demoUserDBName = `${DemoUserGeneratorService.DEFAULT_USERNAME}-${Entity.DATABASE}`;
    adminDBName = `${DemoUserGeneratorService.ADMIN_USERNAME}-${Entity.DATABASE}`;
    mockDemoDataService = {
      publishDemoData: vi.fn(),
    };
    mockDemoDataService.publishDemoData.mockResolvedValue(undefined);
    mockDialog = {
      open: vi.fn(),
    };
    mockDialog.open.mockReturnValue({
      close: vi.fn(),
    } as DialogRefMock);
    mockLocalAuth = {
      saveUser: vi.fn(),
    };
    sessionManager = {
      offlineLogin: vi.fn(),
    };
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

    const tmpDB = new MemoryPouchDatabase(demoUserDBName, syncStateSubject);
    tmpDB.init();
    await tmpDB.destroy();

    const tmpDB2 = new MemoryPouchDatabase(adminDBName, syncStateSubject);
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

  it("it should publish the demo data after logging in the default user", async () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(database, "isEmpty").mockResolvedValue(true);
      service.logInDemoUser();

      expect(sessionManager.offlineLogin).toHaveBeenCalledWith(adminUser);
      expect(mockDemoDataService.publishDemoData).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(0);

      service.generateDemoData();
      await vi.advanceTimersByTimeAsync(0);

      expect(mockDemoDataService.publishDemoData).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should show a dialog while generating demo data", async () => {
    vi.useFakeTimers();
    try {
      const closeSpy = vi.fn();
      mockDialog.open.mockReturnValue({ close: closeSpy } as DialogRefMock);
      service.generateDemoData();

      expect(mockDialog.open).toHaveBeenCalledWith(
        DemoDataGeneratingProgressDialogComponent,
      );
      expect(closeSpy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(0);

      expect(closeSpy).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should sync with existing demo data when another user logs in", async () => {
    await service.logInDemoUser();
    database.init(demoUserDBName);
    const defaultUserDB = database.getPouchDB();

    const userDoc = { _id: "userDoc" };
    await database.put(userDoc);

    TestBed.inject(SessionSubject).next({
      name: adminUser.name,
      id: adminUser.id,
      roles: [],
    });
    database.init(adminDBName);
    TestBed.inject(LoginStateSubject).next(LoginState.LOGGED_IN);

    await vi.waitFor(async () => {
      await expect(database.get(userDoc._id)).resolves.toMatchObject(userDoc);
    });

    const adminDoc1 = { _id: "adminDoc1" };
    const adminDoc2 = { _id: "adminDoc2" };
    await database.put(adminDoc1);
    await database.put(adminDoc2);

    await vi.waitFor(async () => {
      expect(database.getPouchDB().name).toBe(adminDBName);
      await expect(database.get(adminDoc1._id)).resolves.toMatchObject(
        adminDoc1,
      );
      await expect(database.get(adminDoc2._id)).resolves.toMatchObject(
        adminDoc2,
      );
      await expect(defaultUserDB.get(adminDoc1._id)).resolves.toMatchObject(
        adminDoc1,
      );
      await expect(defaultUserDB.get(adminDoc2._id)).resolves.toMatchObject(
        adminDoc2,
      );
      await expect(defaultUserDB.get(userDoc._id)).resolves.toMatchObject(
        userDoc,
      );
    });
  });

  it("should stop syncing after logout", async () => {
    await service.logInDemoUser();

    TestBed.inject(SessionSubject).next({
      name: adminUser.name,
      id: adminUser.id,
      roles: [],
    });
    database.init(adminDBName);
    TestBed.inject(LoginStateSubject).next(LoginState.LOGGED_IN);
    const adminUserDB = database.getPouchDB();

    const syncedDoc = { _id: "syncedDoc" };
    await adminUserDB.put(syncedDoc);

    database.init(demoUserDBName);
    const defaultUserDB = database.getPouchDB();
    await vi.waitFor(async () => {
      await expect(defaultUserDB.get(syncedDoc._id)).resolves.toMatchObject(
        syncedDoc,
      );
    });

    TestBed.inject(LoginStateSubject).next(LoginState.LOGGED_OUT);
    await vi.waitFor(() => expect((service as any).liveSyncHandle).toBeFalsy());

    const unsyncedDoc = { _id: "unsyncedDoc" };
    await adminUserDB.put(unsyncedDoc);

    await expect(defaultUserDB.get(unsyncedDoc._id)).rejects.toThrow();
  });
});
