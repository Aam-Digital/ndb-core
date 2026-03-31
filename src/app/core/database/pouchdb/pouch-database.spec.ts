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

import { PouchDatabase } from "./pouch-database";
import { MemoryPouchDatabase } from "./memory-pouch-database";
import { SyncStateSubject } from "app/core/session/session-type";

describe("PouchDatabase tests", () => {
  let database: PouchDatabase;
  let syncStateSubject: SyncStateSubject;

  beforeEach(() => {
    syncStateSubject = new SyncStateSubject();
    database = new MemoryPouchDatabase("unit-test-db", syncStateSubject);
    database.init();
  });

  afterEach(() => database.destroy());

  it("get object by _id after put into database", async () => {
    const id = "test_id";
    const name = "test";
    const count = 42;
    const testData = { _id: id, name: name, count: count };
    await database.put(testData);
    const resultData = await database.get(id);
    expect(resultData).toEqual(
      expect.objectContaining({
        _id: id,
        name: name,
        count: count,
      }),
    );
  });

  it("put two objects with different _id", async () => {
    const data1 = { _id: "test_id", name: "test" };
    const data2 = { _id: "other_id", name: "test2" };
    await database.put(data1);
    await database.put(data2);
    const result = await database.get(data1._id);
    expect(result._id).toBe(data1._id);
    const result2 = await database.get(data2._id);
    expect(result2._id).toBe(data2._id);
  });

  it("fails to get by not existing _id", () => {
    return expect(database.get("some_id")).rejects.toThrow();
  });

  it("rejects putting new object with existing _id and no _rev with forceOverwrite being false", async () => {
    const testData = { _id: "test_id", name: "test", count: 42 };
    const duplicateData = { _id: "test_id", name: "duplicate", count: 43 };
    await database.put(testData);
    const result = await database.get(testData._id);
    expect(result._id).toBe(testData._id);
    await expect(database.put(duplicateData)).rejects.toThrow();
    const result2 = await database.get(testData._id);
    expect(result2.name).toBe(testData.name);
  });

  it("allows overwriting an existing object with existing _id and no _rev with forceOverwrite being true", async () => {
    const testData = { _id: "test_id", name: "test", count: 42 };
    const duplicateData = { _id: "test_id", name: "duplicate", count: 43 };
    await database.put(testData);
    const result = await database.get(testData._id);
    expect(result._id).toBe(testData._id);
    await expect(database.put(duplicateData, true)).resolves.not.toThrow();
    const result2 = await database.get(testData._id);
    expect(result2.name).toBe(duplicateData.name);
  });

  it("allows overwriting object with existing _id and a wrong _rev with forceOverwrite being true", async () => {
    const testData = { _id: "test_id", name: "test" };
    const duplicateData = {
      _id: "test_id",
      name: "duplicate",
      _rev: "1234blabla",
    };
    await database.put(testData);
    const result = await database.get(testData._id);
    expect(result._id).toBe(testData._id);
    await expect(database.put(duplicateData, true)).resolves.not.toThrow();
    const result2 = await database.get(testData._id);
    expect(result2.name).toBe(duplicateData.name);
  });

  it("allows saving a new object even when the _rev field is set with forceOverwrite being true", async () => {
    const testData = { _id: "test_id", name: "test", _rev: "1234blabla" };
    await expect(database.put(testData, true)).resolves.not.toThrow();
    const result2 = await database.get(testData._id);
    expect(result2.name).toBe(testData.name);
  });

  it("removes an existing object", async () => {
    const id = "test_id";
    const name = "test";
    const count = 42;
    const testData = { _id: id, name: name, count: count };
    await database.put(testData);
    await expect(database.get(testData._id)).resolves.not.toThrow();
    const savedDocument = await database.get(testData._id);
    await database.remove(savedDocument);
    await expect(database.get(testData._id)).rejects.toThrow();
  });

  it("returns undefined on get by not existing entityId with returnUndefined parameter", async () => {
    const result = await database.get("some_id", {}, true);
    expect(result).toBeUndefined();
  });

  it("getAll returns all objects", async () => {
    const testData1 = { _id: "x:test_id", name: "test", count: 42 };
    const testData2 = { _id: "y:two", name: "two" };
    await database.put(testData1);
    await database.put(testData2);
    const result = await database.getAll();
    expect(result.map((el) => el._id)).toContain(testData1._id);
    expect(result.map((el) => el._id)).toContain(testData2._id);
    expect(result).toHaveLength(2);
  });

  it("getAll returns prefixed objects", async () => {
    const testData1 = { _id: "x:test_id", name: "test", count: 42 };
    const testData2 = { _id: "y:two", name: "two" };
    const prefix = "x";
    await database.put(testData1);
    await database.put(testData2);
    const result = await database.getAll(prefix);
    expect(result).toHaveLength(1);
    expect(result.map((el) => el._id)).toContain(testData1._id);
    expect(result.map((el) => el._id)).not.toContain(testData2._id);
  });

  it("saveDatabaseIndex creates new index", async () => {
    const testIndex = { _id: "_design/test_index", views: { a: {}, b: {} } };
    vi.spyOn(database, "put").mockResolvedValue(undefined);

    await database.saveDatabaseIndex(testIndex);
    expect(database.put).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: testIndex._id,
        views: testIndex.views,
        aam_version: "test",
      }),
    );
  });

  it("saveDatabaseIndex updates existing index", async () => {
    const testIndex = { _id: "_design/test_index", views: { a: {}, b: {} } };
    await database.put({
      _id: testIndex._id,
      views: { a: {} },
    });
    const existingIndex = await database.get(testIndex._id);
    vi.spyOn(database, "put").mockResolvedValue(undefined);

    await database.saveDatabaseIndex(testIndex);
    expect(database.put).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: testIndex._id,
        _rev: existingIndex._rev,
        views: testIndex.views,
        aam_version: "test",
      }),
    );
  });

  it("saveDatabaseIndex does not update unchanged index", async () => {
    const testIndex = { _id: "_design/test_index", views: { a: {}, b: {} } };
    const existingIndex = {
      _id: "_design/test_index",
      views: testIndex.views,
    };
    await database.put(existingIndex);
    vi.spyOn(database, "put").mockResolvedValue(undefined);

    await database.saveDatabaseIndex(testIndex);
    expect(database.put).not.toHaveBeenCalled();
  });

  it("saveDatabaseIndex always updates local index even if server has newer version", async () => {
    const testIndex = { _id: "_design/test_index", views: { a: {}, b: {} } };
    const existingIndex = {
      _id: "_design/test_index",
      views: { old: {} },
      aam_version: "v99.0.0",
    };
    await database.put(existingIndex);
    const existingDoc = await database.get(existingIndex._id);
    vi.spyOn(database, "put").mockResolvedValue(undefined);

    await database.saveDatabaseIndex(testIndex);
    expect(database.put).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: testIndex._id,
        _rev: existingDoc._rev,
        views: testIndex.views,
        aam_version: "test",
      }),
    );
  });

  it("query simply calls through to pouchDB query", async () => {
    const testQuery = "testquery";
    const testQueryResults = { rows: [] } as any;
    const pouchDB = database.getPouchDB();
    vi.spyOn(pouchDB, "query").mockResolvedValue(testQueryResults);

    const result = await database.query(testQuery, {});
    expect(result).toEqual(testQueryResults);
    expect(pouchDB.query).toHaveBeenCalledWith(testQuery, {});
  });

  it("writes all the docs to the database with putAll", async () => {
    await database.putAll([
      {
        _id: "5",
        name: "The Grinch",
      },
      {
        _id: "8",
        name: "Santa Claus",
      },
    ]);

    await expect(database.get("5")).resolves.toEqual(
      expect.objectContaining({
        _id: "5",
        name: "The Grinch",
      }),
    );
    await expect(database.get("8")).resolves.toEqual(
      expect.objectContaining({
        _id: "8",
        name: "Santa Claus",
      }),
    );
  });

  it("Throws errors for each conflict individually", async () => {
    const resolveConflictSpy = vi.spyOn(database as any, "resolveConflict");
    const conflictError = new Error();
    resolveConflictSpy.mockRejectedValue(conflictError);
    await database.put({
      _id: "3",
      name: "Rudolph, the Red-Nosed Reindeer",
    });
    const dataWithConflicts = [
      {
        _id: "3",
        name: "Rudolph, the Pink-Nosed Reindeer",
        _rev: "1-invalid_rev",
      },
      {
        _id: "4",
        name: "Dasher",
      },
      {
        _id: "5",
        name: "Dancer",
      },
    ];

    await expect(database.putAll(dataWithConflicts)).rejects.toEqual([
      expect.any(Error),
      expect.objectContaining({ id: "4", ok: true }),
      expect.objectContaining({ id: "5", ok: true }),
    ]);
    expect(vi.mocked(resolveConflictSpy).mock.calls).toEqual([
      [
        {
          _id: "3",
          name: "Rudolph, the Pink-Nosed Reindeer",
          _rev: "1-invalid_rev",
        },
        false,
        expect.objectContaining({ status: 409 }),
      ],
    ]);
  });

  it("should correctly determine if database is empty", async () => {
    await expect(database.isEmpty()).resolves.toEqual(true);

    await database.put({ _id: "User:test" });

    await expect(database.isEmpty()).resolves.toEqual(false);
  });

  describe("purge", () => {
    it("should purge doc and emit changes deletion event", async () => {
      await database.put({ _id: "Child:2", name: "test" });

      const db = database.getPouchDB();
      const rawPurgeSpy = vi.fn().mockResolvedValue({});
      (db as any).purge = rawPurgeSpy;

      const emittedChanges: any[] = [];
      database.changes().subscribe((doc) => emittedChanges.push(doc));

      const result = await database.purge("Child:2");

      expect(result).toBe(true);
      expect(rawPurgeSpy).toHaveBeenCalledTimes(1);
      expect(vi.mocked(rawPurgeSpy).mock.calls[0][0]).toBe("Child:2");
      expect(emittedChanges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ _id: "Child:2", _deleted: true }),
        ]),
      );
    });

    it("should return false if the document does not exist", async () => {
      const result = await database.purge("NonExistent:1");

      expect(result).toBe(false);
    });

    it("should throw error if purge fails with other than 404", async () => {
      await database.put({ _id: "Child:1", name: "test" });

      const db = database.getPouchDB();
      (db as any).purge = vi
        .fn()
        .mockRejectedValue({ status: 500, message: "server error" });

      await expect(database.purge("Child:1")).rejects.toEqual(
        expect.objectContaining({ status: 500 }),
      );
    });

    it("should purge all conflicting revisions of a document", async () => {
      await database.put({ _id: "Child:1", name: "test" });

      const db = database.getPouchDB();
      const rawPurgeSpy = vi.fn().mockResolvedValue({});
      (db as any).purge = rawPurgeSpy;

      // Simulate a doc with one conflict
      const realGet = db.get.bind(db);
      vi.spyOn(db, "get").mockImplementation(async (id: string, opts?: any) => {
        const doc = await realGet(id, opts);
        if (opts?.conflicts) {
          (doc as any)._conflicts = ["1-conflict"];
        }
        return doc;
      });

      const result = await database.purge("Child:1");

      expect(result).toBe(true);
      expect(db.get).toHaveBeenCalledWith(
        "Child:1",
        expect.objectContaining({ conflicts: true }),
      );
      expect(rawPurgeSpy).toHaveBeenCalledTimes(2);
      expect(vi.mocked(rawPurgeSpy).mock.calls[0][0]).toBe("Child:1");
      expect(vi.mocked(rawPurgeSpy).mock.calls[1]).toEqual([
        "Child:1",
        "1-conflict",
      ]);
    });
  });
});
