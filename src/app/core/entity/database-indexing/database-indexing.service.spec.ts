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
import { TestBed } from "@angular/core/testing";
import { firstValueFrom, of } from "rxjs";
import { Note } from "../../../child-dev-project/notes/model/note";
import { Entity } from "../model/entity";
import { DatabaseField } from "../database-field.decorator";
import { DatabaseEntity } from "../database-entity.decorator";
import { SyncStateSubject } from "app/core/session/session-type";
import { SyncState } from "app/core/session/session-states/sync-state.enum";
import { DatabaseResolverService } from "../../database/database-resolver.service";

describe("DatabaseIndexingService", () => {
  let service: DatabaseIndexingService;
  let mockDb: any;
  let mockDbResolver: any;

  @DatabaseEntity("TestEntityWithRelation")
  class TestEntityWithRelation extends Entity {
    @DatabaseField({
      dataType: "entity",
      isArray: true,
    })
    relatedEntities: string[];

    @DatabaseField({
      dataType: "date",
    })
    deadline: Date;
  }

  beforeEach(() => {
    mockDb = {
      saveDatabaseIndex: vi.fn().mockName("mockDb.saveDatabaseIndex"),
      query: vi.fn().mockName("mockDb.query"),
    };
    mockDb.saveDatabaseIndex.mockResolvedValue(undefined);
    mockDb.query.mockResolvedValue({});

    mockDbResolver = {
      getDatabase: vi.fn().mockName("DatabaseResolverService.getDatabase"),
    };
    mockDbResolver.getDatabase.mockReturnValue(mockDb);

    TestBed.configureTestingModule({
      providers: [
        { provide: SyncStateSubject, useValue: of(SyncState.COMPLETED) },
        { provide: Database, useValue: mockDb },
        { provide: DatabaseResolverService, useValue: mockDbResolver },
      ],
    });
    service = TestBed.inject(DatabaseIndexingService);
  });

  it("should pass through any query to the database", async () => {
    const testQueryName = "test_index/test";
    const mockQueryResult = { name: "foo" };
    mockDb.query.mockResolvedValue(mockQueryResult);

    const actualResult = await service.queryIndexRaw(testQueryName, {}, true);

    expect(actualResult).toEqual(mockQueryResult);
    expect(mockDb.query).toHaveBeenCalledWith(testQueryName, {});
  });

  it("should wait until index exists before running a query", async () => {
    vi.useFakeTimers();
    try {
      const testQueryName = "test_index/test";
      const testDesignDoc = {
        _id: "_design/" + testQueryName,
        views: {},
      };

      let queryCompleted = false;
      service
        .queryIndexRaw(testQueryName, {})
        .then(() => (queryCompleted = true));
      await vi.advanceTimersByTimeAsync(0);

      expect(queryCompleted).toBe(false);

      service.createIndex(testDesignDoc);
      await vi.advanceTimersByTimeAsync(0);

      expect(queryCompleted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should emit new indicesRegistered immediately and then emit update on createIndex", async () => {
    const testIndexName = "test_index";
    const testDesignDoc = {
      _id: "_design/" + testIndexName,
      views: {},
    };
    mockDb.saveDatabaseIndex.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1)),
    );

    // initially no registered indices
    await expect(firstValueFrom(service.indicesRegistered)).resolves.toEqual(
      [],
    );

    // calling `createIndex` triggers a pending index state immediately
    const indexCreationPromise = service.createIndex(testDesignDoc);
    await expect(firstValueFrom(service.indicesRegistered)).resolves.toEqual([
      {
        title: "Preparing data (Indexing)",
        details: testIndexName,
        pending: true,
      },
    ]);

    // after the index creation is done, registered indices are updated
    await indexCreationPromise;
    await expect(firstValueFrom(service.indicesRegistered)).resolves.toEqual([
      {
        title: "Preparing data (Indexing)",
        details: testIndexName,
        pending: false,
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
    mockDb.saveDatabaseIndex.mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(testErr), 1)),
    );

    // calling `createIndex` triggers a pending index state immediately
    const indexCreationPromise = service.createIndex(testDesignDoc);
    await expect(firstValueFrom(service.indicesRegistered)).resolves.toEqual([
      {
        title: "Preparing data (Indexing)",
        details: testIndexName,
        pending: true,
      },
    ]);

    // after the index creation failed, registered indices are updated with error state
    await expect(indexCreationPromise).rejects.toEqual(testErr);
    await expect(firstValueFrom(service.indicesRegistered)).resolves.toEqual([
      {
        title: "Preparing data (Indexing)",
        details: testIndexName,
        pending: false,
        error: testErr,
      },
    ]);
  });

  it("should only register indices once", async () => {
    const testDesignDoc = {
      _id: "_design/test-index",
      views: {},
    };

    await service.createIndex(testDesignDoc);
    let registeredIndices = await firstValueFrom(service.indicesRegistered);
    expect(registeredIndices).toEqual([
      expect.objectContaining({ details: "test-index" }),
    ]);

    await service.createIndex(testDesignDoc);
    registeredIndices = await firstValueFrom(service.indicesRegistered);
    expect(registeredIndices).toEqual([
      expect.objectContaining({ details: "test-index" }),
    ]);
  });

  it("should generate index for entity property", async () => {
    const call = vi.spyOn(service, "createIndex");
    await service.generateIndexOnProperty(
      "testIndex",
      TestEntityWithRelation,
      "relatedEntities",
    );

    const actualCreatedDesignDoc = vi.mocked(call).mock.calls[0][0];
    expect(cleanedUpStringify(actualCreatedDesignDoc)).toEqual(
      cleanedUpStringify({
        _id: "_design/testIndex",
        views: {
          by_relatedEntities: {
            map: `(doc) => {
            if (!doc._id.startsWith("${TestEntityWithRelation.ENTITY_TYPE}")) return;
            if (!Array.isArray(doc.relatedEntities)) return;
            doc.relatedEntities.forEach((relatedEntity) => {
              emit(relatedEntity);
            });
          }`,
          },
        },
      }),
    );
  });

  it("should generate index for entity property that is not an array", async () => {
    const call = vi.spyOn(service, "createIndex");
    await service.generateIndexOnProperty("testIndex", Note, "category");

    const actualCreatedDesignDoc = vi.mocked(call).mock.calls[0][0];
    expect(
      cleanedUpStringify(actualCreatedDesignDoc.views.by_category.map),
    ).toEqual(
      cleanedUpStringify(`(doc) => {
            if (!doc._id.startsWith("Note")) return;

            emit(doc.category);
          }`),
    );
  });

  it("should generate index for entity property with secondary index", async () => {
    const call = vi.spyOn(service, "createIndex");
    await service.generateIndexOnProperty(
      "testIndex",
      TestEntityWithRelation,
      "relatedEntities",
      "deadline",
    );

    const actualCreatedDesignDoc = vi.mocked(call).mock.calls[0][0];
    expect(
      cleanedUpStringify(actualCreatedDesignDoc.views.by_relatedEntities.map),
    ).toEqual(
      cleanedUpStringify(`(doc) => {
            if (!doc._id.startsWith("${TestEntityWithRelation.ENTITY_TYPE}")) return;
            if (!Array.isArray(doc.relatedEntities)) return;

            doc.relatedEntities.forEach((relatedEntity) => {
              emit([relatedEntity, doc.deadline]);
            });
          }`),
    );
  });
});

function cleanedUpStringify(doc) {
  return JSON.stringify(doc).replace(/\s/g, "").replace(/\\n/g, "");
}
