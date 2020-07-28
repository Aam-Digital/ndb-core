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

import { DatabaseIndexingService } from "./database-indexing.service";
import { Database } from "../../database/database";
import { take } from "rxjs/operators";

describe("DatabaseIndexingService", () => {
  let service: DatabaseIndexingService;
  let mockDb: jasmine.SpyObj<Database>;

  beforeEach(() => {
    mockDb = jasmine.createSpyObj("mockDb", ["saveDatabaseIndex", "query"]);
    service = new DatabaseIndexingService(mockDb);
  });

  it("should pass through any query to the database", () => {
    const testQueryName = "test_index/test";
    const mockQueryResult = Promise.resolve({ name: "foo" });
    mockDb.query.and.returnValue(mockQueryResult);

    const actualResult = service.queryIndex(testQueryName, {});

    expect(actualResult).toEqual(mockQueryResult);
    expect(mockDb.query).toHaveBeenCalledWith(testQueryName, {});
  });

  it("should emit new indicesRegistered immediately and then emit update on createIndex", async () => {
    const testIndexName = "test_index";
    const testDesignDoc = {
      _id: "_design/" + testIndexName,
      views: {},
    };
    mockDb.saveDatabaseIndex.and.callFake(
      () => new Promise((resolve) => setTimeout(resolve, 1))
    );

    // initially no registered indices
    expect(await service.indicesRegistered.pipe(take(1)).toPromise()).toEqual(
      []
    );

    // calling `createIndex` triggers a pending index state immediately
    const indexCreationPromise = service.createIndex(testDesignDoc);
    expect(await service.indicesRegistered.pipe(take(1)).toPromise()).toEqual([
      { indexName: testIndexName, pending: true },
    ]);

    // after the index creation is done, registered indices are updated
    await indexCreationPromise;
    expect(await service.indicesRegistered.pipe(take(1)).toPromise()).toEqual([
      { indexName: testIndexName, pending: false },
    ]);

    expect(mockDb.saveDatabaseIndex).toHaveBeenCalledWith(testDesignDoc);
  });

  it("should emit emit update with error when createIndex fails", async () => {
    const testIndexName = "test_index";
    const testDesignDoc = {
      _id: "_design/" + testIndexName,
      views: {},
    };
    const testErr = { msg: "error" };
    mockDb.saveDatabaseIndex.and.callFake(
      () =>
        new Promise((resolve, reject) => setTimeout(() => reject(testErr), 1))
    );

    // calling `createIndex` triggers a pending index state immediately
    const indexCreationPromise = service.createIndex(testDesignDoc);
    expect(await service.indicesRegistered.pipe(take(1)).toPromise()).toEqual([
      { indexName: testIndexName, pending: true },
    ]);

    // after the index creation failed, registered indices are updated with error state
    await expectAsync(indexCreationPromise).toBeRejectedWith(testErr);
    expect(await service.indicesRegistered.pipe(take(1)).toPromise()).toEqual([
      { indexName: testIndexName, pending: false, error: testErr },
    ]);
  });
});
