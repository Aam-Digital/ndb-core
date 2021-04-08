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

import { MockDatabase } from "./mock-database";

describe("PouchDatabase tests", () => {
  let pouchDatabase: MockDatabase;

  beforeEach(() => {
    pouchDatabase = MockDatabase.createWithPouchDB();
  });

  afterEach(async () => {
    await pouchDatabase.destroy();
  });

  it("get object by _id after put into database", async () => {
    const id = "test_id";
    const name = "test";
    const count = 42;
    const testData = { _id: id, name: name, count: count };
    await pouchDatabase.put(testData);
    const resultData = await pouchDatabase.get(id);
    expect(resultData._id).toEqual(id);
    expect(resultData.name).toEqual(name);
    expect(resultData.count).toEqual(count);
  });

  it("put two objects with different _id", async () => {
    const data1 = { _id: "test_id", name: "test" };
    const data2 = { _id: "other_id", name: "test2" };
    await pouchDatabase.put(data1);
    await pouchDatabase.put(data2);
    const result = await pouchDatabase.get(data1._id);
    expect(result._id).toBe(data1._id);
    const result2 = await pouchDatabase.get(data2._id);
    expect(result2._id).toBe(data2._id);
  });

  it("fails to get by not existing _id", () => {
    return expectAsync(pouchDatabase.get("some_id")).toBeRejected();
  });

  it("rejects putting new object with existing _id and no _rev", async () => {
    const testData = { _id: "test_id", name: "test", count: 42 };
    const duplicateData = { _id: "test_id", name: "duplicate", count: 43 };
    await pouchDatabase.put(testData);
    const result = await pouchDatabase.get(testData._id);
    expect(result._id).toBe(testData._id);
    await expectAsync(pouchDatabase.put(duplicateData)).toBeRejected();
    const result2 = await pouchDatabase.get(testData._id);
    expect(result2.name).toBe(testData.name);
  });

  it("removes an existing object", async () => {
    const id = "test_id";
    const name = "test";
    const count = 42;
    const testData = { _id: id, name: name, count: count };
    await pouchDatabase.put(testData);
    await expectAsync(pouchDatabase.get(testData._id)).toBeResolved();
    const savedDocument = await pouchDatabase.get(testData._id);
    await pouchDatabase.remove(savedDocument);
    await expectAsync(pouchDatabase.get(testData._id)).toBeRejected();
  });

  it("returns undefined on get by not existing entityId with returnUndefined parameter", async () => {
    const result = await pouchDatabase.get("some_id", {}, true);
    expect(result).toBeUndefined();
  });

  it("getAll returns all objects", async () => {
    const testData1 = { _id: "x:test_id", name: "test", count: 42 };
    const testData2 = { _id: "y:two", name: "two" };
    await pouchDatabase.put(testData1);
    await pouchDatabase.put(testData2);
    const result = await pouchDatabase.getAll();
    expect(result.map((el) => el._id)).toContain(testData1._id);
    expect(result.map((el) => el._id)).toContain(testData2._id);
    expect(result.length).toBe(2);
  });

  it("getAll returns prefixed objects", async () => {
    const testData1 = { _id: "x:test_id", name: "test", count: 42 };
    const testData2 = { _id: "y:two", name: "two" };
    const prefix = "x";
    await pouchDatabase.put(testData1);
    await pouchDatabase.put(testData2);
    const result = await pouchDatabase.getAll(prefix);
    expect(result.length).toBe(1);
    expect(result.map((el) => el._id)).toContain(testData1._id);
    expect(result.map((el) => el._id)).not.toContain(testData2._id);
  });

  it("saveDatabaseIndex creates new index", async () => {
    const testIndex = { _id: "_design/test_index", views: { a: {}, b: {} } };
    spyOn(pouchDatabase, "put").and.resolveTo();
    const spyOnQuery = spyOn(pouchDatabase, "query").and.resolveTo();

    await pouchDatabase.saveDatabaseIndex(testIndex);
    expect(pouchDatabase.put).toHaveBeenCalledWith(testIndex);

    // expect all indices to be queried
    expect(spyOnQuery).toHaveBeenCalledTimes(2);
    expect(spyOnQuery.calls.allArgs()).toEqual([
      ["test_index/a", { key: "1" }],
      ["test_index/b", { key: "1" }],
    ]);
  });

  it("saveDatabaseIndex updates existing index", async () => {
    const testIndex = { _id: "_design/test_index", views: { a: {}, b: {} } };
    const existingIndex = {
      _id: "_design/test_index",
      _rev: "01",
      views: { a: {} },
    };
    const mockPouchDb = jasmine.createSpyObj("mockPouchDb", ["get", "put"]);
    // @ts-ignore
    pouchDatabase._pouchDB = mockPouchDb;
    mockPouchDb.get.and.resolveTo(existingIndex);
    spyOn(pouchDatabase, "put").and.resolveTo();
    const spyOnQuery = spyOn(pouchDatabase, "query").and.resolveTo();

    await pouchDatabase.saveDatabaseIndex(testIndex);
    expect(pouchDatabase.put).toHaveBeenCalledWith({
      _id: testIndex._id,
      views: testIndex.views,
      _rev: existingIndex._rev,
    });

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
      _rev: "01",
      views: testIndex.views,
    };
    const mockPouchDb = jasmine.createSpyObj("mockPouchDb", ["get", "put"]);
    // @ts-ignore
    pouchDatabase._pouchDB = mockPouchDb;
    mockPouchDb.get.and.resolveTo(existingIndex);
    spyOn(pouchDatabase, "put").and.resolveTo();

    await pouchDatabase.saveDatabaseIndex(testIndex);
    expect(pouchDatabase.put).not.toHaveBeenCalled();
  });

  it("query simply calls through to query", async () => {
    const testQuery = "testquery";
    const testQueryResults = { rows: [] };
    const mockPouchDb = jasmine.createSpyObj("mockPouchDb", ["query"]);
    // @ts-ignore
    pouchDatabase._pouchDB = mockPouchDb;
    mockPouchDb.query.and.resolveTo(testQueryResults);

    const result = await pouchDatabase.query(testQuery, {});
    expect(result).toEqual(testQueryResults);
    expect(mockPouchDb.query).toHaveBeenCalledWith(testQuery, {});
  });
});
