import type { Mock } from "vitest";
import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";

import { SystemResetService } from "./system-reset.service";
import { BackupService } from "../backup/backup.service";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { LOCATION_TOKEN, NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { PouchDatabase } from "../../database/pouchdb/pouch-database";
import { MemoryPouchDatabase } from "../../database/pouchdb/memory-pouch-database";
import { DatabaseResolverService } from "../../database/database-resolver.service";
import { SyncStateSubject } from "app/core/session/session-type";
import {
  DatabaseEntity,
  entityRegistry,
  EntityRegistry,
} from "../../entity/database-entity.decorator";
import { Entity } from "../../entity/model/entity";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { UserAdminService } from "../../user/user-admin-service/user-admin.service";
import { SessionSubject } from "../../session/auth/session-info";
// import the entity types used in the specs below, so that they are registered
import "../../config/config";
import "../../basic-datatypes/configurable-enum/configurable-enum";
import "../../site-settings/site-settings";
import "../../import/import-metadata";
import "#src/app/features/reporting/report-config";
import { mockMatDialogRef } from "#src/app/utils/test-utils/dialog-mocks";

/** a record type that login accounts can be linked to (i.e. holding "user profiles") */
@DatabaseEntity("SystemResetUserProfileTestEntity")
class SystemResetUserProfileTestEntity extends Entity {
  static override readonly enableUserAccounts = true;
}

describe("SystemResetService", () => {
  let service: SystemResetService;
  let db: PouchDatabase;
  let mockUserAdminService: { getAllUsers: Mock };
  let sessionSubject: SessionSubject;

  const mockBackupService = {
    getDatabaseExport: vi.fn(),
    restoreData: vi.fn(),
  };
  const mockLocation = { pathname: "/admin" };
  const mockNavigator = { onLine: true };
  let onActionSubscriber: () => any;
  const mockSnackBarRef = {
    onAction: vi.fn().mockReturnValue({
      subscribe: (fn: () => any) => (onActionSubscriber = fn),
    }),
  };
  const mockSnackBar = {
    open: vi.fn().mockReturnValue(mockSnackBarRef),
  };
  const confirmationDialogMock = {
    getConfirmation: vi.fn(),
    getConfirmationWithKeyword: vi.fn(),
    showProgressDialog: vi.fn().mockReturnValue(mockMatDialogRef()),
  };

  /** confirm every dialog, as the user does before an action actually runs */
  function userConfirms() {
    confirmationDialogMock.getConfirmationWithKeyword.mockResolvedValue(true);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.pathname = "/admin";
    mockNavigator.onLine = true;
    onActionSubscriber = undefined;
    // read the real database, so that the restore point reflects when it was taken
    mockBackupService.getDatabaseExport.mockImplementation(() => db.getAll());
    mockSnackBar.open.mockReturnValue(mockSnackBarRef);
    confirmationDialogMock.showProgressDialog.mockReturnValue(
      mockMatDialogRef(),
    );

    db = new MemoryPouchDatabase("unit-test-db", new SyncStateSubject());
    db.init();

    mockUserAdminService = { getAllUsers: vi.fn().mockReturnValue(of([])) };
    sessionSubject = new SessionSubject();
    sessionSubject.next({
      name: "admin",
      id: "admin",
      roles: [UserAdminService.ACCOUNT_MANAGER_ROLE],
    });

    TestBed.configureTestingModule({
      providers: [
        SystemResetService,
        { provide: BackupService, useValue: mockBackupService },
        {
          provide: ConfirmationDialogService,
          useValue: confirmationDialogMock,
        },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: LOCATION_TOKEN, useValue: mockLocation },
        { provide: NAVIGATOR_TOKEN, useValue: mockNavigator },
        {
          provide: DatabaseResolverService,
          useValue: { getDatabase: () => db },
        },
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: UserAdminService, useValue: mockUserAdminService },
        { provide: SessionSubject, useValue: sessionSubject },
      ],
    });
    service = TestBed.inject(SystemResetService);
  });

  afterEach(async () => {
    await db.destroy();
  });

  describe("emptyRecords (Empty Records)", () => {
    it("should delete records of user-facing types", async () => {
      userConfirms();
      await db.put({ _id: TestEntity.ENTITY_TYPE + ":1" });
      await db.put({ _id: TestEntity.ENTITY_TYPE + ":2" });

      await service.emptyRecords();

      expect(await db.getAll()).toEqual([]);
    });

    it("should delete records of types that are not registered (anymore)", async () => {
      userConfirms();
      await db.put({ _id: "SomeRemovedType:1" });

      await service.emptyRecords();

      expect(await db.getAll()).toEqual([]);
    });

    it("should keep the system configuration", async () => {
      userConfirms();
      const configDocs = [
        "Config:CONFIG_ENTITY",
        "Config:Permissions",
        "ConfigurableEnum:genders",
        "SiteSettings:global",
        "ReportConfig:1",
      ];
      for (const _id of configDocs) {
        await db.put({ _id });
      }
      await db.put({ _id: TestEntity.ENTITY_TYPE + ":1" });

      await service.emptyRecords();

      const byId = (a: string, b: string) => a.localeCompare(b);
      expect((await db.getAll()).map((doc) => doc._id).toSorted(byId)).toEqual(
        configDocs.toSorted(byId),
      );
    });

    it("should keep database indices, because the app keeps running without a reload", async () => {
      userConfirms();
      await db.put({ _id: "_design/some_index", views: {} });

      await service.emptyRecords();

      expect((await db.getAll()).map((doc) => doc._id)).toEqual([
        "_design/some_index",
      ]);
    });

    it("should keep only those records that a login account is linked to", async () => {
      userConfirms();
      const withAccount = SystemResetUserProfileTestEntity.ENTITY_TYPE + ":1";
      const withoutAccount =
        SystemResetUserProfileTestEntity.ENTITY_TYPE + ":2";
      await db.put({ _id: withAccount });
      await db.put({ _id: withoutAccount });
      mockUserAdminService.getAllUsers.mockReturnValue(
        of([{ id: "keycloak-1", userEntityId: withAccount, enabled: true }]),
      );

      await service.emptyRecords();

      expect((await db.getAll()).map((doc) => doc._id)).toEqual([withAccount]);
    });

    it("should keep all records that could have an account if the accounts cannot be looked up", async () => {
      userConfirms();
      const profileIds = [
        SystemResetUserProfileTestEntity.ENTITY_TYPE + ":1",
        SystemResetUserProfileTestEntity.ENTITY_TYPE + ":2",
      ];
      for (const _id of profileIds) {
        await db.put({ _id });
      }
      await db.put({ _id: TestEntity.ENTITY_TYPE + ":1" });
      mockUserAdminService.getAllUsers.mockReturnValue(
        throwError(() => new Error("no access to user management")),
      );

      await service.emptyRecords();

      expect((await db.getAll()).map((doc) => doc._id)).toEqual(profileIds);
    });

    it("should delete the import history together with the imported records", async () => {
      userConfirms();
      await db.put({ _id: "ImportMetadata:1" });

      await service.emptyRecords();

      expect(await db.getAll()).toEqual([]);
    });

    it("should not delete any records if the user does not confirm", async () => {
      confirmationDialogMock.getConfirmationWithKeyword.mockResolvedValue(
        false,
      );
      await db.put({ _id: TestEntity.ENTITY_TYPE + ":1" });

      await service.emptyRecords();

      expect(await db.getAll()).toHaveLength(1);
    });

    it("should only export the restore point once the deletion actually goes ahead", async () => {
      confirmationDialogMock.getConfirmationWithKeyword.mockResolvedValue(
        false,
      );

      await service.emptyRecords();

      expect(mockBackupService.getDatabaseExport).not.toHaveBeenCalled();
    });

    it("should offer to undo emptying records by restoring the previous data", async () => {
      userConfirms();
      await db.put({ _id: TestEntity.ENTITY_TYPE + ":1" });

      await service.emptyRecords();
      await onActionSubscriber();

      // the restore point has to be exported before the records are deleted,
      // otherwise the undo silently restores nothing
      const [restoredDocs] = mockBackupService.restoreData.mock.calls[0];
      expect(restoredDocs.map((doc) => doc._id)).toEqual([
        TestEntity.ENTITY_TYPE + ":1",
      ]);
    });
  });

  describe("resetSystem (Reset System)", () => {
    it("should delete records and the complete system configuration", async () => {
      userConfirms();
      for (const _id of [
        TestEntity.ENTITY_TYPE + ":1",
        "Config:CONFIG_ENTITY",
        "Config:Permissions",
        "ConfigurableEnum:genders",
        "SiteSettings:global",
        "ReportConfig:1",
        "ImportMetadata:1",
      ]) {
        await db.put({ _id });
      }

      await service.resetSystem();

      expect(await db.getAll()).toEqual([]);
    });

    it("should delete database indices, which are recreated on the reload right after", async () => {
      userConfirms();
      await db.put({ _id: "_design/some_index", views: {} });

      await service.resetSystem();

      expect(await db.getAll()).toEqual([]);
      expect(mockLocation.pathname).toBe("");
    });

    it("should not touch the replication checkpoints of the sync", async () => {
      userConfirms();
      await db.put({ _id: "_local/checkpoint", last_seq: 5 });

      await service.resetSystem();

      expect(await db.get("_local/checkpoint")).toBeTruthy();
    });

    it("should keep only the profile of the user performing the reset", async () => {
      userConfirms();
      const ownProfile = SystemResetUserProfileTestEntity.ENTITY_TYPE + ":own";
      const otherProfile =
        SystemResetUserProfileTestEntity.ENTITY_TYPE + ":other";
      await db.put({ _id: ownProfile });
      await db.put({ _id: otherProfile });
      await db.put({ _id: "Config:CONFIG_ENTITY" });
      sessionSubject.next({
        name: "admin",
        id: "admin",
        roles: [],
        entityId: ownProfile,
      });

      await service.resetSystem();

      expect((await db.getAll()).map((doc) => doc._id)).toEqual([ownProfile]);
      // other users' profiles are deleted, so the accounts do not have to be queried
      expect(mockUserAdminService.getAllUsers).not.toHaveBeenCalled();
    });

    it("should delete all profiles if the current user has none linked", async () => {
      userConfirms();
      await db.put({
        _id: SystemResetUserProfileTestEntity.ENTITY_TYPE + ":1",
      });

      await service.resetSystem();

      expect(await db.getAll()).toEqual([]);
    });

    it("should not reset the system if the user does not confirm", async () => {
      confirmationDialogMock.getConfirmationWithKeyword.mockResolvedValue(
        false,
      );
      await db.put({ _id: "Config:CONFIG_ENTITY" });

      await service.resetSystem();

      expect(await db.getAll()).toHaveLength(1);
      expect(mockLocation.pathname).toBe("/admin");
    });
  });

  it("should refuse to delete records while offline, to avoid conflicts with other users", async () => {
    mockNavigator.onLine = false;
    await db.put({ _id: TestEntity.ENTITY_TYPE + ":1" });

    await service.emptyRecords();
    await service.resetSystem();

    expect(await db.getAll()).toHaveLength(1);
    expect(
      confirmationDialogMock.getConfirmationWithKeyword,
    ).not.toHaveBeenCalled();
  });
});
