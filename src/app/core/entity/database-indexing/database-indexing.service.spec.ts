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
import type { Mock } from "vitest";

type DatabaseMock = {
  saveDatabaseIndex: Mock;
  query: Mock;
};

type DatabaseResolverServiceMock = {
  getDatabase: Mock;
};

describe("DatabaseIndexingService", () => {
  let service: DatabaseIndexingService;
  let mockDb: DatabaseMock;
  let mockDbResolver: DatabaseResolverServiceMock;

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

  async function emittedKeys(
    entityType: typeof Entity,
    property: string,
    docs: object[],
    secondaryIndex?: string,
  ): Promise<unknown[]> {
    const call = vi.spyOn(service, "createIndex");
    await service.generateIndexOnProperty(
      "testIndex",
      entityType as any,
      property as any,
      secondaryIndex as any,
    );
    const emitted: unknown[] = [];
    const map = new Function(
      "emit",
      "return " + vi.mocked(call).mock.calls[0][0].views[`by_${property}`].map,
    )((value: unknown) => emitted.push(value));
    docs.forEach((doc) => map(doc));
    return emitted;
  }

  it.each([
    [
      "each element of an array",
      TestEntityWithRelation,
      "relatedEntities",
      { relatedEntities: ["a", "b"] },
      ["a", "b"],
    ],
    [
      "a single value stored in an array field (written before it became an array)",
      TestEntityWithRelation,
      "relatedEntities",
      { relatedEntities: "a" },
      ["a"],
    ],
    ["a single value", Note, "category", { category: "a" }, ["a"]],
    [
      "each element of an array stored in a single-value field (written while it was an array)",
      Note,
      "category",
      { category: ["a", "b"] },
      ["a", "b"],
    ],
    ["nothing for an empty value", Note, "category", {}, []],
  ])("indexes %s", async (_name, entityType, property, values, expected) => {
    const prefix = entityType.ENTITY_TYPE + ":";
    expect(
      await emittedKeys(entityType, property, [
        { _id: prefix + "1", ...values },
      ]),
    ).toEqual(expected);
  });

  it("should only index records of exactly the entity type, not of types whose name starts with the same text", async () => {
    const call = vi.spyOn(service, "createIndex");
    await service.generateIndexOnProperty("testIndex", Note, "category");

    const emitted: any[] = [];
    const map = new Function(
      "emit",
      "return " + vi.mocked(call).mock.calls[0][0].views.by_category.map,
    )((value: any) => emitted.push(value));
    map({ _id: "Note:1", category: "a" });
    map({ _id: "NoteTemplate:1", category: "b" });

    expect(emitted).toEqual(["a"]);
  });

  it("emits the secondary index with each indexed value", async () => {
    expect(
      await emittedKeys(
        TestEntityWithRelation,
        "relatedEntities",
        [
          {
            _id: "TestEntityWithRelation:1",
            relatedEntities: ["a", "b"],
            deadline: "2026-01-01",
          },
        ],
        "deadline",
      ),
    ).toEqual([
      ["a", "2026-01-01"],
      ["b", "2026-01-01"],
    ]);
  });
});
