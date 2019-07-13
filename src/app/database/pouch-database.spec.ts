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

import { PouchDatabase } from './pouch-database';
import PouchDB from 'pouchdb-browser';
import {AlertService} from '../alerts/alert.service';
import {LoggingService} from '../logging/logging.service';

describe('PouchDatabase tests', () => {
  let pouchDatabase: PouchDatabase;
  let pouch: any;
  let originalTimeout;

  beforeEach(() => {
    pouch = new PouchDB('unit-test-db');
    pouchDatabase = new PouchDatabase(pouch, new AlertService(null, new LoggingService()));

    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;
  });

  afterEach((done) => {
    pouch.destroy().then(
      function () {
        done();
      });

    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  it('get object by _id after put into database', function (done) {
    const id = 'test_id';
    const name = 'test';
    const count = 42;
    const testData = {_id: id, name: name, count: count};

    pouchDatabase.put(testData).then(
      function () {
        getObjectAndCompare();
      },
      function () {
        expect(false).toBe(true, 'promise of pouchDatabase.put failed');
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
          expect(false).toBe(true, 'promise of pouchDatabase.get failed');
        }
      );
    }
  });

  it('fails to get by not existing entityId', function (done) {
    pouchDatabase.get('some_id').then(
      function () {
        expect(true).toBe(false, 'retrieved object despite get on non-existing _id');
      },
      function (err: any) {
        expect(err).toBeDefined();
        done();
      }
    );
  });



  it('getAll returns all objects', function (done) {
    const testData1 = {_id: 'x:test_id', name: 'test', count: 42};
    const testData2 = {_id: 'y:two', name: 'two'};

    pouchDatabase.put(testData1).then(function () {
      pouchDatabase.put(testData2).then(function () {
        pouchDatabase.getAll().then(
          function (resultData) {
            expect(resultData.findIndex(o => o._id === testData1._id))
              .toBeGreaterThan(-1, 'testData1 not found in getAll result');
            expect(resultData.findIndex(o => o._id === testData2._id))
              .toBeGreaterThan(-1, 'testData2 not found in getAll result');
            expect(resultData.length)
              .toBe(2, 'getAll result has ' + resultData.length + ' not expected number of objects');
            done();
          },
          function (err) {
            expect(false).toBe(true, 'getAll failed: ' + err);
            done();
          });
        },
        function (err) {
          expect(false).toBe(true, 'put failed: ' + err);
          done();
        });
      },
      function (err) {
        expect(false).toBe(true, 'put failed: ' + err);
        done();
      });
  });

  it('getAll returns prefixed objects', function (done) {
    const testData1 = {_id: 'x:test_id', name: 'test', count: 42};
    const testData2 = {_id: 'y:two', name: 'two'};
    const prefix = 'x';

    // default options for "getAll()": this.allDocs({include_docs: true, startkey: prefix, endkey: prefix + '\ufff0'});
    pouchDatabase.put(testData1).then(() => {
      pouchDatabase.put(testData2).then(() => {
        pouchDatabase.getAll(prefix).then(
          function (resultData) {
            expect(resultData.findIndex(o => o._id === testData1._id))
              .toBeGreaterThan(-1, 'testData1 not found in getAll result');
            expect(resultData.findIndex(o => o._id === testData2._id))
              .toBe(-1, 'testData2 unexpectedly found in getAll result despite other prefix');
            expect(resultData.length)
              .toBe(1, 'getAll result has ' + resultData.length + ' not expected number of objects');
            done();
          },
          function (err) {
            expect(false).toBe(true, 'getAll failed: ' + err);
          });
      },
      function (err) {
        expect(false).toBe(true, 'put failed: ' + err);
      });
    },
    function (err) {
      expect(false).toBe(true, 'put failed: ' + err);
    });
  });

});
