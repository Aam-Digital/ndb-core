import { DatabaseMigrationService } from "./database-migration.service";
import { PouchDatabase } from "../../database/pouch-database";
import { AppConfig } from "../../app-config/app-config";
import { SessionType } from "../session-type";
import { AnalyticsService } from "../../analytics/analytics.service";
import { waitForAsync } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";

describe("DatabaseMigrationService", () => {
  let service: DatabaseMigrationService;
  let mockAnalytics: jasmine.SpyObj<AnalyticsService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockLocation: jasmine.SpyObj<Location>;
  let oldDBName: string;
  let newDBName: string;
  let newDB: PouchDatabase;
  let oldDB: PouchDatabase;
  const testDoc = { _id: "doc" };

  beforeEach(async () => {
    AppConfig.settings = {
      site_name: "Aam Digital - DEV",
      session_type: SessionType.mock,
      database: {
        name: "test-db-name",
        remote_url: "https://demo.aam-digital.com/db/",
      },
    };
    oldDBName = AppConfig.settings.database.name;
    newDBName = "user-" + oldDBName;
    newDB = new PouchDatabase(undefined).initInMemoryDB(newDBName);
    oldDB = new PouchDatabase(undefined).initInMemoryDB(oldDBName);
    await oldDB.put(testDoc);
    mockAnalytics = jasmine.createSpyObj(["eventTrack"]);
    mockLocation = jasmine.createSpyObj(["reload"]);
    mockDialog = jasmine.createSpyObj(["open"]);
    mockDialog.open.and.returnValue({ close: () => {} } as any);
    service = new DatabaseMigrationService(
      mockAnalytics,
      mockDialog,
      mockLocation
    );
  });

  afterEach(
    waitForAsync(() => {
      new PouchDatabase(undefined).initInMemoryDB(newDBName).destroy();
      new PouchDatabase(undefined).initInMemoryDB(oldDBName).destroy();
    })
  );

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should add the username to the name of the old database", async () => {
    await expectAsync(oldDB.get(testDoc._id)).toBeResolved();
    await expectAsync(newDB.get(testDoc._id)).toBeRejected();

    await service.migrateOldDatabaseTo(newDB);

    // oldDB has to be re-created because it was deleted inside migration script
    oldDB = new PouchDatabase(undefined).initInMemoryDB(oldDBName);
    await expectAsync(oldDB.get(testDoc._id)).toBeRejected();
    await expectAsync(newDB.get(testDoc._id)).toBeResolved();
  });

  it("should not replicate if the database has already been closed", async () => {
    await oldDB.destroy();

    await service.migrateOldDatabaseTo(newDB);

    oldDB = new PouchDatabase(undefined).initInMemoryDB(oldDBName);
    await expectAsync(oldDB.get(testDoc._id)).toBeRejected();
    await expectAsync(newDB.get(testDoc._id)).toBeRejected();
    const info = await newDB.getPouchDB().info();
    expect(info.doc_count).toBe(0);
  });

  it("should track a matomo event when migration happens", async () => {
    const normalDoc = { _id: "Child:someChild" };
    await oldDB.put(normalDoc);

    await service.migrateOldDatabaseTo(newDB);

    expect(mockAnalytics.eventTrack).toHaveBeenCalledWith(
      "migrated db to db-per-user",
      {
        category: "Migration",
      }
    );
  });
});
