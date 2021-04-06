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

  afterEach((done) => {
    pouchDatabase.pouchDB.destroy().then(function () {
      done();
    });
  });

  it("get object by _id after put into database", function (done) {
    const id = "test_id";
    const name = "test";
    const count = 42;
    const testData = { _id: id, name: name, count: count };

    pouchDatabase.put(testData).then(
      function () {
        getObjectAndCompare();
      },
      function () {
        expect(false).toBe(true, "promise of pouchDatabase.put failed");
      }
    );

    function getObjectAndCompare() {
      pouchDatabase.get(id).then(
        function (resultData: any) {
          expect(resultData._id).toEqual(id);
          expect(resultData.name).toEqual(name);
          expect(resultData.count).toEqual(count);
          done();
        },
        function () {
          expect(false).toBe(true, "promise of pouchDatabase.get failed");
        }
      );
    }
  });

  it("fails to get by not existing entityId", function (done) {
    pouchDatabase.get("some_id").then(
      function () {
        expect(true).toBe(
          false,
          "retrieved object despite get on non-existing _id"
        );
      },
      function (err: any) {
        expect(err).toBeDefined();
        done();
      }
    );
  });

  it("returns undefined on get by not existing entityId with returnUndefined parameter", function (done) {
    pouchDatabase.get("some_id", {}, true).then(
      function (result) {
        expect(result).toBeUndefined();
        done();
      },
      function (err: any) {
        fail(err);
        done();
      }
    );
  });

  it("getAll returns all objects", function (done) {
    const testData1 = { _id: "x:test_id", name: "test", count: 42 };
    const testData2 = { _id: "y:two", name: "two" };

    pouchDatabase.put(testData1).then(
      function () {
        pouchDatabase.put(testData2).then(
          function () {
            pouchDatabase.getAll().then(
              function (resultData) {
                expect(
                  resultData.findIndex((o) => o._id === testData1._id)
                ).toBeGreaterThan(-1, "testData1 not found in getAll result");
                expect(
                  resultData.findIndex((o) => o._id === testData2._id)
                ).toBeGreaterThan(-1, "testData2 not found in getAll result");
                expect(resultData.length).toBe(
                  2,
                  "getAll result has " +
                    resultData.length +
                    " not expected number of objects"
                );
                done();
              },
              function (err) {
                expect(false).toBe(true, "getAll failed: " + err);
                done();
              }
            );
          },
          function (err) {
            expect(false).toBe(true, "put failed: " + err);
            done();
          }
        );
      },
      function (err) {
        expect(false).toBe(true, "put failed: " + err);
        done();
      }
    );
  });

  it("getAll returns prefixed objects", function (done) {
    const testData1 = { _id: "x:test_id", name: "test", count: 42 };
    const testData2 = { _id: "y:two", name: "two" };
    const prefix = "x";

    // default options for "getAll()": this.allDocs({include_docs: true, startkey: prefix, endkey: prefix + '\ufff0'});
    pouchDatabase.put(testData1).then(
      () => {
        pouchDatabase.put(testData2).then(
          () => {
            pouchDatabase.getAll(prefix).then(
              function (resultData) {
                expect(
                  resultData.findIndex((o) => o._id === testData1._id)
                ).toBeGreaterThan(-1, "testData1 not found in getAll result");
                expect(
                  resultData.findIndex((o) => o._id === testData2._id)
                ).toBe(
                  -1,
                  "testData2 unexpectedly found in getAll result despite other prefix"
                );
                expect(resultData.length).toBe(
                  1,
                  "getAll result has " +
                    resultData.length +
                    " not expected number of objects"
                );
                done();
              },
              function (err) {
                expect(false).toBe(true, "getAll failed: " + err);
              }
            );
          },
          function (err) {
            expect(false).toBe(true, "put failed: " + err);
          }
        );
      },
      function (err) {
        expect(false).toBe(true, "put failed: " + err);
      }
    );
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
