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

describe("PouchDatabase tests", () => {
  let database: PouchDatabase;

  beforeEach(() => {
    database = PouchDatabase.create();
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
      jasmine.objectContaining({
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
    return expectAsync(database.get("some_id")).toBeRejected();
  });

  it("rejects putting new object with existing _id and no _rev with forceOverwrite being false", async () => {
    const testData = { _id: "test_id", name: "test", count: 42 };
    const duplicateData = { _id: "test_id", name: "duplicate", count: 43 };
    await database.put(testData);
    const result = await database.get(testData._id);
    expect(result._id).toBe(testData._id);
    await expectAsync(database.put(duplicateData)).toBeRejected();
    const result2 = await database.get(testData._id);
    expect(result2.name).toBe(testData.name);
  });

  it("allows overwriting an existing object with existing _id and no _rev with forceOverwrite being true", async () => {
    const testData = { _id: "test_id", name: "test", count: 42 };
    const duplicateData = { _id: "test_id", name: "duplicate", count: 43 };
    await database.put(testData);
    const result = await database.get(testData._id);
    expect(result._id).toBe(testData._id);
    await expectAsync(database.put(duplicateData, true)).toBeResolved();
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
    await expectAsync(database.put(duplicateData, true)).toBeResolved();
    const result2 = await database.get(testData._id);
    expect(result2.name).toBe(duplicateData.name);
  });

  it("allows saving a new object even when the _rev field is set with forceOverwrite being true", async () => {
    const testData = { _id: "test_id", name: "test", _rev: "1234blabla" };
    await expectAsync(database.put(testData, true)).toBeResolved();
    const result2 = await database.get(testData._id);
    expect(result2.name).toBe(testData.name);
  });

  it("removes an existing object", async () => {
    const id = "test_id";
    const name = "test";
    const count = 42;
    const testData = { _id: id, name: name, count: count };
    await database.put(testData);
    await expectAsync(database.get(testData._id)).toBeResolved();
    const savedDocument = await database.get(testData._id);
    await database.remove(savedDocument);
    await expectAsync(database.get(testData._id)).toBeRejected();
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
    expect(result).toHaveSize(2);
  });

  it("getAll returns prefixed objects", async () => {
    const testData1 = { _id: "x:test_id", name: "test", count: 42 };
    const testData2 = { _id: "y:two", name: "two" };
    const prefix = "x";
    await database.put(testData1);
    await database.put(testData2);
    const result = await database.getAll(prefix);
    expect(result).toHaveSize(1);
    expect(result.map((el) => el._id)).toContain(testData1._id);
    expect(result.map((el) => el._id)).not.toContain(testData2._id);
  });

  it("saveDatabaseIndex creates new index", async () => {
    const testIndex = { _id: "_design/test_index", views: { a: {}, b: {} } };
    spyOn(database, "put").and.resolveTo();
    const spyOnQuery = spyOn(database, "query").and.resolveTo();

    await database.saveDatabaseIndex(testIndex);
    expect(database.put).toHaveBeenCalledWith(testIndex, true);

    // expect all indices to be queried
    expect(spyOnQuery).toHaveBeenCalledTimes(2);
    expect(spyOnQuery.calls.allArgs()).toEqual([
      ["test_index/a", { key: "1" }],
      ["test_index/b", { key: "1" }],
    ]);
  });

  it("saveDatabaseIndex updates existing index", async () => {
    const testIndex = { _id: "_design/test_index", views: { a: {}, b: {} } };
    await database.put({
      _id: testIndex._id,
      views: { a: {} },
    });
    const existingIndex = await database.get(testIndex._id);
    spyOn(database, "put").and.resolveTo();
    const spyOnQuery = spyOn(database, "query").and.resolveTo();

    await database.saveDatabaseIndex(testIndex);
    expect(database.put).toHaveBeenCalledWith(
      {
        _id: testIndex._id,
        _rev: existingIndex._rev,
        views: testIndex.views,
      },
      true,
    );

    // expect all indices to be queried
    expect(spyOnQuery).toHaveBeenCalledTimes(2);
    expect(spyOnQuery.calls.allArgs()).toEqual([
      ["test_index/a", { key: "1" }],
      ["test_index/b", { key: "1" }],
    ]);
  });

  it("saveDatabaseIndex does not update unchanged index", async () => {
    const testIndex = { _id: "_design/test_index", views: { a: {}, b: {} } };
    const existingIndex = {
      _id: "_design/test_index",
      views: testIndex.views,
    };
    await database.put(existingIndex);
    spyOn(database, "put").and.resolveTo();

    await database.saveDatabaseIndex(testIndex);
    expect(database.put).not.toHaveBeenCalled();
  });

  it("query simply calls through to pouchDB query", async () => {
    const testQuery = "testquery";
    const testQueryResults = { rows: [] } as any;
    const pouchDB = database.getPouchDB();
    spyOn(pouchDB, "query").and.resolveTo(testQueryResults);

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

    await expectAsync(database.get("5")).toBeResolvedTo(
      jasmine.objectContaining({
        _id: "5",
        name: "The Grinch",
      }),
    );
    await expectAsync(database.get("8")).toBeResolvedTo(
      jasmine.objectContaining({
        _id: "8",
        name: "Santa Claus",
      }),
    );
  });

  it("Throws errors for each conflict individually", async () => {
    const resolveConflictSpy = spyOn<any>(database, "resolveConflict");
    const conflictError = new Error();
    resolveConflictSpy.and.rejectWith(conflictError);
    await database.put({
      _id: "3",
      name: "Rudolph, the Red-Nosed Reindeer",
    });
    const dataWithConflicts = [
      {
        _id: "3",
        name: "Rudolph, the Pink-Nosed Reindeer",
        _rev: "1-invalid-rev",
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

    const results = await database.putAll(dataWithConflicts);
    expect(resolveConflictSpy.calls.allArgs()).toEqual([
      [
        {
          _id: "3",
          name: "Rudolph, the Pink-Nosed Reindeer",
          _rev: "1-invalid-rev",
        },
        false,
        jasmine.objectContaining({ status: 409 }),
      ],
    ]);
    expect(results).toEqual([
      conflictError,
      jasmine.objectContaining({ id: "4", ok: true }),
      jasmine.objectContaining({ id: "5", ok: true }),
    ]);
  });

  it("should correctly determine if database is empty", async () => {
    await expectAsync(database.isEmpty()).toBeResolvedTo(true);

    await database.put({ _id: "User:test" });

    await expectAsync(database.isEmpty()).toBeResolvedTo(false);
  });
});
