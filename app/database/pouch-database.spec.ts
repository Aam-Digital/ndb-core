import { PouchDatabase } from "./pouch-database";

describe('pouch-database tests', () => {
    let pouchDatabase: PouchDatabase;
    let pouch;

    beforeEach(() => {
        pouch = new PouchDB("unit-test-db");
        pouchDatabase = new PouchDatabase(pouch);
    });

    afterEach(() => {
        pouch.destroy();
    });


    it('get object by _id after put into database', function (done) {
        let id = "test_id";
        let name = "test";
        let count = 42;
        let testData = {_id: id, name: name, count: count};

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
                function (resultData) {
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

    it('fails to get by not existing id', function (done) {
        pouchDatabase.get("some_id").then(
            function () {
                expect(true).toBe(false, "retrieved object despite get on non-existing _id");
            },
            function (err) {
                expect(err).toBeDefined();
                done();
            }
        );
    });

});
