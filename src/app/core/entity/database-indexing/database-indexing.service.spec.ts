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
import { EntitySchemaService } from "../schema/entity-schema.service";
import { expectObservable } from "../../../utils/test-utils/observable-utils";
import { fakeAsync, flush, tick } from "@angular/core/testing";
import { SessionService } from "../../session/session-service/session.service";
import { BehaviorSubject } from "rxjs";
import { LoginState } from "../../session/session-states/login-state.enum";
import { take } from "rxjs/operators";

describe("DatabaseIndexingService", () => {
  let service: DatabaseIndexingService;
  let mockDb: jasmine.SpyObj<Database>;
  let mockSession: jasmine.SpyObj<SessionService>;
  let loginState: BehaviorSubject<LoginState>;

  beforeEach(() => {
    mockDb = jasmine.createSpyObj("mockDb", ["saveDatabaseIndex", "query"]);
    loginState = new BehaviorSubject(LoginState.LOGGED_OUT);
    mockSession = jasmine.createSpyObj([], { loginState });
    service = new DatabaseIndexingService(
      mockDb,
      new EntitySchemaService(),
      mockSession
    );
  });

  afterEach(() => {
    loginState.complete();
  });

  it("should pass through any query to the database", async () => {
    const testQueryName = "test_index/test";
    const mockQueryResult = { name: "foo" };
    mockDb.query.and.resolveTo(mockQueryResult);

    const actualResult = await service.queryIndexRaw(testQueryName, {}, true);

    expect(actualResult).toEqual(mockQueryResult);
    expect(mockDb.query).toHaveBeenCalledWith(testQueryName, {});
  });

  it("should wait until index exists before running a query", fakeAsync(() => {
    const testQueryName = "test_index/test";
    const testDesignDoc = {
      _id: "_design/" + testQueryName,
      views: {},
    };

    let queryCompleted = false;
    service
      .queryIndexRaw(testQueryName, {})
      .then(() => (queryCompleted = true));
    tick();

    expect(queryCompleted).toBeFalse();

    service.createIndex(testDesignDoc);
    tick();

    expect(queryCompleted).toBeTrue();
  }));

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
    await expectObservable(service.indicesRegistered).first.toBeResolvedTo([]);

    // calling `createIndex` triggers a pending index state immediately
    const indexCreationPromise = service.createIndex(testDesignDoc);
    await expectObservable(service.indicesRegistered).first.toBeResolvedTo([
      {
        title: "Preparing data (Indexing)",
        details: testIndexName,
        pending: true,
        designDoc: testDesignDoc,
      },
    ]);

    // after the index creation is done, registered indices are updated
    await indexCreationPromise;
    await expectObservable(service.indicesRegistered).first.toBeResolvedTo([
      {
        title: "Preparing data (Indexing)",
        details: testIndexName,
        pending: false,
        designDoc: testDesignDoc,
      },
    ]);

    expect(mockDb.saveDatabaseIndex).toHaveBeenCalledWith(testDesignDoc);
  });

  it("should emit update with error when createIndex fails", async () => {
    const testIndexName = "test_index";
    const testDesignDoc = {
      _id: "_design/" + testIndexName,
      views: {},
    };
    const testErr = { msg: "error" };
    mockDb.saveDatabaseIndex.and.callFake(
      () => new Promise((_, reject) => setTimeout(() => reject(testErr), 1))
    );

    // calling `createIndex` triggers a pending index state immediately
    const indexCreationPromise = service.createIndex(testDesignDoc);
    await expectObservable(service.indicesRegistered).first.toBeResolvedTo([
      {
        title: "Preparing data (Indexing)",
        details: testIndexName,
        pending: true,
        designDoc: testDesignDoc,
      },
    ]);

    // after the index creation failed, registered indices are updated with error state
    await expectAsync(indexCreationPromise).toBeRejectedWith(testErr);
    await expectObservable(service.indicesRegistered).first.toBeResolvedTo([
      {
        title: "Preparing data (Indexing)",
        details: testIndexName,
        pending: false,
        error: testErr,
        designDoc: testDesignDoc,
      },
    ]);
  });

  it("should re-create indices whenever a new user logs in", fakeAsync(() => {
    const testDesignDoc = {
      _id: "_design/test-index",
      views: {},
    };

    service.createIndex(testDesignDoc);
    tick();

    expect(mockDb.saveDatabaseIndex.calls.allArgs()).toEqual([[testDesignDoc]]);

    loginState.next(LoginState.LOGGED_IN);

    tick();
    expect(mockDb.saveDatabaseIndex.calls.allArgs()).toEqual([
      [testDesignDoc],
      [testDesignDoc],
    ]);
    flush();
  }));

  it("should only register indices once", async () => {
    const testDesignDoc = {
      _id: "_design/test-index",
      views: {},
    };

    await service.createIndex(testDesignDoc);
    let registeredIndices = await service.indicesRegistered
      .pipe(take(1))
      .toPromise();
    expect(registeredIndices).toEqual([
      jasmine.objectContaining({ details: "test-index" }),
    ]);

    await service.createIndex(testDesignDoc);
    registeredIndices = await service.indicesRegistered
      .pipe(take(1))
      .toPromise();
    expect(registeredIndices).toEqual([
      jasmine.objectContaining({ details: "test-index" }),
    ]);
  });
});
