import { DatabaseMigrationService } from "./database-migration.service";
import { PouchDatabase } from "../../database/pouch-database";
import { AppConfig } from "../../app-config/app-config";
import { SessionType } from "../session-type";
import { LocalSession } from "./local-session";
import { AnalyticsService } from "../../analytics/analytics.service";

describe("DatabaseMigrationService", () => {
  let service: DatabaseMigrationService;
  let sessionService: jasmine.SpyObj<LocalSession>;
  let mockAnalytics: jasmine.SpyObj<AnalyticsService>;
  let oldDBName: string;
  let newDBName: string;
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
    await new PouchDatabase().initInMemoryDB(oldDBName).put(testDoc);
    sessionService = jasmine.createSpyObj(["getDatabase"]);
    sessionService.getDatabase.and.returnValue(
      new PouchDatabase().initInMemoryDB(newDBName)
    );
    mockAnalytics = jasmine.createSpyObj(["eventTrack"]);
    service = new DatabaseMigrationService(sessionService, mockAnalytics);
  });

  afterEach(async () => {
    await new PouchDatabase().initInMemoryDB(oldDBName).destroy();
    await new PouchDatabase().initInMemoryDB(newDBName).destroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should add the username the the name of the old database", async () => {
    let newDB = new PouchDatabase().initInMemoryDB(newDBName);
    let oldDB = new PouchDatabase().initInMemoryDB(oldDBName);
    await expectAsync(oldDB.get(testDoc._id)).toBeResolved();
    await expectAsync(newDB.get(testDoc._id)).toBeRejected();

    await service.migrateToDatabasePerUser();

    // oldDB has to be re-created because it was deleted inside migration script
    oldDB = new PouchDatabase().initInMemoryDB(oldDBName);
    await expectAsync(oldDB.get(testDoc._id)).toBeRejected();
    await expectAsync(newDB.get(testDoc._id)).toBeResolved();
  });

  it("should not replicate if the database has already been closed", async () => {
    let oldDB = new PouchDatabase().initInMemoryDB(oldDBName);
    await oldDB.destroy();

    await service.migrateToDatabasePerUser();

    oldDB = new PouchDatabase().initInMemoryDB(oldDBName);
    await expectAsync(oldDB.get(testDoc._id)).toBeRejected();
    const newDB = new PouchDatabase().initInMemoryDB(newDBName);
    await expectAsync(newDB.get(testDoc._id)).toBeRejected();
    const info = await newDB.getPouchDB().info();
    expect(info.doc_count).toBe(0);
  });

  it("should remove the design docs before sync so they will be correctly re-created", async () => {
    let oldDB = new PouchDatabase().initInMemoryDB(oldDBName);
    const designDoc = { _id: "_design/search_index" };
    const normalDoc = { _id: "Child:someChild" };
    await oldDB.put(designDoc);
    await oldDB.put(normalDoc);

    await service.migrateToDatabasePerUser();

    const newDB = new PouchDatabase().initInMemoryDB(newDBName);
    await expectAsync(newDB.get(designDoc._id)).toBeRejected();
    await expectAsync(newDB.get(normalDoc._id)).toBeResolved();
  });

  it("should track a matomo event when migration happens", async () => {
    let oldDB = new PouchDatabase().initInMemoryDB(oldDBName);
    const normalDoc = { _id: "Child:someChild" };
    await oldDB.put(normalDoc);

    await service.migrateToDatabasePerUser();

    expect(mockAnalytics.eventTrack).toHaveBeenCalledWith(
      "migrated db to db-per-user",
      {
        category: "Migration",
      }
    );
  });
});
