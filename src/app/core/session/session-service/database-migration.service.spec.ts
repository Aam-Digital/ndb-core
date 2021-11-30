import { TestBed } from "@angular/core/testing";

import { DatabaseMigrationService } from "./database-migration.service";
import { PouchDatabase } from "../../database/pouch-database";
import { SessionService } from "./session.service";
import { AppConfig } from "../../app-config/app-config";
import { SessionType } from "../session-type";
import { LocalSession } from "./local-session";

describe("DatabaseMigrationService", () => {
  let service: DatabaseMigrationService;
  let sessionService: jasmine.SpyObj<LocalSession>;
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
    service = new DatabaseMigrationService(sessionService);
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
});
