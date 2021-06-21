/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { TestBed, waitForAsync } from "@angular/core/testing";
import { SessionService } from "../core/session/session-service/session.service";
import { AppConfig } from "../core/app-config/app-config";
import { AppModule } from "../app.module";
import { SyncState } from "../core/session/session-states/sync-state.enum";
import moment from "moment";
import { ChildrenService } from "../child-dev-project/children/children.service";
import { deleteDB } from "idb";
import { waitForChangeTo } from "../core/session/session-service/session-utils";

const TEST_REMOTE_DATABASE_URL = "http://dev.aam-digital.com/db/";
// WARNING - do not check in credentials into public git repository
const TEST_REMOTE_DATABASE_USER = "[edit before running test]";
const TEST_REMOTE_DATABASE_PASSWORD = "[edit before running test]";

/**
 * These performance tests are actually integration tests that interact with a remote database.
 *
 * You need to enable CORS for the tests to run by editing karma.conf.js replacing `browsers: ['Chrome'],` with the following:
browsers: ['Chrome_without_security'],
customLaunchers:{
  Chrome_without_security:{
    base: 'Chrome',
    flags: ['--disable-web-security']
  }
},
 */
xdescribe("Performance Tests", () => {
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [AppModule],
      }).compileComponents();

      AppConfig.settings = {
        database: {
          name: "app",
          remote_url: TEST_REMOTE_DATABASE_URL,
          timeout: 60000,
          useTemporaryDatabase: false,
        },
      } as any;

      jasmine.DEFAULT_TIMEOUT_INTERVAL = 150000;
    })
  );

  it("sync initial and indexing", async () => {
    // delete previously synced database; uncomment this to start with a clean state and test an initial sync.
    // await deleteAllIndexedDB(db => true);

    const session = TestBed.inject<SessionService>(SessionService);
    const syncTimer = new Timer(true);
    await session.login(
      TEST_REMOTE_DATABASE_USER,
      TEST_REMOTE_DATABASE_PASSWORD
    );
    await session.syncStateStream
      .pipe(waitForChangeTo(SyncState.COMPLETED))
      .toPromise();
    syncTimer.stop();
    console.log("sync time", syncTimer.getDuration());

    // delete index views from previous test runs; comment this to test queries on existing indices
    // await deleteAllIndexedDB(db => db.includes("mrview"));

    const childrenService = TestBed.inject<ChildrenService>(ChildrenService);
    const indexTimer = new Timer(true);
    await childrenService.createDatabaseIndices();
    indexTimer.stop();
    console.log("indexing time", indexTimer.getDuration());

    expect(indexTimer.getDuration()).toBe(0); // display indexing time as failed assertion; see console for details
  });
});

/**
 * Utility class to calculate duration of an action.
 */
class Timer {
  private startTime;
  private stopTime;

  constructor(start: boolean) {
    if (start) {
      this.start();
    }
  }

  start() {
    this.startTime = moment();
  }

  stop() {
    this.stopTime = moment();
    return this.getDuration();
  }

  getDuration() {
    return -this.startTime.diff(this.stopTime ?? moment(), "milliseconds");
  }
}

/**
 * Delete all indexedDB databases in the browser matching the given filter.
 * @param filterFun Filter function taking a database name and returning true if this should be deleted.
 */
export async function deleteAllIndexedDB(
  filterFun: (dbName: string) => boolean
): Promise<void> {
  // @ts-ignore
  const databases = await indexedDB.databases();
  for (const db of databases) {
    if (filterFun(db.name)) {
      console.log("deleting indexedDB", db.name);
      await deleteDB(db.name);
    }
  }
}
