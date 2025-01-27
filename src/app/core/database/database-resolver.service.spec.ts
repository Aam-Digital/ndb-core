import { TestBed } from "@angular/core/testing";

import { DatabaseResolverService } from "./database-resolver.service";
import { TEST_USER } from "../user/demo-user-generator.service";
import { environment } from "../../../environments/environment";
import { SessionType } from "../session/session-type";
import { SessionInfo } from "../session/auth/session-info";
import { MemoryPouchDatabase } from "./pouchdb/memory-pouch-database";
import { PouchDatabase } from "./pouchdb/pouch-database";
import { SyncedPouchDatabase } from "./pouchdb/synced-pouch-database";

// TODO: Fix tests
xdescribe("DatabaseResolverService", () => {
  let service: DatabaseResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatabaseResolverService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should create a pouchdb with the username of the logged in user", async () => {
    const defaultDb = service.getDatabase();
    spyOn(defaultDb, "init");

    await service.initDatabasesForSession({ name: TEST_USER } as SessionInfo);

    expect(defaultDb.init).toHaveBeenCalledWith(
      TEST_USER + "-" + environment.DB_NAME,
    );
  });

  it("should create the database according to the session type in the environment", async () => {
    async function testDatabaseCreation(
      sessionType: SessionType,
      expectedDB: typeof PouchDatabase | typeof SyncedPouchDatabase,
    ) {
      environment.session_type = sessionType;
      const db = service.getDatabase();
      expect(db).toBeInstanceOf(expectedDB);
    }

    await testDatabaseCreation(SessionType.mock, MemoryPouchDatabase);
    await testDatabaseCreation(SessionType.local, PouchDatabase);
    await testDatabaseCreation(SessionType.synced, SyncedPouchDatabase);
  });
});
